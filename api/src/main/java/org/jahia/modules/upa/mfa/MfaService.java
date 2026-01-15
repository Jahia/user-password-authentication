package org.jahia.modules.upa.mfa;


import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.Serializable;
import java.util.List;

/**
 * Core service interface for Multi-Factor Authentication operations.
 * <p>
 * This service manages the complete MFA lifecycle including session initiation,
 * factor preparation and verification, and session management. It coordinates
 * between registered {@link MfaFactorProvider} implementations and the client.
 * <p>
 * All operations return an {@link MfaSession} that contains the current state,
 * including any errors that occurred during processing.
 */
public interface MfaService {

    /**
     * Returns the list of currently available MFA factor types.
     * <p>
     * This list is determined by the registered {@link MfaFactorProvider} instances
     * in the system.
     *
     * @return a list of factor type identifiers
     */
    List<String> getAvailableFactors();

    /**
     * Initiates an MFA authentication session for a user.
     * <p>
     * It validates the provided username and password credentials, and if successful, creates a new MFA session.
     * All the required factors will then have to be verified before authentication is complete.
     * <i>NB: if there are no required factors when initiating, the user gets authenticated</i>
     *
     * <p>
     * If authentication fails or an error occurs, the returned session will contain an error.
     * Check {@link MfaSession#getError()} for session-level errors to determine if initiation succeeded.
     *
     * @param initiationContext the context containing username, password, site key, remember me flag, and HTTP request/response
     * @return an MFA session, potentially containing an error if initiation failed
     */
    MfaSession initiate(InitiationContext initiationContext);

    /**
     * Prepares a specific MFA factor for verification.
     * <p>
     * Preparation typically involves generating and sending a verification challenge
     * (e.g., sending an email code, displaying a QR code). The preparation result is
     * stored in the factor state for later verification.
     * <p>
     * Check {@link MfaSession#getError()} for session-level errors or
     * {@link MfaFactorState#getError()} for factor-specific errors.
     *
     * @param factorType the factor type identifier
     * @param request    the HTTP request
     * @param response   the HTTP response
     * @return the updated MFA session with preparation results or errors
     */
    MfaSession prepareFactor(String factorType, HttpServletRequest request, HttpServletResponse response);

    /**
     * Verifies a specific MFA factor with the provided verification data.
     * <p>
     * The verification data format depends on the factor type (e.g., a String code for
     * email factors, custom objects for other factors).
     * <p>
     * If verification succeeds, the factor is marked as verified in the session.
     * Check {@link MfaSession#getError()} for session-level errors or
     * {@link MfaFactorState#getError()} for factor-specific errors.
     *
     * @param factorType          the factor type identifier
     * @param verificationData    the data to verify (format depends on factor type)
     * @param httpServletRequest  the HTTP request
     * @param httpServletResponse the HTTP response
     * @return the updated MFA session with verification results or errors
     */
    MfaSession verifyFactor(String factorType, Serializable verificationData, HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse);

    /**
     * Retrieves the current MFA session from the request.
     *
     * @param request the HTTP request
     * @return the current MFA session, or null if no session exists
     */
    MfaSession getMfaSession(HttpServletRequest request);

    /**
     * Clears the current MFA session from the request.
     * <p>
     * This should be called after successful authentication or when abandoning the MFA flow.
     *
     * @param request the HTTP request
     */
    void clearMfaSession(HttpServletRequest request);

    /**
     * Creates a minimal error session with "no_active_session" error.
     * <p>
     * This is useful when operations require an {@link MfaSession} but none exists.
     * Instead of returning null, this provides a consistent error response.
     *
     * @return a new MfaSession with "no_active_session" error code set
     */
    MfaSession createNoSessionError();
}
