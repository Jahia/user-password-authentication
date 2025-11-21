package org.jahia.modules.mfa;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Holds the information needed during multi-factor authentication preparation for a user.
 * Includes session context plus the originating HTTP request/response.
 * <p>
 * Custom factor providers may read request attributes to access additional data supplied by the frontend.
 */
public class PreparationContext {
    private final MfaSessionContext sessionContext;
    private final HttpServletRequest httpServletRequest;
    private final HttpServletResponse httpServletResponse;

    /**
     * Creates a new context for MFA preparation.
     *
     * @param sessionContext       the immutable MFA session context
     * @param httpServletRequest   the HTTP servlet request supplying any extra preparation data
     * @param httpServletResponse  the HTTP servlet response for writing side-effects if needed
     */
    public PreparationContext(MfaSessionContext sessionContext,
                              HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse) {
        this.sessionContext = sessionContext;
        this.httpServletRequest = httpServletRequest;
        this.httpServletResponse = httpServletResponse;
    }

    /**
     * Returns the immutable session context.
     */
    public MfaSessionContext getSessionContext() { return sessionContext; }

    /**
     * Returns the HTTP servlet request that triggered MFA preparation.
     */
    public HttpServletRequest getHttpServletRequest() { return httpServletRequest; }

    /**
     * Returns the HTTP servlet response associated with preparation.
     */
    public HttpServletResponse getHttpServletResponse() { return httpServletResponse; }
}
