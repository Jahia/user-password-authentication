package org.jahia.modules.mfa;

import javax.servlet.http.HttpServletRequest;
import java.util.List;

/**
 * Public interface for MFA service operations.
 * This interface defines the core MFA functionality available to external consumers.
 */
public interface MfaService {

    /**
     * Checks if MFA is enabled in the system configuration.
     */
    boolean isEnabled();

    /**
     * Gets the list of available MFA factor types from registered providers.
     */
    List<String> getAvailableFactors();

    /**
     * Initiates MFA authentication for a user with username/password.
     */
    MfaSession initiateMfa(String username, String password, HttpServletRequest request);

    /**
     * Prepares a specific MFA factor for verification.
     */
    MfaSession prepareFactor(String factorType, HttpServletRequest request);

    /**
     * Verifies a specific MFA factor with the provided data.
     */
    MfaSession verifyFactor(String factorType, HttpServletRequest request);

    /**
     * Gets the current MFA session for the request.
     */
    MfaSession getMfaSession(HttpServletRequest request);

    /**
     * Clears the current MFA session.
     */
    void clearMfaSession(HttpServletRequest request);
}
