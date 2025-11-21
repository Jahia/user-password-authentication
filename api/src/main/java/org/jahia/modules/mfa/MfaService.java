package org.jahia.modules.mfa;


import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.Serializable;
import java.util.List;

/**
 * Public interface for MFA service operations.
 * It defines the core MFA functionality available to external consumers.
 */
public interface MfaService {

    /**
     * Gets the list of available MFA factor types from registered providers.
     */
    List<String> getAvailableFactors();

    /**
     * Initiates MFA authentication for a user with username/password.
     * <p>
     * If an error occurs, it will be recorded in the returned session's error state.
     * Check {@link MfaSession#getError()} to determine if the operation succeeded.
     *
     * @param siteKey is optional and can be null
     * @return MfaSession with error state if authentication failed, or a valid session if successful
     */
    MfaSession initiate(String username, String password, String siteKey, HttpServletRequest request);

    /**
     * Prepares a specific MFA factor for verification.
     * <p>
     * If an error occurs, it will be recorded in the returned session's error state.
     * Check {@link MfaSession#getError()} for session-level errors or
     * {@link MfaFactorState#getError()} for factor-specific errors.
     *
     * @return MfaSession with updated state and potential error information
     */
    MfaSession prepareFactor(String factorType, HttpServletRequest request, HttpServletResponse response);

    /**
     * Verifies a specific MFA factor with the provided verification data.
     * <p>
     * If an error occurs, it will be recorded in the returned session's error state.
     * Check {@link MfaSession#getError()} for session-level errors or
     * {@link MfaFactorState#getError()} for factor-specific errors.
     *
     * @return MfaSession with updated state and potential error information
     */
    MfaSession verifyFactor(String factorType, Serializable verificationData, HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse);

    /**
     * Gets the current MFA session for the request.
     */
    MfaSession getMfaSession(HttpServletRequest request);

    /**
     * Clears the current MFA session.
     */
    void clearMfaSession(HttpServletRequest request);

    /**
     * Creates a minimal error session with {@code "no_active_session"} error.
     * <p>
     * This is useful when operations require an {@link MfaSession} but none exists.
     * Instead of returning {@code null}, this provides a consistent error response.
     *
     * @return a new MfaSession with {@code "no_active_session"} error coe set
     */
    MfaSession createNoSessionError();
}
