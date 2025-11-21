package org.jahia.modules.mfa;

import java.io.Serializable;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static java.util.stream.Collectors.*;

/**
 * Comprehensive MFA session that serves as the single source of truth for all MFA state.
 * Includes factor preparation status, verification results, and error tracking.
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

    public MfaSession(MfaSessionContext context) {
        this.context = context;
        this.factorStates = new HashMap<>();
        this.suspensionDurationInSeconds = 0; // means not suspended
        this.error = null;
    }

    public MfaSessionContext getContext() {
        return context;
    }

    public boolean isInitiated() {
        return initiated;
    }

    public void setInitiated(boolean initiated) {
        this.initiated = initiated;
    }

    public MfaFactorState getOrCreateFactorState(String factorType) {
        return factorStates.computeIfAbsent(factorType, k -> new MfaFactorState());
    }

    public long getSuspensionDurationInSeconds() {
        return suspensionDurationInSeconds;
    }

    public void setSuspensionDurationInSeconds(long suspensionDurationInSeconds) {
        this.suspensionDurationInSeconds = suspensionDurationInSeconds;
    }

    /**
     * Returns the session-level error if the MFA session has failed.
     * <p>
     * Session-level errors indicate fatal failures that prevent all MFA operations from proceeding.
     * These errors should be checked before attempting to prepare or verify any factor.
     * <p>
     * If this returns a non-null value, the authentication flow cannot continue and the
     * user should be presented with an appropriate error message.
     *
     * @return the session-level error, or null if no session-level error has occurred
     * @see MfaFactorState#getError() for factor-specific errors
     */
    public MfaError getError() {
        return error;
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
