package org.jahia.modules.mfa;

import org.jahia.services.content.decorator.JCRUserNode;

import javax.servlet.http.HttpServletRequest;

/**
 * Interface for MFA factor providers.
 * Each factor type should implement this interface to provide factor-specific logic.
 * The provider works directly with MfaSession to update factor state.
 */
public interface MfaFactorProvider {

    /**
     * Gets the factor type this provider handles as a string identifier.
     */
    String getFactorType();

    /**
     * Prepares the factor for verification (e.g., generates and sends code).
     * Updates the session state directly through the session parameter.
     *
     * @param session The MFA session to update with preparation results
     * @param user The user for whom to prepare the factor
     * @param request The HTTP request context
     */
    void prepare(MfaSession session, JCRUserNode user, HttpServletRequest request);

    /**
     * Verifies the factor with the provided data.
     * Updates the session state directly through the session parameter.
     *
     * @param session The MFA session to update with verification results
     * @param user The user being verified
     * @param request The HTTP request containing verification data
     */
    void verify(MfaSession session, JCRUserNode user, HttpServletRequest request);
}
