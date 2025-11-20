package org.jahia.modules.mfa;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Holds the information needed during multi-factor authentication preparation for a user.
 * This includes the user account, the current site, and the HTTP servlet request details.
 * <p>
 * Note: The HTTP servlet request is always included because some custom mfa factor
 * may need to pass additional data from the front-end application targeting the preparation.
 * (In such cases, request attributes can be useful to transport additional data.)
 */
public class PreparationContext {
    private final MfaSessionContext sessionContext;
    private final HttpServletRequest httpServletRequest;
    private final HttpServletResponse httpServletResponse;

    /**
     * Creates a new context for MFA preparation.
     *
     * @param httpServletRequest the HTTP servlet request with any additional preparation data
     */
    public PreparationContext(MfaSessionContext sessionContext,
                              HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse) {
        this.sessionContext = sessionContext;
        this.httpServletRequest = httpServletRequest;
        this.httpServletResponse = httpServletResponse;
    }

    public MfaSessionContext getSessionContext() {
        return sessionContext;
    }


    /**
     * Returns the HTTP servlet request that triggered MFA preparation.
     *
     * @return the HTTP servlet request containing any additional preparation data
     */
    public HttpServletRequest getHttpServletRequest() {
        return httpServletRequest;
    }

    public HttpServletResponse getHttpServletResponse() {
        return httpServletResponse;
    }
}
