package org.jahia.modules.mfa.impl;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.jahia.modules.mfa.*;
import org.jahia.services.content.JCRTemplate;
import org.jahia.services.content.decorator.JCRUserNode;
import org.jahia.services.usermanager.JahiaUserManagerService;
import org.osgi.service.component.annotations.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.RepositoryException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.Serializable;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Implementation of MFA service with MfaSession as the single source of truth.
 * Contains all MFA business logic and delegates to registry only for provider lookup.
 */
@Component(service = MfaService.class, immediate = true)
public class MfaServiceImpl implements MfaService {
    private static final Logger logger = LoggerFactory.getLogger(MfaServiceImpl.class);
    private static final String MFA_SESSION_KEY = "mfa_session";
    private static final String MFA_SUSPENDED_USER_MIXIN = "mfa:suspendedUser";
    private static final String MFA_SUSPENDED_SINCE_PROP = "mfa:suspendedSince";
    private static final String TOO_MANY_FAILED_ATTEMPTS_MESSAGE = "Too many failed authentication attempts";

    private JahiaUserManagerService userManagerService;
    private MfaFactorRegistry factorRegistry;
    private volatile MfaConfigurationService mfaConfigurationService;
    private volatile Cache<String, AuthFailuresDetails> failuresCache;

    @Reference
    public void setUserManagerService(JahiaUserManagerService userManagerService) {
        this.userManagerService = userManagerService;
    }
    @Reference
    public void setFactorRegistry(MfaFactorRegistry factorRegistry) {
        this.factorRegistry = factorRegistry;
    }

    @Reference(
            policy = ReferencePolicy.DYNAMIC,
            policyOption = ReferencePolicyOption.GREEDY,
            updated = "setOrUpdateMfaConfigurationService"
    )
    public void setOrUpdateMfaConfigurationService(MfaConfigurationService mfaConfigurationService) {
        this.mfaConfigurationService = mfaConfigurationService;
        logger.info("Updating Caffeine cache for MFA auth failures...");
        createCaffeineCache();
        logger.info("Caffeine cache updated.");
    }

    public void unsetOrUpdateMfaConfigurationService(MfaConfigurationService mfaConfigurationService) {
        this.mfaConfigurationService = null;
    }

    @Activate
    protected void activate() {
        logger.info("Initializing Caffeine cache for MFA auth failures...");
        createCaffeineCache();
        logger.info("Caffeine cache initialized.");
    }

    private void createCaffeineCache() {
        failuresCache = Caffeine.newBuilder()
                .expireAfterWrite(mfaConfigurationService.getAuthFailuresWindowSeconds(), TimeUnit.SECONDS)
                .build();
    }

    @Deactivate
    protected void deactivate() {
        logger.info("Clearing Caffeine cache for MFA auth failures...");
        failuresCache.invalidateAll();
        failuresCache.cleanUp();
        logger.info("Caffeine cache cleared.");
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
    public MfaSession initiateMfa(String username, String password, String siteKey, HttpServletRequest request) {
        logger.info("Initiating MFA for user: {}", username);

        // Todo - site user check ?
        boolean siteUser = false;
        JCRUserNode user = AuthHelper.lookupUserFromCredentials(username, password, siteUser ? siteKey : null);
        if (user == null) {
            logger.warn("Invalid credentials for user: {}", username);
            throw new IllegalArgumentException("Invalid username or password");
        }

        HttpSession httpSession = request.getSession(true);
        Locale userLocale;
        try {
            userLocale = user.hasProperty("preferredLanguage") ?
                    new Locale(user.getPropertyAsString("preferredLanguage")) : Locale.ENGLISH;
        } catch (RepositoryException e) {
            throw new IllegalStateException(e);
        }
        MfaSession mfaSession = new MfaSession(username, siteKey, userLocale);
        mfaSession.setState(MfaSessionState.IN_PROGRESS);
        httpSession.setAttribute(MFA_SESSION_KEY, mfaSession);

        logger.info("MFA session created for user: {}", username);
        return mfaSession;
    }

    @Override
    public MfaSession prepareFactor(String factorType, HttpServletRequest request, HttpServletResponse response) {
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
            PreparationContext preparationContext = new PreparationContext(session, user, request, response);
            Object preparationResult = provider.prepare(preparationContext);
            // TODO: why is the prepare result stored in the session independently, could be part of the MfaSession ?
            request.getSession().setAttribute(getAttributeKey(factorType), preparationResult);
            session.markFactorPrepared(provider.getFactorType());
            logger.info("Factor {} preparation completed for user: {}", factorType, session.getUserId());
        } catch (MfaException mfaException) {
            session.markFactorPreparationFailed(factorType, mfaException.getMessage());
            logger.error("Factor {} preparation failed for user: {}", factorType, session.getUserId(), mfaException.getCause());
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
                logger.warn("User {} is suspended", user.getIdentifier());
                session.markFactorVerificationFailed(factorType, TOO_MANY_FAILED_ATTEMPTS_MESSAGE);
                return session;

            }
            if (hasReachedAuthFailuresCountLimit(user.getPath(), provider)) {
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
                trackFailure(user.getPath(), provider);
                session.markFactorVerificationFailed(factorType, "Invalid verification code"); // TODO more generic
            }
            if (isAllRequiredFactorsCompleted(session)) {
                session.setState(MfaSessionState.COMPLETED);
                logger.info("All MFA factors completed for user: {}, proceed with authentication", session.getUserId());
                AuthHelper.authenticateUser(request, user);
                failuresCache.invalidate(user.getPath()); // clear any failure attempts for that user
            }
        } catch (MfaException mfaException) {
            session.markFactorVerificationFailed(factorType, mfaException.getMessage());
            logger.error("Factor {} verification failed for user: {}", factorType, session.getUserId(), mfaException.getCause());
        } catch (Exception e) {
            session.markFactorVerificationFailed(factorType, "Verification failed: " + e.getMessage());
            logger.error("Factor {} verification failed for user: {}", factorType, session.getUserId(), e);
        }

