package org.jahia.modules.mfa;

import java.io.Serializable;

/**
 * Represents the state of a single MFA factor within a session.
 * Tracks preparation and completion statuses plus any recoverable factor-level error.
 * Factor-level errors use codes such as verify_factor_not_prepared or verify_verification_failed.
 */
public class MfaFactorState implements Serializable {
    private boolean prepared = false;
    private boolean verified = false;
    private MfaError error;
    private Serializable preparationResult;

    public boolean isPrepared() {
        return prepared;
    }

    public void setPrepared(boolean prepared) {
        this.prepared = prepared;
    }

    public boolean isVerified() {
        return verified;
    }

    public void setVerified(boolean verified) {
        this.verified = verified;
    }

    /**
     * Returns the factor-level error for this specific factor.
     * <p>
     * Factor-level errors are non-fatal and specific to this factor's preparation or verification.
     * They indicate issues like invalid verification codes, rate limiting, or missing configuration
     * for this particular factor.
     * <p>
     * If this returns a non-null value, this specific factor has encountered an error, but other
     * factors may still be attempted. For fatal session-wide errors that prevent all operations,
     * check {@link MfaSession#getError()} instead.
     *
     * @return the factor-level error, or null if no error has occurred for this factor
     * @see MfaSession#getError() for session-level errors
     */
    public MfaError getError() {
        return error;
    }

    /**
     * Checks if this factor has an error.
     * <p>
     * This is a convenience method equivalent to {@code getError() != null}.
     *
     * @return true if a factor-level error exists, false otherwise
     * @see #getError() to retrieve the error details
     */
    public boolean hasError() {
        return error != null;
    }

    /**
     * Sets a factor-level error for this specific factor.
     * <p>
     * This should be called for errors that affect only this factor and do not invalidate
     * the entire MFA session, such as:
     * <ul>
     *   <li>Invalid verification code entered</li>
     *   <li>Factor preparation rate limit exceeded</li>
     *   <li>Factor type not supported or not available</li>
     *   <li>Factor-specific configuration missing (e.g., no email address)</li>
     * </ul>
     * <p>
     * For errors that invalidate the entire session and prevent all factors from proceeding,
     * use {@link MfaSession#setError(MfaError)} instead.
     * <p>
     * Setting an error on a factor typically allows the user to retry the same factor or
     * attempt a different factor if available.
     *
     * @param error the factor-level error to set
     * @see MfaSession#setError(MfaError) for setting session-level errors
     */
    public void setError(MfaError error) {
        this.error = error;
    }

    public Serializable getPreparationResult() {
        return preparationResult;
    }

    public void setPreparationResult(Serializable preparationResult) {
        this.preparationResult = preparationResult;
    }
}
