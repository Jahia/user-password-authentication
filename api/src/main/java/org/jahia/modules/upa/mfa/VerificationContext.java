package org.jahia.modules.upa.mfa;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.Serializable;

/**
 * Context object provided to factor providers during the verification phase.
 * <p>
 * Contains all necessary information for verifying an MFA factor, including:
 * <ul>
 *   <li>Session context (user ID, locale, site)</li>
 *   <li>Preparation result from the earlier prepare step</li>
 *   <li>Verification data provided by the user</li>
 *   <li>HTTP request/response objects</li>
 * </ul>
 */
public class VerificationContext {
    private final MfaSessionContext sessionContext;
    private final Serializable preparationResult;
    private final Serializable verificationData;
    private final HttpServletRequest httpServletRequest;
    private final HttpServletResponse httpServletResponse;

    /**
     * Creates a new verification context.
     *
     * @param sessionContext      the session context containing user and site information
     * @param preparationResult   the result from the prepare step (may be null if not prepared)
     * @param verificationData    the verification data submitted by the user
     * @param httpServletRequest  the HTTP request associated with the verification
     * @param httpServletResponse the HTTP response associated with the verification
     */
    public VerificationContext(MfaSessionContext sessionContext, Serializable preparationResult, Serializable verificationData, HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse) {
        this.sessionContext = sessionContext;
        this.preparationResult = preparationResult;
        this.verificationData = verificationData;
        this.httpServletRequest = httpServletRequest;
        this.httpServletResponse = httpServletResponse;
    }

    /**
     * Returns the session context containing user ID, locale, site key, and required factors.
     *
     * @return the session context
     */
    public MfaSessionContext getSessionContext() {
        return sessionContext;
    }

    /**
     * Returns the result from the factor preparation step.
     * <p>
     * This typically contains data generated during preparation that is needed for verification
     * (e.g., the generated code to compare against, challenge data).
     *
     * @return the preparation result, or null if the factor was not prepared
     */
    public Serializable getPreparationResult() {
        return preparationResult;
    }

    /**
     * Returns the verification data submitted by the user.
     * <p>
     * The format of this data depends on the factor type (e.g., a String code for email factors,
     * a custom object for other factor types).
     *
     * @return the verification data
     */
    public Serializable getVerificationData() {
        return verificationData;
    }

    /**
     * Returns the HTTP request associated with the verification.
     * <p>
     * Factor providers can use this to read request attributes or headers for additional context.
     *
     * @return the HTTP servlet request
     */
    public HttpServletRequest getHttpServletRequest() {
        return httpServletRequest;
    }

    /**
     * Returns the HTTP response associated with the verification.
     * <p>
     * Factor providers can use this to set response headers or cookies if needed.
     *
     * @return the HTTP servlet response
     */
    public HttpServletResponse getHttpServletResponse() {
        return httpServletResponse;
    }
}
