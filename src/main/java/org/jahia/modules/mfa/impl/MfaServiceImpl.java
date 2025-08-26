package org.jahia.modules.mfa.impl;

import org.jahia.modules.mfa.*;
import org.jahia.services.content.decorator.JCRUserNode;
import org.jahia.services.usermanager.JahiaUserManagerService;
import org.osgi.service.component.annotations.*;
import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.Designate;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Implementation of MFA service with MfaSession as the single source of truth.
 * Contains all MFA business logic and delegates to registry only for provider lookup.
 */
@Component(configurationPid = "org.jahia.modules.mfa", service = {org.jahia.modules.mfa.MfaService.class}, immediate = true, configurationPolicy = ConfigurationPolicy.REQUIRE)
@Designate(ocd = MfaServiceImpl.Config.class)
public class MfaServiceImpl implements org.jahia.modules.mfa.MfaService {
    private static final Logger logger = LoggerFactory.getLogger(MfaServiceImpl.class);
    private static final String MFA_SESSION_KEY = "mfa_session";

    private Config configInstance;
    private JahiaUserManagerService userManagerService;
    private MfaFactorRegistry factorRegistry;

    @ObjectClassDefinition(name = "%configName", description = "%configDesc", localization = "OSGI-INF/l10n/config")
    public @interface Config {
        @AttributeDefinition(name = "%loginUrl", description = "%loginUrlDesc")
        String loginUrl();

        @AttributeDefinition(name = "%enabled", description = "%enabledDesc", defaultValue = "false")
        boolean enabled();

        @AttributeDefinition(name = "%enabledFactors", description = "%enabledFactorsDesc")
        String[] enabledFactors() default {"email_code"};
    }

    @Reference
    public void setUserManagerService(JahiaUserManagerService userManagerService) {
        this.userManagerService = userManagerService;
    }

    @Reference
    public void setFactorRegistry(MfaFactorRegistry factorRegistry) {
        this.factorRegistry = factorRegistry;
    }

    public Config getConfigInstance() {
        return configInstance;
    }

    @Activate
    public void activate(Config config) {
        this.configInstance = config;
        logger.info("MFA Service activated with enabled={}", config.enabled());
    }

    @Modified
    public void modified(Config config) {
        this.configInstance = config;
        logger.info("MFA Service configuration modified with enabled={}", config.enabled());
    }

    // ===== PUBLIC INTERFACE IMPLEMENTATION =====

    @Override
    public boolean isEnabled() {
        return configInstance.enabled();
    }

    @Override
    public List<String> getAvailableFactors() {
        String[] enabledFactorsConfig = configInstance.enabledFactors();
        if (enabledFactorsConfig == null || enabledFactorsConfig.length == 0) {
            return Collections.emptyList(); // Return empty list if no factors configured
        }

        List<String> configuredFactors = Arrays.stream(enabledFactorsConfig)
                .filter(factor -> factor != null && !factor.trim().isEmpty())
                .map(String::trim)
                .collect(Collectors.toList());

        // Filter to only include factors that have registered providers
        return configuredFactors.stream()
                .filter(factorType -> factorRegistry.getProvider(factorType).isPresent())
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

        Optional<MfaFactorProvider> providerOpt = factorRegistry.getProvider(factorType);
        if (!providerOpt.isPresent()) {
            session.markFactorPreparationFailed(factorType, "Factor type not supported: " + factorType);
            return session;
        }

        JCRUserNode user = userManagerService.lookupUser(session.getUserId());
        if (user == null) {
            session.markFactorPreparationFailed(factorType, "User not found");
            return session;
        }

        try {
            providerOpt.get().prepare(session, user, request);
            logger.info("Factor {} preparation completed for user: {}", factorType, session.getUserId());
        } catch (Exception e) {
            session.markFactorPreparationFailed(factorType, "Preparation failed: " + e.getMessage());
            logger.error("Factor {} preparation failed for user: {}", factorType, session.getUserId(), e);
        }

        return session;
    }

    @Override
    public MfaSession verifyFactor(String factorType, HttpServletRequest request) {
        MfaSession session = getMfaSession(request);
        if (session == null) {
            throw new IllegalStateException("No active MFA session found");
        }

        if (!session.isFactorPrepared(factorType)) {
            session.markFactorVerificationFailed(factorType, "Factor not prepared");
            return session;
        }

        Optional<MfaFactorProvider> providerOpt = factorRegistry.getProvider(factorType);
        if (providerOpt.isEmpty()) {
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
            providerOpt.get().verify(session, user, request);

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
}
