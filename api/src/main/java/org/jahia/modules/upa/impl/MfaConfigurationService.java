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
package org.jahia.modules.upa.impl;

import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.ConfigurationPolicy;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.Designate;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Internal configuration service for the MFA module.
 * This is an implementation detail and is not meant to be used outside of this module (hence, not exported).
 */
@Component(configurationPid = "org.jahia.modules.upa", service = MfaConfigurationService.class, immediate = true, configurationPolicy = ConfigurationPolicy.REQUIRE)
@Designate(ocd = MfaConfigurationService.Config.class)
public class MfaConfigurationService {
    private static final Logger logger = LoggerFactory.getLogger(MfaConfigurationService.class);
    private Config config;

    @ObjectClassDefinition(name = "%configName", description = "%configDesc", localization = "OSGI-INF/l10n/mfa/config")
    public @interface Config {
        @AttributeDefinition(name = "%loginUrl", description = "%loginUrlDesc")
        String loginUrl();

        @AttributeDefinition(name = "%mfaEnabledFactors", description = "%mfaEnabledFactorsDesc")
        String[] mfaEnabledFactors() default {"email_code"};

        @AttributeDefinition(
                name = "%mfaMaxAuthFailuresBeforeLock",
                description = "%mfaMaxAuthFailuresBeforeLockDesc",
                defaultValue = "5"
        )
        int mfaMaxAuthFailuresBeforeLock();

        @AttributeDefinition(
                name = "%mfaAuthFailuresWindowSeconds",
                description = "%mfaAuthFailuresWindowSecondsDesc",
                defaultValue = "120"
        )
        int mfaAuthFailuresWindowSeconds();

        @AttributeDefinition(
                name = "%mfaUserTemporarySuspensionSeconds",
                description = "%mfaUserTemporarySuspensionSecondsDesc",
                defaultValue = "600"
        )
        int mfaUserTemporarySuspensionSeconds();

        @AttributeDefinition(
                name = "%mfaFactorStartRateLimitSeconds",
                description = "%mfaFactorStartRateLimitSecondsDesc",
                defaultValue = "30"
        )
        int mfaFactorStartRateLimitSeconds();
    }

    @Activate
    public void activate(Config config) {
        this.config = config;
        logger.info("MFA Service activated");
    }

    @Modified
    public void modified(Config config) {
        this.config = config;
        logger.info("MFA Service configuration modified");
    }

    public String getLoginUrl() {
        return config.loginUrl();
    }

    public String[] getMfaEnabledFactors() {
        return config.mfaEnabledFactors();
    }

    public int getMfaMaxAuthFailuresBeforeLock() {
        return config.mfaMaxAuthFailuresBeforeLock();
    }

    public int getMfaAuthFailuresWindowSeconds() {
        return config.mfaAuthFailuresWindowSeconds();
    }

    public int getMfaUserTemporarySuspensionSeconds() {
        return config.mfaUserTemporarySuspensionSeconds();
    }

    public int getMfaFactorStartRateLimitSeconds() {
        return config.mfaFactorStartRateLimitSeconds();
    }

}
