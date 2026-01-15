package org.jahia.modules.upa.mfa;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Context object provided during the MFA initiation phase.
 * <p>
 * Contains all necessary information for initiating an MFA session, including:
 * <ul>
 *   <li>User credentials (username and password)</li>
 *   <li>Site key for multi-site environments</li>
 *   <li>Remember me preference</li>
 *   <li>HTTP request object</li>
 * </ul>
 */
public class InitiationContext {
    private final String username;
    private final String password;
    private final String siteKey;
    private final boolean rememberMe;
    private final HttpServletRequest httpServletRequest;
    private final HttpServletResponse httpServletResponse;

    /**
     * Creates a new initiation context.
     *
     * @param username            the username for authentication
     * @param password            the password for authentication
     * @param siteKey             the site key (may be null)
     * @param rememberMe          whether to enable "remember me" functionality
     * @param httpServletRequest  the HTTP request that triggered the initiation
     * @param httpServletResponse the HTTP response for setting cookies or headers
     */
    public InitiationContext(String username, String password, String siteKey, boolean rememberMe, HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse) {
        this.username = username;
        this.password = password;
        this.siteKey = siteKey;
        this.rememberMe = rememberMe;
        this.httpServletRequest = httpServletRequest;
        this.httpServletResponse = httpServletResponse;
    }

    /**
     * Returns the username for authentication.
     *
     * @return the username
     */
    public String getUsername() {
        return username;
    }

    /**
     * Returns the password for authentication.
     *
     * @return the password
     */
    public String getPassword() {
        return password;
    }

    /**
     * Returns the site key for multi-site environments.
     *
     * @return the site key, or null if not applicable
     */
    public String getSiteKey() {
        return siteKey;
    }

    /**
     * Returns whether the "remember me" functionality is enabled.
     *
     * @return true if remember me is enabled, false otherwise
     */
    public boolean isRememberMe() {
        return rememberMe;
    }

    /**
     * Returns the HTTP request that triggered the initiation.
     * <p>
     * This can be used to access request attributes, headers, or session information.
     *
     * @return the HTTP servlet request
     */
    public HttpServletRequest getHttpServletRequest() {
        return httpServletRequest;
    }

    /**
     * Returns the HTTP response for setting cookies or headers.
     *
     * @return the HTTP servlet response
     */
    public HttpServletResponse getHttpServletResponse() {
        return httpServletResponse;
    }
}

