/*
 * ==========================================================================================
 * =                            JAHIA'S ENTERPRISE DISTRIBUTION                             =
 * ==========================================================================================
 *
 *                                  http://www.jahia.com
 *
 * JAHIA'S ENTERPRISE DISTRIBUTIONS LICENSING - IMPORTANT INFORMATION
 * ==========================================================================================
 *
 *     Copyright (C) 2002-2025 Jahia Solutions Group. All rights reserved.
 *
 *     This file is part of a Jahia's Enterprise Distribution.
 *
 *     Jahia's Enterprise Distributions must be used in accordance with the terms
 *     contained in the Jahia Solutions Group Terms &amp; Conditions as well as
 *     the Jahia Sustainable Enterprise License (JSEL).
 *
 *     For questions regarding licensing, support, production usage...
 *     please contact our team at sales@jahia.com or go to http://www.jahia.com/license.
 *
 * ==========================================================================================
 */
package org.jahia.modules.mfa.impl;

import org.jahia.api.Constants;
import org.jahia.security.spi.LicenseCheckUtil;
import org.jahia.services.content.JCRSessionFactory;
import org.jahia.services.content.decorator.JCRUserNode;
import org.jahia.services.preferences.user.UserPreferencesHelper;
import org.jahia.services.usermanager.JahiaUser;
import org.jahia.services.usermanager.JahiaUserManagerService;
import org.jahia.settings.SettingsBean;
import org.jahia.utils.LanguageCodeConverters;
import org.jahia.utils.i18n.JahiaLocaleContextHolder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.util.Locale;

public class AuthHelper {
    private static final Logger logger = LoggerFactory.getLogger(AuthHelper.class);

    private AuthHelper() {
        // helper class
    }

    // TODO partially duplicated from LoginEngineAuthValveImpl#getJcrUserNode(), to be refactored
    public static JCRUserNode lookupUserFromCredentials(String username, String password, String site) {
        JCRUserNode theUser = JahiaUserManagerService.getInstance().lookupUser(username, site);
        if (theUser != null) {
            if (theUser.verifyPassword(password)) {
                if (!theUser.isAccountLocked()) {
                    if (!theUser.isRoot() && LicenseCheckUtil.isLoggedInUsersLimitReached()) {
                        logger.warn("The number of logged in users has reached the authorized limit.");
                    } else {
                        return theUser;
                    }
                } else {
                    logger.warn("Login failed: account for user {} is locked.", theUser.getName());
                }
            } else {
                logger.warn("Login failed: password verification failed for user {}", theUser.getName());
            }
        } else {
            logger.debug("Login failed. Unknown username {}", username);
        }
        return null;
    }

    // TODO partially duplicated from LoginEngineAuthValveImpl (see if we can refactor or probably complete with missing features, like login event)
    public static void authenticateUser(HttpServletRequest req, JCRUserNode validatedUserNode) throws IOException {
        if (validatedUserNode == null) {
            throw new IllegalArgumentException("validatedUserNode cannot be null");
        }

        JahiaUserManagerService userManagerService = JahiaUserManagerService.getInstance();
        JCRSessionFactory sessionFactory = JCRSessionFactory.getInstance();

        if (userManagerService == null || sessionFactory == null) {
            throw new IOException("Required services are not available");
        }

        try {
            sessionFactory.setCurrentUser(null);

            JCRUserNode theUser = userManagerService.lookupUserByPath(validatedUserNode.getPath());
            if (theUser == null) {
                throw new IOException("User not found: " + validatedUserNode.getPath());
            }

            JahiaUser jahiaUser = theUser.getJahiaUser();

            // Invalidate existing session if it exists
            HttpSession existingSession = req.getSession(false);
            if (existingSession != null) {
                try {
                    existingSession.invalidate();
                } catch (IllegalStateException e) {
                    logger.debug("Session was already invalidated", e);
                }
            }

            if (theUser.isAccountLocked()) {
                // Set guest user and return - don't try to invalidate already invalidated session
                sessionFactory.setCurrentUser(userManagerService.lookupUserByPath(JahiaUserManagerService.GUEST_USERPATH).getJahiaUser());
                logger.warn("Authentication failed: account for user {} is locked.", theUser.getName());
                return;
            }

            sessionFactory.setCurrentUser(jahiaUser);

            // set UI locale to the user's preferred locale after login
            Locale preferredUserLocale = UserPreferencesHelper.getPreferredLocale(theUser, LanguageCodeConverters.resolveLocaleForGuest(req));

            // Create new session and set attributes
            HttpSession httpSession = req.getSession(true);
            httpSession.setAttribute(Constants.SESSION_UI_LOCALE, preferredUserLocale);
            if (SettingsBean.getInstance().isConsiderPreferredLanguageAfterLogin()) {
                httpSession.setAttribute(Constants.SESSION_LOCALE, preferredUserLocale);
            }

            // Update thread locale context
            JahiaLocaleContextHolder.setLocale(preferredUserLocale);

            // Store the authenticated user in the session, next requests will use it (SessionAuthValveImpl)
            httpSession.setAttribute(Constants.SESSION_USER, sessionFactory.getCurrentUser());

            logger.debug("User {} successfully authenticated", theUser.getName());

        } catch (Exception e) {
            // Ensure we don't leave the system in an inconsistent state
            try {
                sessionFactory.setCurrentUser(userManagerService.lookupUserByPath(JahiaUserManagerService.GUEST_USERPATH).getJahiaUser());
            } catch (Exception fallbackException) {
                logger.error("Failed to set guest user as fallback", fallbackException);
            }

            if (e instanceof IOException) {
                throw e;
            } else {
                throw new IOException("Authentication failed", e);
            }
        }
    }
}