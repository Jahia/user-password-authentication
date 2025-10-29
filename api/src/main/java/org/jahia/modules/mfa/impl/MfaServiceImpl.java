package org.jahia.modules.mfa.impl;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.jahia.modules.mfa.*;
import org.jahia.services.content.JCRPropertyWrapper;
import org.jahia.services.content.JCRTemplate;
import org.jahia.services.content.decorator.JCRNodeDecorator;
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

    private JahiaUserManagerService userManagerService;
    private MfaFactorRegistry factorRegistry;
    private volatile MfaConfigurationService mfaConfigurationService;
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
     * Entries automatically expire after {@link MfaConfigurationService#getFactorStartRateLimitSeconds()}
     * seconds, allowing new preparation requests once the rate limit window has passed.
     */
    private volatile Cache<String, Long> factorPreparationTimestampsCache;

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
        factorPreparationTimestampsCache = Caffeine.newBuilder()
                .expireAfterWrite(mfaConfigurationService.getFactorStartRateLimitSeconds(), TimeUnit.SECONDS).build();
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
    public MfaSession initiateMfa(String username, String password, String siteKey, HttpServletRequest request) throws MfaException {
        logger.info("Initiating MFA for user: {}", username);

        // Todo - site user check ?
        JCRUserNode user = AuthHelper.lookupUserFromCredentials(username, password, null);
        if (user == null) {
            logger.warn("Invalid credentials for user: {}", username);
            throw new MfaException("authentication_failed");
        }
        validateUserNotSuspended(user);

        HttpSession httpSession = request.getSession(true);
        Locale userLocale;
        try {
            userLocale = user.hasProperty("preferredLanguage") ?
                    new Locale(user.getPropertyAsString("preferredLanguage")) : Locale.ENGLISH;
        } catch (RepositoryException e) {
            throw new IllegalStateException(e);
        }
        MfaSession mfaSession = new MfaSession(username, userLocale, siteKey);
        mfaSession.setState(MfaSessionState.IN_PROGRESS);
        httpSession.setAttribute(MFA_SESSION_KEY, mfaSession);

        logger.info("MFA session created for user: {}", username);
        return mfaSession;
    }

    @Override
    public MfaSession prepareFactor(String factorType, HttpServletRequest request, HttpServletResponse response) throws MfaException {
        MfaSession session = getMfaSession(request);
        if (session == null) {
            throw new MfaException("no_active_session");
        }

        try {
            MfaFactorProvider provider = resolveProvider(factorType);
            JCRUserNode user = resolveUser(session);
            validateUserCanAuthenticate(request, user, provider);

            String cacheKey = getCacheKey(user, provider);
            Long startedPrepareTime = factorPreparationTimestampsCache.getIfPresent(cacheKey);
            long now = System.currentTimeMillis();
            if (startedPrepareTime != null) {
                long nextRetryInSeconds = mfaConfigurationService.getFactorStartRateLimitSeconds() - (now - startedPrepareTime) / 1000;
                throw new MfaPreparationRateLimitException(factorType, user, nextRetryInSeconds);
            }
            PreparationContext preparationContext = new PreparationContext(session, user, request, response);
            Serializable preparationResult = provider.prepare(preparationContext);
            session.setPreparationResult(preparationResult);
            // Store in cache to prevent same user to generate a new preparationResult for the current factor.
            factorPreparationTimestampsCache.put(cacheKey, now);
            request.getSession().setAttribute(getAttributeKey(factorType), preparationResult);
            session.markFactorPrepared(provider.getFactorType());
            logger.info("Factor {} preparation completed for user: {}", factorType, session.getUserId());
        } catch (MfaPreparationRateLimitException preparationRateLimitException) {
            // the session is not mark as failed in this specific case
            logger.debug("Preparation rate limit exceeded for the factor {} for user: {}", factorType, session.getUserId());
            throw preparationRateLimitException;
        } catch (Exception e) {
            session.markFactorPreparationFailed(factorType);
            throw e;
        }
        return session;
    }

    @Override
    public MfaSession verifyFactor(String factorType, HttpServletRequest request, Serializable verificationData) throws MfaException {
        MfaSession session = getMfaSession(request);
        if (session == null) {
            throw new MfaException("no_active_session");
        }

        try {
            if (!session.isFactorPrepared(factorType)) {
                throw new MfaException("verify.factor_not_prepared", "factorType", factorType);
            }

            MfaFactorProvider provider = resolveProvider(factorType);
            // TODO - reset mfa session if user is not found at this stage, better handling of user recheck during MFA steps
            JCRUserNode user = resolveUser(session);
            validateUserCanAuthenticate(request, user, provider);

            Serializable preparationResult = (Serializable) request.getSession().getAttribute(getAttributeKey(factorType));
            VerificationContext verificationContext = new VerificationContext(user, request, preparationResult, verificationData);
            if (provider.verify(verificationContext)) {
                // Clear preparation result after successful verification
                request.getSession().removeAttribute(getAttributeKey(factorType));
                session.markFactorCompleted(factorType);
                // Clean up start cache
                factorPreparationTimestampsCache.invalidate(getCacheKey(user, provider));
                logger.info("Factor {} verified successfully for user: {}", factorType, session.getUserId());
            } else {
                trackFailure(user.getPath(), provider);
                throw new MfaException("verify.verification_failed", "factorType", factorType);
            }
            if (isAllRequiredFactorsCompleted(session)) {
                session.setState(MfaSessionState.COMPLETED);
                logger.info("All MFA factors completed for user: {}, proceed with authentication", session.getUserId());
                AuthHelper.authenticateUser(request, user);
                failuresCache.invalidate(user.getPath()); // clear any failure attempts for that user
            }
        } catch (Exception e) {
            session.markFactorVerificationFailed(factorType);
            throw e;
        }

        return session;
    }

    private MfaFactorProvider resolveProvider(String factorType) throws MfaException {
        MfaFactorProvider provider = factorRegistry.lookupProvider(factorType);
        if (provider == null) {
            throw new MfaException("factor_type_not_supported", "factorType", factorType);
        }
        return provider;
    }

    private JCRUserNode resolveUser(MfaSession session) throws MfaException {
        JCRUserNode user = userManagerService.lookupUser(session.getUserId());
        if (user == null) {
            throw new MfaException("user_not_found");
        }
        return user;
    }

    private void validateUserCanAuthenticate(HttpServletRequest request, JCRUserNode user, MfaFactorProvider provider) throws MfaException {
        validateUserNotSuspended(user);
        if (hasReachedAuthFailuresCountLimit(user.getPath(), provider)) {
            suspendUser(request, user, provider);
            throw new MfaException("suspended_user");
        }
    }

    private void validateUserNotSuspended(JCRUserNode user) throws MfaException {
        if (isUserSuspended(user.getPath())) {
            logger.warn("User {} is suspended", user.getPath());
            throw new MfaException("suspended_user");
        }
    }

    private boolean isUserSuspended(String userPath) throws MfaException {
        try {
            return JCRTemplate.getInstance().doExecuteWithSystemSession(session -> {
                JCRUserNode userNode = (JCRUserNode) session.getNode(userPath);
                if (!userNode.hasProperty(MFA_SUSPENDED_SINCE_PROP)) {
                    logger.debug("User {} is not suspended", userNode);
                    return false;
                }
                JCRPropertyWrapper suspendedSinceProperty = userNode.getProperty(MFA_SUSPENDED_SINCE_PROP);
                Calendar suspendedUntil = suspendedSinceProperty.getDate();
                suspendedUntil.add(Calendar.SECOND, mfaConfigurationService.getUserTemporarySuspensionSeconds());
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
            throw new MfaException("failed_to_check_if_user_suspended");
        }
    }

    private void suspendUser(HttpServletRequest request, JCRUserNode user, MfaFactorProvider provider) throws MfaException {

        // suspend the user in the JCR
        try {
            JCRTemplate.getInstance().doExecuteWithSystemSession(session -> {
                Calendar suspendedSince = Calendar.getInstance();
                JCRUserNode userNode = (JCRUserNode) session.getNode(user.getPath());
                logger.debug("Marking user {} as suspended...", userNode);
                userNode.addMixin(MFA_SUSPENDED_USER_MIXIN);
                userNode.setProperty(MFA_SUSPENDED_SINCE_PROP, suspendedSince);
                logger.debug("Property '{}' set to {}", MFA_SUSPENDED_SINCE_PROP, suspendedSince);
                session.save();
                return null;
            });
        } catch (RepositoryException e) {
            logger.warn("Failed to mark user {} as suspended", user.getPath(), e);
            throw new MfaException("failed_to_mark_user_as_suspended");
        }

        // clear the caches for that suspended user:
        failuresCache.invalidate(user.getPath()); // no need to track failures anymore
        factorPreparationTimestampsCache.invalidate(getCacheKey(user, provider));

        // remove the preparation result from their session:
        request.getSession().removeAttribute(getAttributeKey(provider.getFactorType()));
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

    private static String getCacheKey(JCRUserNode user, MfaFactorProvider provider) {
        return String.format("%s-%s@%d", user.getPath(), provider.getFactorType(), provider.hashCode());
    }
}
