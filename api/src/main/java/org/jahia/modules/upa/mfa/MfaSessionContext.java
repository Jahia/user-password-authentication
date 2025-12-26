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
package org.jahia.modules.upa.mfa;

import java.io.Serializable;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

/**
 * Immutable context containing user and session-specific information for an MFA authentication flow.
 * This context is created during session initiation and remains unchanged throughout the MFA process.
 */
public class MfaSessionContext implements Serializable {
    private final String userId;
    private final Locale userPreferredLanguage;
    private final String siteKey;
    private final List<String> requiredFactors;

    /**
     * Creates a new MFA session context.
     *
     * @param userId                the unique identifier for the user
     * @param userPreferredLanguage the user's preferred language for localized messages
     * @param siteKey               the site context for this MFA session (may be null)
     * @param requiredFactors       the list of factor types required to complete authentication
     */
    public MfaSessionContext(String userId, Locale userPreferredLanguage, String siteKey, List<String> requiredFactors) { // constructor renamed
        this.userId = userId;
        this.userPreferredLanguage = userPreferredLanguage;
        this.siteKey = siteKey;
        this.requiredFactors = requiredFactors != null ? requiredFactors : Collections.emptyList();
    }

    /**
     * Returns the user identifier for this session.
     *
     * @return the user ID
     */
    public String getUserId() {
        return userId;
    }

    /**
     * Returns the user's preferred language for localized content.
     *
     * @return the user's locale
     */
    public Locale getUserPreferredLanguage() {
        return userPreferredLanguage;
    }

    /**
     * Returns the site key associated with this MFA session.
     *
     * @return the site key, or null if no specific site context
     */
    public String getSiteKey() {
        return siteKey;
    }

    /**
     * Returns the list of factor types required to complete authentication.
     *
     * @return an unmodifiable list of required factor type identifiers
     */
    public List<String> getRequiredFactors() {
        return requiredFactors;
    }

    @Override
    public String toString() {
        return "MfaSessionContext{" +
                "userId='" + userId + '\'' +
                ", userPreferredLanguage=" + userPreferredLanguage +
                ", siteKey='" + siteKey + '\'' +
                ", requiredFactors=" + requiredFactors +
                '}';
    }
}
