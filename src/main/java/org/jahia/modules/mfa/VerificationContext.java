package org.jahia.modules.mfa;

import org.jahia.services.content.decorator.JCRUserNode;

import javax.servlet.http.HttpServletRequest;
import java.io.Serializable;

/**
 * Context object containing all necessary data for verifying an MFA factor.
 * Provides access to the user, HTTP request, preparation result, and verification data.
 */
public class VerificationContext {
    private final JCRUserNode user;
    private final HttpServletRequest httpServletRequest; // TODO should we keep it?
    private final Serializable preparationResult;
    private final Serializable verificationData;

    /**
     * Constructs a new VerificationContext.
     *
     * @param user               the user for whom MFA verification is being performed
     * @param httpServletRequest the HTTP request associated with the verification
     * @param preparationResult  the result from the preparation step
     * @param verificationData   the data provided for verification
     */
    public VerificationContext(JCRUserNode user, HttpServletRequest httpServletRequest, Serializable preparationResult, Serializable verificationData) {
        this.user = user;
        this.httpServletRequest = httpServletRequest;
        this.preparationResult = preparationResult;
        this.verificationData = verificationData;
    }

    /**
     * Returns the user associated with this context (the user being authenticated).
     *
     * @return the JCRUserNode representing the user
     */
    public JCRUserNode getUser() {
        return user;
    }

    /**
     * Returns the HTTP request associated with this context.
     *
     * @return the HttpServletRequest for the verification step
     */
    public HttpServletRequest getHttpServletRequest() {
        return httpServletRequest;
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
}
