package org.jahia.modules.upa.mfa;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Context object provided to factor providers during the preparation phase.
 * <p>
 * Contains all necessary information for preparing an MFA factor, including the session
 * context (user ID, locale, site) and HTTP request/response objects for accessing
 * additional data or setting response headers.
 * <p>
 * Factor providers can read request attributes to access custom data supplied by clients.
 */
public class PreparationContext {
    private final MfaSessionContext sessionContext;
    private final HttpServletRequest httpServletRequest;
    private final HttpServletResponse httpServletResponse;

    /**
     * Creates a new preparation context.
     *
     * @param sessionContext      the immutable session context containing user and site information
     * @param httpServletRequest  the HTTP request that triggered the preparation
     * @param httpServletResponse the HTTP response for setting headers or cookies if needed
     */
    public PreparationContext(MfaSessionContext sessionContext,
                              HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse) { // constructor param type
        this.sessionContext = sessionContext;
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
    } // return type updated

    /**
     * Returns the HTTP request that triggered the preparation.
     * <p>
     * Factor providers can use this to read request attributes or headers for additional context.
     *
     * @return the HTTP servlet request
     */
    public HttpServletRequest getHttpServletRequest() {
        return httpServletRequest;
    }

    /**
     * Returns the HTTP response associated with the preparation request.
     * <p>
     * Factor providers can use this to set response headers or cookies if needed.
     *
     * @return the HTTP servlet response
     */
    public HttpServletResponse getHttpServletResponse() {
        return httpServletResponse;
    }
}
