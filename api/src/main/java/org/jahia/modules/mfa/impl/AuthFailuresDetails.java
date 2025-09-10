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

import org.jahia.modules.mfa.MfaFactorProvider;

import java.io.Serializable;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;

/**
 * Details about the authentication failures of a given user.
 * It contains the timestamps of the authentication failures, used by {@link AuthFailuresTracker#hasReachedAuthFailuresCountLimit(String, MfaFactorProvider)} to decide if the user has reached the maximum number of MFA authentication failures.
 */

public class AuthFailuresDetails implements Serializable {
    private final List<Long> failureTimestamps = new LinkedList<>();

    public void addFailureAttempt() {
        failureTimestamps.add(System.currentTimeMillis());
    }

    public int getFailureAttemptsCount() {
        return failureTimestamps.size();
    }

    public boolean removeAttemptsOutsideWindow(long authFailuresWindowMillis) {
        boolean removed = false;
        long timeLimit = System.currentTimeMillis() - authFailuresWindowMillis;
        Iterator<Long> iterator = failureTimestamps.iterator();

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
}
