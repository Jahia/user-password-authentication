package org.jahia.modules.mfa;

import org.jahia.services.content.decorator.JCRUserNode;

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
    // TODO should this just be mfaSession + request + response ?
    // and get user node from its id + add javadoc how to use userId
    private final JCRUserNode user;
    private final HttpServletRequest httpServletRequest;
    private final HttpServletResponse httpServletResponse;
    private final MfaSession mfaSession;

    /**
     * Creates a new context for MFA preparation.
     *
     * @param user               the user account for which MFA preparation is needed
     * @param httpServletRequest the HTTP servlet request with any additional preparation data
     */
    public PreparationContext(MfaSession session, JCRUserNode user,
                              HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse) {
        this.mfaSession = session;
        this.user = user;
        this.httpServletRequest = httpServletRequest;
        this.httpServletResponse = httpServletResponse;
    }

    /**
     * Returns the user for MFA preparation.
     *
     * @return the user for whom multi-factor authentication is being prepared
     */
    public JCRUserNode getUser() {
        return user;
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

    public MfaSession getMfaSession() {
        return mfaSession;
    }
}
