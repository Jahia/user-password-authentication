package org.jahia.modules.mfa;

import java.io.Serializable;

/**
 * Tracks the state of a single MFA factor within a session.
 * <p>
 * Each factor type has its own state instance that records whether the factor has been
 * prepared and verified, stores any preparation results, and tracks factor-level errors.
 * <p>
 * Factor-level errors are recoverable and specific to this factor (e.g., invalid code),
 * allowing users to retry the same factor or attempt a different one.
 */
public class MfaFactorState implements Serializable {
    private boolean prepared = false;
    private boolean verified = false;
    private MfaError error;
    private Serializable preparationResult;

    /**
     * Checks whether this factor has been successfully prepared.
     *
     * @return true if prepared, false otherwise
     */
    public boolean isPrepared() {
        return prepared;
    }

    /**
     * Sets the preparation status for this factor.
     *
     * @param prepared true if the factor has been prepared, false otherwise
     */
    public void setPrepared(boolean prepared) {
        this.prepared = prepared;
    }

    /**
     * Checks whether this factor has been successfully verified.
     *
     * @return true if verified, false otherwise
     */
    public boolean isVerified() {
        return verified;
    }

    /**
     * Sets the verification status for this factor.
     *
     * @param verified true if the factor has been verified, false otherwise
     */
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

    /**
     * Returns the result of the preparation step for this factor.
     * <p>
     * This is typically set by the factor provider during preparation and may contain
     * data needed for verification (e.g., masked email address, challenge data).
     *
     * @return the preparation result, or null if not yet prepared
     */
    public Serializable getPreparationResult() {
        return preparationResult;
    }

    /**
     * Sets the result of the preparation step for this factor.
     *
     * @param preparationResult the preparation result to store
     */
    public void setPreparationResult(Serializable preparationResult) {
        this.preparationResult = preparationResult;
    }
}
