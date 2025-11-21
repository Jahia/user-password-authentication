package org.jahia.modules.mfa;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.Serializable;

/**
 * Context object containing all necessary data for verifying an MFA factor.
 * Provides access to the user, HTTP request, preparation result, and verification data.
 */
public class VerificationContext {
    private final MfaSessionContext sessionContext;
    private final Serializable preparationResult;
    private final Serializable verificationData;
    private final HttpServletRequest httpServletRequest;
    private final HttpServletResponse httpServletResponse;

    /**
     * Constructs a new VerificationContext with the provided session context, preparation result,
     * verification data, HTTP request, and HTTP response.
     *
     * @param sessionContext      the MFA session context containing user and session-specific data
     * @param preparationResult   the result of the preparation step, typically used for initializing verification
     * @param verificationData    the data provided for factor verification, often provided by the user
     * @param httpServletRequest  the HTTP servlet request associated with the current operation
     * @param httpServletResponse the HTTP servlet response associated with the current operation
     */
    public VerificationContext(MfaSessionContext sessionContext, Serializable preparationResult, Serializable verificationData, HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse) {
        this.sessionContext = sessionContext;
        this.preparationResult = preparationResult;
        this.verificationData = verificationData;
        this.httpServletRequest = httpServletRequest;
        this.httpServletResponse = httpServletResponse;
    }

    /**
     * Returns the MFA session context containing user and session-specific data.
     *
     * @return the MFA session context
     */
    public MfaSessionContext getSessionContext() {
        return sessionContext;
    }

    /**
     * Returns the result from the preparation step.
     *
     * @return the serializable preparation result
     */
    public Serializable getPreparationResult() {
        return preparationResult;
    }

    /**
     * Returns the data provided for verification.
     *
     * @return the serializable verification data
     */
    public Serializable getVerificationData() {
        return verificationData;
    }

    /**
     * Returns the HTTP request associated with this context.
     *
     * @return the {@link HttpServletRequest} for the verification step
     */
    public HttpServletRequest getHttpServletRequest() {
        return httpServletRequest;
    }

    /**
     * Returns the HTTP response associated with this context.
     *
     * @return the {@link HttpServletResponse} for the verification step
     */
    public HttpServletResponse getHttpServletResponse() {
        return httpServletResponse;
    }
}
