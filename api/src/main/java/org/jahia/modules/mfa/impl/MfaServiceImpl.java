package org.jahia.modules.mfa.impl;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.jahia.modules.mfa.*;
import org.jahia.services.content.JCRPropertyWrapper;
import org.jahia.services.content.JCRTemplate;
import org.jahia.services.content.decorator.JCRNodeDecorator;
import org.jahia.services.content.decorator.JCRUserNode;
import org.jahia.services.security.AuthenticationOptions;
import org.jahia.services.security.AuthenticationRequest;
import org.jahia.services.security.AuthenticationService;
import org.jahia.services.security.InvalidSessionLoginException;
import org.jahia.services.usermanager.JahiaUser;
import org.jahia.services.usermanager.JahiaUserManagerService;
import org.osgi.service.component.annotations.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.RepositoryException;
import javax.security.auth.login.AccountNotFoundException;
import javax.security.auth.login.LoginException;
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
    private static final AuthenticationOptions AUTH_OPTIONS = AuthenticationOptions.Builder.withDefaults()
            // TODO disable it until https://github.com/Jahia/jahia-multi-factor-authentication/issues/68 is implemented
            .shouldRememberMe(false)
            .build();
    private static final String ERROR_FACTOR_TYPE_NOT_SUPPORTED = "factor_type_not_supported";
    private static final String ERROR_RATE_LIMIT_EXCEEDED = "prepare.rate_limit_exceeded";
    private static final String ERROR_FACTOR_NOT_PREPARED = "verify.factor_not_prepared";
    private static final String ERROR_VERIFICATION_FAILED = "verify.verification_failed";
    private static final String ERROR_USER_NOT_FOUND = "user_not_found";
    private static final String ERROR_AUTHENTICATION_FAILED = "authentication_failed";
    private static final String ERROR_NO_SESSION = "no_active_session";
    private static final String ERROR_SUSPENDED_USER = "suspended_user";
    protected static final String ARG_FACTOR_TYPE = "factorType";
    protected static final String ARG_SUSPENSION_DURATION_IN_SECONDS = "suspensionDurationInSeconds";

    private JahiaUserManagerService userManagerService;
    private FactorRegistry factorRegistry;
    private volatile ConfigurationService configurationService;
    private AuthenticationService authenticationService;

    /**
     * A thread-safe cache used for storing authentication failure details of users.
     * <p>
     * This cache maps user paths ({@link JCRNodeDecorator#getPath()} to {@link AuthFailuresDetails} objects, which track
     * authentication failure attempts grouped by Multi-Factor Authentication (MFA) provider type.
     * <p>
     * Primarily leveraged to verify if a user has reached the defined limit of failed authentication attempts within
     * a given time window, enabling further actions such as user suspension.
     */
    private volatile Cache<String, AuthFailuresDetails> failuresCache;

    /**
     * A thread-safe cache storing the timestamp (in milliseconds) when an MFA factor
     * preparation was last initiated for each user-factor combination.
     * <p>
     * This cache is used to enforce rate limiting on factor preparation requests, preventing
     * users from generating new verification codes too frequently. The cache key combines
     * the user path, factor type, and provider hash code.
     * <p>
     * Entries automatically expire after {@link ConfigurationService#getFactorStartRateLimitSeconds()}
     * seconds, allowing new preparation requests once the rate limit window has passed.
     */
    private volatile Cache<String, Long> factorPreparationTimestampsCache;

    @Activate
    protected void activate() {
        logger.info("Initializing Caffeine cache for MFA auth failures...");
        createCaffeineCache();
        logger.info("Caffeine cache initialized.");
    }

    @Deactivate
    protected void deactivate() {
        logger.info("Clearing Caffeine caches for MFA auth failures...");
        failuresCache.invalidateAll();
        failuresCache.cleanUp();
        factorPreparationTimestampsCache.invalidateAll();
        factorPreparationTimestampsCache.cleanUp();
        logger.info("Caffeine cache cleared.");
    }

    @Reference
    public void setUserManagerService(JahiaUserManagerService userManagerService) {
        this.userManagerService = userManagerService;
    }

    @Reference
    public void setFactorRegistry(FactorRegistry factorRegistry) {
        this.factorRegistry = factorRegistry;
    }

    @Reference(
            policy = ReferencePolicy.DYNAMIC,
            policyOption = ReferencePolicyOption.GREEDY,
            updated = "setOrUpdateConfigurationService"
    )
    public void setOrUpdateConfigurationService(ConfigurationService configurationService) {
        this.configurationService = configurationService;
        logger.info("Updating Caffeine cache for MFA auth failures...");
        createCaffeineCache();
        logger.info("Caffeine cache updated.");
    }

    public void unsetOrUpdateConfigurationService(ConfigurationService configurationService) {
        this.configurationService = null;
    }

    @Reference
    public void setAuthenticationService(AuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    // ===== PUBLIC INTERFACE IMPLEMENTATION =====

    @Override
    public List<String> getAvailableFactors() {
        String[] enabledFactorsConfig = configurationService.getEnabledFactors();
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
    public MfaSession initiate(String username, String password, String siteKey, HttpServletRequest request) {
        logger.info("Initiating MFA for user: {}", username);

        AuthenticationRequest authenticationRequest = new AuthenticationRequest(username, password, siteKey, true);
        JahiaUser user;
        try {
            user = authenticationService.getUserFromCredentials(authenticationRequest);
        } catch (IllegalArgumentException | LoginException e) {
            logger.warn("Unable to authenticate the user: {}", username);
            logger.debug("Authentication error", e);
            MfaSession errorSession = createNoSessionError();
            errorSession.setError(new MfaError(ERROR_AUTHENTICATION_FAILED));
            return errorSession;
        }

        HttpSession httpSession = request.getSession();
        Locale userLocale;
        String preferredLanguage = user.getProperty("preferredLanguage");
        userLocale = preferredLanguage != null ? new Locale(preferredLanguage) : Locale.ENGLISH;
        List<String> requiredFactors = getAvailableFactors(); // for now just use all available factors
        MfaSessionContext sessionContext = new MfaSessionContext(username, userLocale, siteKey, requiredFactors);
        MfaSession session = new MfaSession(sessionContext);

        // Validate user not suspended
        Integer suspensionDuration = getUserSuspension(user.getUserKey());
        if (suspensionDuration != null) {
            session.setError(new MfaError(ERROR_SUSPENDED_USER, Map.of(ARG_SUSPENSION_DURATION_IN_SECONDS, suspensionDuration.toString())));
            return session;
        }

        // Complete initiation
        session.setInitiated(true);
        httpSession.setAttribute(MFA_SESSION_KEY, session);

        logger.info("MFA session initiated for user: {}", username);
        return session;
    }

    @Override
    public MfaSession prepareFactor(String factorType, HttpServletRequest request, HttpServletResponse response) {
        MfaSession session = getSessionOrCreateError(request);
        if (session.hasError()) return session;

        MfaFactorState factorState = session.getOrCreateFactorState(factorType);
        factorState.setError(null);

        try {
            ValidationResult validation = performCommonValidation(session, factorType, factorState);
            if (validation == null) return session;

            String userPath = validation.userNode.getPath();
            String cacheKey = getCacheKey(userPath, validation.provider);
            Long startedPrepareTime = factorPreparationTimestampsCache.getIfPresent(cacheKey);
            long now = System.currentTimeMillis();

            if (startedPrepareTime != null) {
                long nextRetryInSeconds = configurationService.getFactorStartRateLimitSeconds() - (now - startedPrepareTime) / 1000;
                Map<String, String> arguments = Map.of(
                        "nextRetryInSeconds", String.valueOf(nextRetryInSeconds),
                        ARG_FACTOR_TYPE, factorType,
                        "user", validation.userNode.getName()
                );
                factorState.setError(new MfaError(ERROR_RATE_LIMIT_EXCEEDED, arguments));
                logger.debug("Preparation rate limit exceeded for the factor {} for session context: {}", factorType, session.getContext());
                return session;
            }

            factorState.setPrepared(false);
            PreparationContext preparationContext = new PreparationContext(session.getContext(), request, response);
            Serializable preparationResult = validation.provider.prepare(preparationContext);
            factorState.setPreparationResult(preparationResult);
            factorPreparationTimestampsCache.put(cacheKey, now);
            factorState.setPrepared(true);
            logger.info("Factor {} preparation completed for context: {}", factorType, session.getContext());
        } catch (MfaException e) {
            factorState.setError(new MfaError(e.getCode(), e.getArguments()));
            logger.error("Factor {} preparation failed for context: {}", factorType, session.getContext(), e);
        }
        return session;
    }

    @Override
    public MfaSession verifyFactor(String factorType, Serializable verificationData, HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse) {
        MfaSession session = getSessionOrCreateError(httpServletRequest);
        if (session.hasError()) return session;

        MfaFactorState factorState = session.getOrCreateFactorState(factorType);
        factorState.setError(null);

        try {
            if (!factorState.isPrepared()) {
                factorState.setError(new MfaError(ERROR_FACTOR_NOT_PREPARED, Map.of(ARG_FACTOR_TYPE, factorType)));
                return session;
            }

            ValidationResult validation = performCommonValidation(session, factorType, factorState);
            if (validation == null) return session;

            String userPath = validation.userNode.getPath();
            Serializable preparationResult = factorState.getPreparationResult();
            VerificationContext verificationContext = new VerificationContext(
                    session.getContext(), preparationResult, verificationData, httpServletRequest, httpServletResponse
            );

            if (validation.provider.verify(verificationContext)) {
                factorState.setVerified(true);
                factorPreparationTimestampsCache.invalidate(getCacheKey(userPath, validation.provider));
                logger.info("Factor {} verified successfully for context: {}", factorType, session.getContext());
            } else {
                trackVerificationFailure(userPath, validation.provider);
                factorState.setError(new MfaError(ERROR_VERIFICATION_FAILED, Map.of(ARG_FACTOR_TYPE, factorType)));
                return session;
            }

            if (areAllRequiredFactorsCompleted(session)) {
                logger.info("All MFA factors completed for context: {}, proceed with authentication", session.getContext());
                authenticateUser(httpServletRequest, validation.userNode);
                failuresCache.invalidate(userPath);
            }
        } catch (MfaException e) {
            factorState.setError(new MfaError(e.getCode(), e.getArguments()));
            logger.error("Factor {} verification failed for context: {}", factorType, session.getContext(), e);
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

    @Override
    public MfaSession createNoSessionError() {
        MfaSessionContext sessionContext = new MfaSessionContext("unknown", Locale.getDefault(), null, getAvailableFactors());
        MfaSession session = new MfaSession(sessionContext);
        session.setError(new MfaError(ERROR_NO_SESSION));
        return session;
    }

    // ===== PRIVATE HELPER METHODS =====

    private void createCaffeineCache() {
        failuresCache = Caffeine.newBuilder()
                .expireAfterWrite(configurationService.getAuthFailuresWindowSeconds(), TimeUnit.SECONDS)
                .build();
        factorPreparationTimestampsCache = Caffeine.newBuilder()
                .expireAfterWrite(configurationService.getFactorStartRateLimitSeconds(), TimeUnit.SECONDS).build();
    }

    private MfaSession getSessionOrCreateError(HttpServletRequest request) {
        MfaSession session = getMfaSession(request);
        if (session == null) {
            logger.error("Attempt to perform MFA operation without active session");
            return createNoSessionError();
        }
        return session;
    }

    private ValidationResult performCommonValidation(MfaSession session, String factorType, MfaFactorState factorState) {
        MfaFactorProvider provider = resolveProvider(factorType);
        if (provider == null) {
            factorState.setError(new MfaError(ERROR_FACTOR_TYPE_NOT_SUPPORTED, Map.of(ARG_FACTOR_TYPE, factorType)));
            return null;
        }

        JCRUserNode userNode = resolveUserNode(session);
        if (userNode == null) {
            session.setError(new MfaError(ERROR_USER_NOT_FOUND));
            return null;
        }

        String userPath = userNode.getPath();
        Integer suspensionDuration = getSuspensionDuration(userPath, provider, session);
        if (suspensionDuration != null) {
            session.setError(new MfaError(ERROR_SUSPENDED_USER, Map.of(ARG_SUSPENSION_DURATION_IN_SECONDS, suspensionDuration.toString())));
            return null;
        }

        return new ValidationResult(provider, userNode);
    }

    private MfaFactorProvider resolveProvider(String factorType) {
        MfaFactorProvider provider = factorRegistry.lookupProvider(factorType);
        if (provider == null) {
            logger.warn("Factor type not supported: {}", factorType);
        }
        return provider;
    }

    private JCRUserNode resolveUserNode(MfaSession session) {
        JCRUserNode user = userManagerService.lookupUser(session.getContext().getUserId());
        if (user == null) {
            logger.warn("User not found: {}", session.getContext().getUserId());
        }
        return user;
    }

    private boolean areAllRequiredFactorsCompleted(MfaSession session) {
        // For now, we require at least one factor to be completed
        // This can be made configurable later
        return !session.getVerifiedFactors().isEmpty();
    }

    private void authenticateUser(HttpServletRequest request, JCRUserNode jcrUserNode) {
        try {
            authenticationService.authenticate(jcrUserNode.getPath(), AUTH_OPTIONS, request, null);
        } catch (InvalidSessionLoginException e) {
            throw new IllegalStateException("Invalid session login", e);
        } catch (AccountNotFoundException e) {
            throw new IllegalStateException("Account not found", e);
        }
    }

    private Integer getUserSuspension(String userNodePath) {
        if (isUserSuspended(userNodePath)) {
            logger.warn("User {} is suspended", userNodePath);
            return getSuspensionDuration();
        }
        return null;
    }

    private Integer getSuspensionDuration(String userPath, MfaFactorProvider provider, MfaSession session) {
        Integer suspensionDuration = getUserSuspension(userPath);
        if (suspensionDuration != null) {
            return suspensionDuration;
        }

        if (hasReachedAuthFailuresCountLimit(userPath, provider)) {
            suspendUser(userPath, provider, session);
            return getSuspensionDuration();
        }

        return null;
    }

    private Integer getSuspensionDuration() {
        // Return suspension duration in seconds
        return configurationService.getUserTemporarySuspensionSeconds();
    }

    private boolean isUserSuspended(String userPath) {
        try {
            return JCRTemplate.getInstance().doExecuteWithSystemSession(session -> {
                JCRUserNode userNode = (JCRUserNode) session.getNode(userPath);
                if (!userNode.hasProperty(MFA_SUSPENDED_SINCE_PROP)) {
                    logger.debug("User {} is not suspended", userNode);
                    return false;
                }
                JCRPropertyWrapper suspendedSinceProperty = userNode.getProperty(MFA_SUSPENDED_SINCE_PROP);
                Calendar suspendedUntil = suspendedSinceProperty.getDate();
                suspendedUntil.add(Calendar.SECOND, configurationService.getUserTemporarySuspensionSeconds());
                // check if the suspension has expired
                if (suspendedUntil.compareTo(Calendar.getInstance()) > 0) {
                    logger.debug("User {} is suspended until {}", userNode, suspendedUntil);
                    return true;
                }
                logger.debug("User {} is no longer suspended, removing its suspension in the JCR", userNode);
                userNode.removeMixin(MFA_SUSPENDED_USER_MIXIN);
                suspendedSinceProperty.remove();
                session.save();
                return false;
            });
        } catch (RepositoryException e) {
            logger.warn("Failed to check if user {} is suspended", userPath, e);
            // In case of error checking suspension, assume user is NOT suspended to allow them to proceed
            // This is safer than blocking legitimate users
            return false;
        }
    }

    private void suspendUser(String userPath, MfaFactorProvider provider, MfaSession session) {
        // suspend the user in the JCR
        try {
            JCRTemplate.getInstance().doExecuteWithSystemSession(jcrSession -> {
                Calendar suspendedSince = Calendar.getInstance();
                JCRUserNode userNode = (JCRUserNode) jcrSession.getNode(userPath);
                logger.debug("Marking user {} as suspended...", userNode);
                userNode.addMixin(MFA_SUSPENDED_USER_MIXIN);
                userNode.setProperty(MFA_SUSPENDED_SINCE_PROP, suspendedSince);
                logger.debug("Property '{}' set to {}", MFA_SUSPENDED_SINCE_PROP, suspendedSince);
                jcrSession.save();
                return null;
            });
        } catch (RepositoryException e) {
            logger.error("Failed to mark user {} as suspended", userPath, e);
            // Don't throw - the suspension error will still be returned to the user
        }

        // clear the caches for that suspended user:
        failuresCache.invalidate(userPath); // no need to track failures anymore
        factorPreparationTimestampsCache.invalidate(getCacheKey(userPath, provider));

        // remove the preparation result from their session
        String factorType = provider.getFactorType();
        session.getOrCreateFactorState(factorType).setPreparationResult(null);
    }

    private void trackVerificationFailure(String userNodePath, MfaFactorProvider provider) {
        AuthFailuresDetails tracker = failuresCache.getIfPresent(userNodePath);
        if (tracker == null) {
            tracker = new AuthFailuresDetails();
        }
        String factorType = provider.getFactorType();
        tracker.addFailureAttempt(factorType);
        if (tracker.getFailureAttemptsCount(factorType) > configurationService.getMaxAuthFailuresBeforeLock()) {
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
        if (tracker.removeAttemptsOutsideWindow(factorType, configurationService.getAuthFailuresWindowSeconds() * 1000L)) {
            logger.debug("Expired timestamps removed for user {}", userNodePath);
            failuresCache.put(userNodePath, tracker);
        }

        return tracker.getFailureAttemptsCount(factorType) >= configurationService.getMaxAuthFailuresBeforeLock();
    }

    private static String getCacheKey(String userPath, MfaFactorProvider provider) {
        return String.format("%s-%s@%d", userPath, provider.getFactorType(), provider.hashCode());
    }

    static String foo() {
        return "foo";
    }

    private static class ValidationResult {
        private final MfaFactorProvider provider;
        private final JCRUserNode userNode;

        ValidationResult(MfaFactorProvider provider, JCRUserNode userNode) {
            this.provider = provider;
            this.userNode = userNode;
        }
    }
}
