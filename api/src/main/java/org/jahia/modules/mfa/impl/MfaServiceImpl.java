package org.jahia.modules.mfa.impl;

import org.jahia.api.Constants;
import org.jahia.modules.mfa.*;
import org.jahia.services.content.JCRTemplate;
import org.jahia.services.content.decorator.JCRUserNode;
import org.jahia.services.usermanager.JahiaUserManagerService;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Deactivate;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.RepositoryException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import java.io.Serializable;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of MFA service with MfaSession as the single source of truth.
 * Contains all MFA business logic and delegates to registry only for provider lookup.
 */
@Component(service = MfaService.class, immediate = true)
public class MfaServiceImpl implements MfaService {
    private static final Logger logger = LoggerFactory.getLogger(MfaServiceImpl.class);
    private static final String MFA_SESSION_KEY = "mfa_session";
    private static final String MFA_SUSPENDED_UNTIL_PROP = "mfa:suspendedUntil";
    private static final String TOO_MANY_FAILED_ATTEMPTS_MESSAGE = "Too many failed authentication attempts";

    private JahiaUserManagerService userManagerService;
    private MfaFactorRegistry factorRegistry;
    private MfaConfigurationService mfaConfigurationService;
    private AuthFailuresTracker authFailuresTracker;

    @Reference
    public void setUserManagerService(JahiaUserManagerService userManagerService) {
        this.userManagerService = userManagerService;
    }

    @Reference
    public void setFactorRegistry(MfaFactorRegistry factorRegistry) {
        this.factorRegistry = factorRegistry;
    }

    @Reference
    public void setMfaConfigurationService(MfaConfigurationService mfaConfigurationService) {
        this.mfaConfigurationService = mfaConfigurationService;
    }

    @Reference
    public void setAuthFailuresTracker(AuthFailuresTracker authFailuresTracker) {
        this.authFailuresTracker = authFailuresTracker;
    }

    @Activate
    protected void activate() {
        authFailuresTracker.addEvictionListener(this::authFailuresDetailsEvicted);
    }

    @Deactivate
    protected void deactivate() {
        authFailuresTracker.removeEvictionListener(this::authFailuresDetailsEvicted);
    }

    // ===== PUBLIC INTERFACE IMPLEMENTATION =====

    @Override
    public List<String> getAvailableFactors() {
        String[] enabledFactorsConfig = mfaConfigurationService.getEnabledFactors();
        if (enabledFactorsConfig == null || enabledFactorsConfig.length == 0) {
            return Collections.emptyList(); // Return an empty list if no factors configured
        }

        List<String> configuredFactors = Arrays.stream(enabledFactorsConfig)
                .filter(factor -> factor != null && !factor.trim().isEmpty())
                .map(String::trim)
                .collect(Collectors.toList());

        // Filter to only include factors that have registered providers
        return configuredFactors.stream()
                .filter(factorType -> factorRegistry.lookupProvider(factorType) != null)
                .collect(Collectors.toList());
    }

    @Override
    public MfaSession initiateMfa(String username, String password, HttpServletRequest request) {
        logger.info("Initiating MFA for user: {}", username);

        String site = null; // TODO - handle site users

        JCRUserNode user = AuthHelper.lookupUserFromCredentials(username, password, site);
        if (user == null) {
            logger.warn("Invalid credentials for user: {}", username);
            throw new IllegalArgumentException("Invalid username or password");
        }

        HttpSession httpSession = request.getSession(true);
        MfaSession mfaSession = new MfaSession(username, httpSession.getId());
        mfaSession.setState(MfaSessionState.IN_PROGRESS);

        httpSession.setAttribute(MFA_SESSION_KEY, mfaSession);

        logger.info("MFA session created for user: {}", username);
        return mfaSession;
    }

