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

import java.io.Serializable;
import java.util.*;

/**
 * Stores the authentication failure timestamps for a user, grouped by MFA provider type.
 * <p>
 * Used by {@link MfaServiceImpl} to determine if a user has exceeded the allowed number of MFA authentication failures
 * within a configurable time window.
 */
final class AuthFailuresDetails implements Serializable {
    private final Map<String, List<Long>> failureTimestamps = new HashMap<>();


    /**
     * Records a new authentication failure attempt for the specified MFA provider type.
     *
     * @param factorType the MFA provider type (see {@link org.jahia.modules.mfa.MfaFactorProvider#getFactorType()})
     */
    public void addFailureAttempt(String factorType) {
        getOrCreateFailureTimestamps(factorType).add(System.currentTimeMillis());
    }

    /**
     * Returns the number of authentication failure attempts for the specified MFA provider type.
     *
     * @param factorType the MFA provider type (see {@link org.jahia.modules.mfa.MfaFactorProvider#getFactorType()})
     * @return the count of failure attempts
     */
    public int getFailureAttemptsCount(String factorType) {
        return getOrCreateFailureTimestamps(factorType).size();
    }

    /**
     * Removes failure attempts for the specified MFA provider type that are outside the given time window.
     *
     * @param factorType               the MFA provider type (see {@link org.jahia.modules.mfa.MfaFactorProvider#getFactorType()})
     * @param authFailuresWindowMillis the time window in milliseconds
     * @return {@code true} if any attempts were removed, {@code false} otherwise
     */
    public boolean removeAttemptsOutsideWindow(String factorType, long authFailuresWindowMillis) {
        boolean removed = false;
        long timeLimit = System.currentTimeMillis() - authFailuresWindowMillis;
        Iterator<Long> iterator = getOrCreateFailureTimestamps(factorType).iterator();

        while (iterator.hasNext()) {
            Long ts = iterator.next();
            if (ts < timeLimit) {
                iterator.remove();
                removed = true;
            } else {
                // Once we find a timestamp that's not older than the given timestamp,
                // we can stop since all following timestamps will also be newer
                break;
            }
        }

        return removed;
    }

    private List<Long> getOrCreateFailureTimestamps(String factorType) {
        return failureTimestamps.computeIfAbsent(factorType, k -> new LinkedList<>());
    }
}
