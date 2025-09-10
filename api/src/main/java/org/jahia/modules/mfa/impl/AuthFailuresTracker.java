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

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.RemovalListener;
import org.jahia.modules.mfa.MfaFactorProvider;
import org.osgi.service.component.annotations.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.TimeUnit;
import java.util.function.BiConsumer;

/**
 * Helper class for tracking authentication failures for Multi-Factor Authentication (MFA).
 * It leverages a Caffeine cache to store failed authentication attempts in memory and enforces limits as configured
 * in the associated {@link MfaConfigurationService}. This is used to monitor and limit further login attempts
 * after repeated failures.
 */
@Component(service = AuthFailuresTracker.class, immediate = true)
public class AuthFailuresTracker {
    private static final Logger logger = LoggerFactory.getLogger(AuthFailuresTracker.class);
    MfaConfigurationService mfaConfigurationService;
    private Cache<String, AuthFailuresDetails> failuresCache;
    private final transient List<BiConsumer<String, AuthFailuresDetails>> evictionListeners = new CopyOnWriteArrayList<>();


    @Reference
    public void setMfaConfigurationService(MfaConfigurationService mfaConfigurationService) {
        this.mfaConfigurationService = mfaConfigurationService;
        mfaConfigurationService.addChangeListener(this::modified);
        activate();
    }

    public void unsetMfaConfigurationService(MfaConfigurationService mfaConfigurationService) {
        if (this.mfaConfigurationService == mfaConfigurationService) {
            this.mfaConfigurationService.removeChangeListener(this::modified);
            this.mfaConfigurationService = null;
        }
    }

    @Activate
    public void activate() {
        logger.info("Initializing Caffeine cache for MFA auth failures...");
        failuresCache = Caffeine.newBuilder()
                .expireAfterWrite(mfaConfigurationService.getAuthFailuresWindowSeconds(), TimeUnit.SECONDS)
                .evictionListener(createRemovalListener())
                .build();
        logger.info("Caffeine cache initialized.");
    }

    private RemovalListener<String, AuthFailuresDetails> createRemovalListener() {
        return (userNodePath, authFailuresDetails, cause) -> evictionListeners.forEach(el -> el.accept(userNodePath, authFailuresDetails));
    }

    @Modified
    public void modified() {
        deactivate();
        activate();
    }

    @Deactivate
    public void deactivate() {
        failuresCache.invalidateAll();
        failuresCache.cleanUp();
    }

    public void addEvictionListener(BiConsumer<String, AuthFailuresDetails> listener) {
        evictionListeners.add(listener);
    }

    public void removeEvictionListener(BiConsumer<String, AuthFailuresDetails> listener) {
        evictionListeners.remove(listener);
    }

    public void trackFailure(String userNodePath, MfaFactorProvider provider) {
        if (!provider.areAuthenticationFailuresTracked()) {
            logger.debug("Provider {} does not track authentication failures", provider.getFactorType());
            return;
        }
        AuthFailuresDetails tracker = failuresCache.getIfPresent(userNodePath);
        if (tracker == null) {
            tracker = new AuthFailuresDetails();
        }
        tracker.addFailureAttempt();
        if (tracker.getFailureAttemptsCount() > mfaConfigurationService.getMaxAuthFailuresBeforeLock()) {
            logger.warn("User {} has failed to authenticate {} times in a row", userNodePath, tracker.getFailureAttemptsCount());
        } else {
            logger.debug("User {} has failed to authenticate {} times in a row", userNodePath, tracker.getFailureAttemptsCount());
        }
        failuresCache.put(userNodePath, tracker);
    }

    public boolean hasReachedAuthFailuresCountLimit(String userNodePath, MfaFactorProvider provider) {
        if (!provider.areAuthenticationFailuresTracked()) {
            logger.debug("Provider {} does not track authentication failures", provider.getFactorType());
            return false;
        }

        AuthFailuresDetails tracker = failuresCache.getIfPresent(userNodePath);
        if (tracker == null) {
            logger.debug("User {} has not failed to authenticate yet", userNodePath);
            return false;
        }

        if (tracker.removeAttemptsOutsideWindow(mfaConfigurationService.getAuthFailuresWindowSeconds() * 1000L)) {
            logger.debug("Expired timestamps removed for user {}", userNodePath);
            failuresCache.put(userNodePath, tracker);
        }

        return tracker.getFailureAttemptsCount() >= mfaConfigurationService.getMaxAuthFailuresBeforeLock();
    }
}