        return session;
    }

    private boolean isUserSuspended(String userPath) throws MfaException {
        try {
            return JCRTemplate.getInstance().doExecuteWithSystemSession(session -> {
                JCRUserNode userNode = (JCRUserNode) session.getNode(userPath);
                if (!userNode.hasProperty(MFA_SUSPENDED_SINCE_PROP)) {
                    logger.debug("User {} is not suspended", userNode);
                    return false;
                }
                Calendar suspendedUntil = userNode.getProperty(MFA_SUSPENDED_SINCE_PROP).getDate();
                suspendedUntil.add(Calendar.SECOND, mfaConfigurationService.getUserTemporarySuspensionSeconds());
                // check if the suspension has expired
                if (suspendedUntil.compareTo(Calendar.getInstance()) > 0) {
                    logger.debug("User {} is suspended until {}", userNode, suspendedUntil);
                    return true;
                }
                logger.debug("User {} is no longer suspended, removing its suspension in the JCR", userNode);
                userNode.removeMixin(MFA_SUSPENDED_USER_MIXIN);
                session.save();
                return false;
            });
        } catch (RepositoryException e) {
            throw new MfaException("Failed to check if the user is suspended", e);
        }
    }

    private void suspendUserInJCR(String userPath) throws MfaException {

        try {
            JCRTemplate.getInstance().doExecuteWithSystemSession(session -> {
                Calendar suspendedSince = Calendar.getInstance();
                JCRUserNode userNode = (JCRUserNode) session.getNode(userPath);
                logger.debug("Marking user {} as suspended...", userNode);
                userNode.addMixin(MFA_SUSPENDED_USER_MIXIN);
                userNode.setProperty(MFA_SUSPENDED_SINCE_PROP, suspendedSince);
                logger.debug("Property '{}' set to {}", MFA_SUSPENDED_SINCE_PROP, suspendedSince);
                session.save();
                return null;
            });
        } catch (RepositoryException e) {
            throw new MfaException("Failed to mark user as suspended", e);
        }
        failuresCache.invalidate(userPath); // no need to track failures anymore
    }

    private void trackFailure(String userNodePath, MfaFactorProvider provider) {
        AuthFailuresDetails tracker = failuresCache.getIfPresent(userNodePath);
        if (tracker == null) {
            tracker = new AuthFailuresDetails();
        }
        String factorType = provider.getFactorType();
        tracker.addFailureAttempt(factorType);
        if (tracker.getFailureAttemptsCount(factorType) > mfaConfigurationService.getMaxAuthFailuresBeforeLock()) {
            logger.warn("User {} has failed to authenticate {} times in a row", userNodePath, tracker.getFailureAttemptsCount(factorType));
        } else {
            logger.debug("User {} has failed to authenticate {} times in a row", userNodePath, tracker.getFailureAttemptsCount(factorType));
        }
        failuresCache.put(userNodePath, tracker);
    }

    private boolean hasReachedAuthFailuresCountLimit(String userNodePath, MfaFactorProvider provider) {
        AuthFailuresDetails tracker = failuresCache.getIfPresent(userNodePath);
        if (tracker == null) {
            logger.debug("User {} has not failed to authenticate yet", userNodePath);
            return false;
        }
        String factorType = provider.getFactorType();
        if (tracker.removeAttemptsOutsideWindow(factorType, mfaConfigurationService.getAuthFailuresWindowSeconds() * 1000L)) {
            logger.debug("Expired timestamps removed for user {}", userNodePath);
            failuresCache.put(userNodePath, tracker);
        }

        return tracker.getFailureAttemptsCount(factorType) >= mfaConfigurationService.getMaxAuthFailuresBeforeLock();
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
