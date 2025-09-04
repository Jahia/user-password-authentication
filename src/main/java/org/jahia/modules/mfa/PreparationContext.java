package org.jahia.modules.mfa;

import org.jahia.services.content.decorator.JCRUserNode;

import javax.servlet.http.HttpServletRequest;

/**
 * Context object containing all necessary data for preparing an MFA factor.
 * Provides access to the user and the HTTP request associated with the preparation step.
 */
public class PreparationContext {
    private final JCRUserNode user;
    private final HttpServletRequest httpServletRequest;  // TODO should we keep it (not needed for email factor)?

    /**
     * Constructs a new PreparationContext.
     *
     * @param user               the user for whom MFA preparation is being performed
     * @param httpServletRequest the HTTP request associated with the preparation
     */
    public PreparationContext(JCRUserNode user, HttpServletRequest httpServletRequest) {
        this.user = user;
        this.httpServletRequest = httpServletRequest;
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
     * @return the HttpServletRequest for the preparation step
     */
    public HttpServletRequest getHttpServletRequest() {
        return httpServletRequest;
    }
}