    @Override
    public MfaSession prepareFactor(String factorType, HttpServletRequest request) {
        MfaSession session = getMfaSession(request);
        if (session == null) {
            throw new IllegalStateException("No active MFA session found");
        }

        MfaFactorProvider provider = factorRegistry.lookupProvider(factorType);
        if (provider == null) {
            session.markFactorPreparationFailed(factorType, "Factor type not supported: " + factorType);
            return session;
        }

        JCRUserNode user = userManagerService.lookupUser(session.getUserId());
        if (user == null) {
            session.markFactorPreparationFailed(factorType, "User not found");
            return session;
        }

        try {
            PreparationContext preparationContext = new PreparationContext(user, request);
            Object preparationResult = provider.prepare(preparationContext);
            request.getSession().setAttribute(getAttributeKey(factorType), preparationResult);
            session.markFactorPrepared(provider.getFactorType());
            logger.info("Factor {} preparation completed for user: {}", factorType, session.getUserId());
        } catch (MfaException mfaException) {
            session.markFactorPreparationFailed(factorType, mfaException.getMessage());
            logger.error("Factor {} preparation failed for user: {}", factorType, session.getUserId(), mfaException);
        } catch (Exception e) {
            session.markFactorPreparationFailed(factorType, "Preparation failed: " + e.getMessage());
            logger.error("Factor {} preparation failed for user: {}", factorType, session.getUserId(), e);
        }

        return session;
    }

    @Override
    public MfaSession verifyFactor(String factorType, HttpServletRequest request, Serializable verificationData) {
        MfaSession session = getMfaSession(request);
        if (session == null) {
            throw new IllegalStateException("No active MFA session found");
        }

        if (!session.isFactorPrepared(factorType)) {
            session.markFactorVerificationFailed(factorType, "Factor not prepared");
            return session;
        }

        MfaFactorProvider provider = factorRegistry.lookupProvider(factorType);
        if (provider == null) {
            session.markFactorVerificationFailed(factorType, "Factor type not supported: " + factorType);
            return session;
        }

        // TODO - reset mfa session if user is not found at this stage, better handling of user recheck during MFA steps
        JCRUserNode user = userManagerService.lookupUser(session.getUserId());
        if (user == null) {
            session.markFactorVerificationFailed(factorType, "User not found");
            return session;
        }

        try {
            if (isUserSuspended(user.getPath())) {
                logger.info("User {} is suspended", user.getIdentifier());
                session.markFactorVerificationFailed(factorType, TOO_MANY_FAILED_ATTEMPTS_MESSAGE);
                return session;

            }
            if (authFailuresTracker.hasReachedAuthFailuresCountLimit(user.getPath(), provider)) {
                suspendUserInJCR(user.getPath());
                session.markFactorVerificationFailed(factorType, TOO_MANY_FAILED_ATTEMPTS_MESSAGE);
                return session;
            }
            Serializable preparationResult = (Serializable) request.getSession().getAttribute(getAttributeKey(factorType));
            VerificationContext verificationContext = new VerificationContext(user, request, preparationResult, verificationData);
            if (provider.verify(verificationContext)) {
                // Clear preparation result after successful verification
                request.getSession().removeAttribute(getAttributeKey(factorType));
                session.markFactorCompleted(factorType);
                logger.info("Factor {} verified successfully for user: {}", factorType, session.getUserId());
            } else {
                authFailuresTracker.trackFailure(user.getPath(), provider);
                session.markFactorVerificationFailed(factorType, "Invalid verification code"); // TODO more generic
            }
            if (isAllRequiredFactorsCompleted(session)) {
                session.setState(MfaSessionState.COMPLETED);
                logger.info("All MFA factors completed for user: {}, proceed with authentication", session.getUserId());
                AuthHelper.authenticateUser(request, user);
            }
        } catch (Exception e) {
            session.markFactorVerificationFailed(factorType, "Verification failed: " + e.getMessage());
            logger.error("Factor {} verification failed for user: {}", factorType, session.getUserId(), e);
        }

        return session;
    }

