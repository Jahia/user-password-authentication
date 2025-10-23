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
     *
     * @param siteKey is optional and can be null
     * @throws MfaException if an error occurs during MFA initialization
     */
    MfaSession initiateMfa(String username, String password, String siteKey, HttpServletRequest request) throws MfaException;

    /**
     * Prepares a specific MFA factor for verification.
     *
     * @throws MfaException if an error occurs during MFA preparation
     */
    MfaSession prepareFactor(String factorType, HttpServletRequest request, HttpServletResponse response) throws MfaException;

    /**
     * Verifies a specific MFA factor with the provided verification data.
     *
     * @throws MfaException if an error occurs during MFA verification
     */
    MfaSession verifyFactor(String factorType, HttpServletRequest request, Serializable verificationData) throws MfaException;

    /**
     * Gets the current MFA session for the request.
     */
    MfaSession getMfaSession(HttpServletRequest request);

    /**
     * Clears the current MFA session.
     */
    void clearMfaSession(HttpServletRequest request);
}
