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
package org.jahia.modules.mfa;

import java.util.List;
import java.util.Locale;

public class MfaSessionContext {
    private final String userId;
    private final Locale userPreferredLanguage;
    private final String siteKey;
    private final List<String> requiredFactors;

    public MfaSessionContext(String userId, Locale userPreferredLanguage, String siteKey, List<String> requiredFactors) {
        this.userId = userId;
        this.userPreferredLanguage = userPreferredLanguage;
        this.siteKey = siteKey;
        this.requiredFactors = requiredFactors;
    }

    public String getUserId() {
        return userId;
    }

    public Locale getUserPreferredLanguage() {
        return userPreferredLanguage;
    }

    public String getSiteKey() {
        return siteKey;
    }

    public List<String> getRequiredFactors() {
        return requiredFactors;
    }

    @Override
    public String toString() {
        return "MfaSessionContext{" +
                "userId='" + userId + '\'' +
                ", siteKey='" + siteKey + '\'' +
                '}';
    }
}