    private boolean isUserSuspended(String userPath) {
        try {
            // TODO which workspace to use? both?
            return JCRTemplate.getInstance().doExecuteWithSystemSessionAsUser(null, Constants.LIVE_WORKSPACE, null, session -> {
                JCRUserNode userNode = (JCRUserNode) session.getNode(userPath);
                if (!userNode.hasProperty(MFA_SUSPENDED_UNTIL_PROP)) {
                    logger.debug("User {} is not suspended", userNode);
                    return false;
                }
                Calendar suspendedUntil = userNode.getProperty(MFA_SUSPENDED_UNTIL_PROP).getDate();
                // check if the suspension has expired
                if (suspendedUntil != null && suspendedUntil.compareTo(Calendar.getInstance()) > 0) {
                    logger.debug("User {} is suspended until {}", userNode, suspendedUntil);
                    return true;
                }
                logger.debug("User {} is not suspended, removing its {} property", userNode, MFA_SUSPENDED_UNTIL_PROP);
                userNode.setProperty(MFA_SUSPENDED_UNTIL_PROP, (Calendar) null);
                session.save();
                return false;
            });
        } catch (RepositoryException e) {
            logger.warn("Failed to check if user {} is suspended", userPath, e);
            return false; // safer to consider the user not suspended in this case, to not block the MFA workflow
        }
    }

    private void suspendUserInJCR(String userPath) {

        try {
            // TODO which workspace to use? both?
            JCRTemplate.getInstance().doExecuteWithSystemSessionAsUser(null, Constants.LIVE_WORKSPACE, null, session -> {
                Calendar suspendedUntil = Calendar.getInstance();
                suspendedUntil.add(Calendar.SECOND, mfaConfigurationService.getUserTemporarySuspensionSeconds());
                JCRUserNode userNode = (JCRUserNode) session.getNode(userPath);
                logger.debug("Marking user {} as suspended...", userNode);
                userNode.setProperty(MFA_SUSPENDED_UNTIL_PROP, suspendedUntil);
                logger.debug("Property '{}' set to {}", MFA_SUSPENDED_UNTIL_PROP, suspendedUntil);
                session.save();
                return null;
            });
        } catch (RepositoryException e) {
            logger.warn("Failed to mark user {} as suspended", userPath, e);
        }
    }

    private void authFailuresDetailsEvicted(String userNodePath, AuthFailuresDetails authFailuresDetails) {
        logger.info("Auth failures details evicted for user: {}", userNodePath);
        try {
            JCRTemplate.getInstance().doExecuteWithSystemSessionAsUser(null, Constants.LIVE_WORKSPACE, null, session -> {
                JCRUserNode userNode = (JCRUserNode) session.getNode(userNodePath);
                logger.debug("Removing property {} for user {} that has been evicted from the tracker", MFA_SUSPENDED_UNTIL_PROP, userNodePath);
                userNode.setProperty(MFA_SUSPENDED_UNTIL_PROP, (Calendar) null);
                session.save();
                return false;
            });
        } catch (RepositoryException e) {
            logger.warn("Failed to remove property {} for user {} that has been evicted from the tracker", MFA_SUSPENDED_UNTIL_PROP, userNodePath, e);
        }
    }

    @Override
    public MfaSession getMfaSession(HttpServletRequest request) {
        HttpSession httpSession = request.getSession(false);
        if (httpSession == null) {
            return null;
        }
        return (MfaSession) httpSession.getAttribute(MFA_SESSION_KEY);
    }

    @Override
    public void clearMfaSession(HttpServletRequest request) {
        HttpSession httpSession = request.getSession(false);
        if (httpSession != null) {
            httpSession.removeAttribute(MFA_SESSION_KEY);
            logger.info("MFA session cleared");
        }
    }

    // ===== PRIVATE HELPER METHODS =====

    private boolean isAllRequiredFactorsCompleted(MfaSession session) {
        // For now, we require at least one factor to be completed
        // This can be made configurable later
        return !session.getCompletedFactors().isEmpty();
    }


    private static String getAttributeKey(String factorType) {
        return String.format("%s.preparationResult.%s", MfaServiceImpl.class.getSimpleName(), factorType);
    }

}
