package org.jahia.modules.mfa.impl;

import org.jahia.modules.mfa.*;
import org.jahia.services.content.decorator.JCRUserNode;
import org.jahia.services.usermanager.JahiaUserManagerService;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import java.io.Serializable;
import java.util.Arrays;
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

    private JahiaUserManagerService userManagerService;
    private MfaFactorRegistry factorRegistry;
    private MfaConfigurationService mfaConfigurationService;

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

    // ===== PUBLIC INTERFACE IMPLEMENTATION =====

    @Override
    public boolean isEnabled() {
        return mfaConfigurationService.isEnabled();
    }

    @Override
    public List<String> getAvailableFactors() {
        String[] enabledFactorsConfig = mfaConfigurationService.getEnabledFactors();
        if (enabledFactorsConfig == null || enabledFactorsConfig.length == 0) {
            return Collections.emptyList(); // Return empty list if no factors configured
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
            Serializable preparationResult = (Serializable) request.getSession().getAttribute(getAttributeKey(factorType));
            VerificationContext verificationContext = new VerificationContext(user, request, preparationResult, verificationData);
            if (provider.verify(verificationContext)) {
                // Clear preparation result after successful verification
                request.getSession().removeAttribute(getAttributeKey(factorType));
                session.markFactorCompleted(factorType);
            } else {
                session.markFactorVerificationFailed(factorType, "Invalid verification code"); // TODO more generic
            }

            if (session.isFactorCompleted(factorType)) {
                logger.info("Factor {} verified successfully for user: {}", factorType, session.getUserId());

                if (isAllRequiredFactorsCompleted(session)) {
                    session.setState(MfaSessionState.COMPLETED);
                    logger.info("All MFA factors completed for user: {}, proceed with authentication", session.getUserId());
                    AuthHelper.authenticateUser(request, user);
                }
            } else {
                String error = session.getFactorVerificationError(factorType);
                logger.warn("Factor {} verification failed for user: {} - {}", factorType, session.getUserId(), error);
            }
        } catch (Exception e) {
            session.markFactorVerificationFailed(factorType, "Verification failed: " + e.getMessage());
            logger.error("Factor {} verification failed for user: {}", factorType, session.getUserId(), e);
        }

        return session;
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
