package org.jahia.modules.mfa;

import java.io.Serializable;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static java.util.stream.Collectors.*;

/**
 * Represents an active MFA authentication session for a user.
 * <p>
 * This class is the central state container for the entire multi-factor authentication flow.
 * It tracks session initialization, factor preparation and verification states, suspension
 * status, and any session-level or factor-level errors.
 * <p>
 * The session is created during {@link MfaService#initiate} and persists throughout the
 * authentication process until all required factors are verified or an error occurs.
 */
public class MfaSession implements Serializable {
    private final MfaSessionContext context;
    private boolean initiated;
    private final Map<String, MfaFactorState> factorStates;
    private long suspensionDurationInSeconds; // TODO might get removed eventually
    /**
     * Session-level error that indicates a fatal, irrecoverable failure preventing all MFA operations.
     * <p>
     * <b>Important:</b> Once this field is set to a non-null value, the session is permanently failed
     * and cannot be reused. The client must discard this session and create a new one to retry authentication.
     * <p>
     * When set, this error takes precedence over any factor-level errors.
     * <p>
     * Common session-level errors include:
     * <ul>
     *   <li><code>no_active_session</code> - No MFA session exists</li>
     *   <li><code>authentication_failed</code> - Initial username/password authentication failed</li>
     *   <li><code>user_not_found</code> - User does not exist in the system</li>
     * </ul>
     */
    private MfaError error;

    /**
     * Creates a new MFA session with the provided context.
     *
     * @param context the session context containing user and authentication details
     */
    public MfaSession(MfaSessionContext context) {
        this.context = context;
        this.factorStates = new HashMap<>();
        this.suspensionDurationInSeconds = 0; // means not suspended
        this.error = null;
    }

    /**
     * Returns the immutable session context containing user and authentication details.
     *
     * @return the session context
     */
    public MfaSessionContext getContext() {
        return context;
    }

    /**
     * Checks whether the MFA session has been successfully initiated.
     * <p>
     * A session is considered initiated after the user's username and password have been
     * validated. This must be true before any factors can be prepared or verified.
     *
     * @return true if the session is initiated, false otherwise
     */
    public boolean isInitiated() {
        return initiated;
    }

    /**
     * Sets the initiation status of this MFA session.
     *
     * @param initiated true to mark the session as initiated, false otherwise
     */
    public void setInitiated(boolean initiated) {
        this.initiated = initiated;
    }

    /**
     * Retrieves or creates the factor state for a specific factor type.
     * <p>
     * If no state exists for the given factor type, a new one is created and stored.
     *
     * @param factorType the factor type identifier
     * @return the factor state for the specified type
     */
    public MfaFactorState getOrCreateFactorState(String factorType) {
        return factorStates.computeIfAbsent(factorType, k -> new MfaFactorState());
    }

    /**
     * Returns the suspension duration in seconds if the user is temporarily suspended.
     * <p>
     * When this returns a non-null value, the user has exceeded the allowed number of
     * authentication failures and is temporarily blocked from further MFA attempts.
     * The returned value indicates how long (in seconds) the suspension will last.
     * <p>
     * <b>Note:</b> A null value means the user is not currently suspended and can proceed
     * with authentication normally.
     *
     * @return the suspension duration in seconds, or null if the user is not suspended
     */
    public Long getSuspensionDurationInSeconds() {
        return suspensionDurationInSeconds;
    }

    /**
     * Sets the suspension duration in seconds for a temporarily suspended user.
     * <p>
     * This should be called when a user has exceeded the allowed number of authentication
     * failures. Setting a non-null value indicates the user is suspended for the specified
     * duration (in seconds).
     * <p>
     * To clear a suspension, this method can be called with null.
     *
     * @param suspensionDurationInSeconds the suspension duration in seconds, or null to clear suspension
     */
    public void setSuspensionDurationInSeconds(Long suspensionDurationInSeconds) {
        this.suspensionDurationInSeconds = suspensionDurationInSeconds;
    }

    /**
     * Returns the session-level error if the MFA session has failed irrecoverably.
     * <p>
     * Session-level errors indicate fatal failures that prevent all MFA operations from proceeding.
     * These errors should be checked before attempting to prepare or verify any factor.
     * <p>
     * <b>Important:</b> If this returns a non-null value, the session is permanently failed and must be
     * discarded. The authentication flow cannot continue with this session, and a new session must be
     * created to retry authentication. The user should be presented with an appropriate error message.
     *
     * @return the session-level error, or null if no session-level error has occurred
     * @see MfaFactorState#getError() for factor-specific recoverable errors
     * @see #hasError() to check if an error exists without retrieving the error details
     */
    public MfaError getError() {
        return error;
    }

    /**
     * Checks if this session has a session-level error.
     * <p>
     * This is a convenience method equivalent to {@code getError() != null}.
     *
     * @return true if a session-level error exists, false otherwise
     * @see #getError() to retrieve the error details
     */
    public boolean hasError() {
        return error != null;
    }

    /**
     * Sets a session-level error indicating a fatal, irrecoverable failure of the MFA session.
     * <p>
     * This should only be called for errors that permanently invalidate the entire session and prevent
     * all factors from proceeding, such as:
     * <ul>
     *   <li>No active session exists</li>
     *   <li>Initial authentication (username/password) failed</li>
     *   <li>User not found in the system</li>
     * </ul>
     * <p>
     * For errors specific to a single factor that can be retried (e.g., invalid verification code,
     * rate limiting), use {@link MfaFactorState#setError(MfaError)} instead.
     * <p>
     * <b>Warning:</b> Once a session-level error is set, the session becomes permanently failed and
     * <b>cannot be recovered or reused</b>. The client must discard this session and create a new one
     * to retry authentication. This is an irrecoverable state.
     *
     * @param error the session-level error to set
     * @see MfaFactorState#setError(MfaError) for setting factor-specific recoverable errors
     */
    public void setError(MfaError error) {
        this.error = error;
    }

    /**
     * Returns a list of factor types that have been successfully verified.
     *
     * @return a list of verified factor types
     */
    public List<String> getVerifiedFactors() {
        return factorStates.entrySet().stream()
                .filter(entry -> entry.getValue().isVerified())
                .map(Map.Entry::getKey)
                .collect(toList());
    }

}
