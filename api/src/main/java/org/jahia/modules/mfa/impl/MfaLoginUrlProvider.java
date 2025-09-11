package org.jahia.modules.mfa.impl;

import org.apache.commons.lang3.StringUtils;
import org.jahia.params.valves.LoginUrlProvider;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import javax.servlet.http.HttpServletRequest;

/**
 * Provides custom login URL when MFA is enabled.
 */
@Component(immediate = true, service = LoginUrlProvider.class)
public class MfaLoginUrlProvider implements LoginUrlProvider {

    @Reference
    private MfaConfigurationService mfaConfigurationService;

    @Reference
    public void setMfaConfigurationService(MfaConfigurationService mfaConfigurationService) {
        this.mfaConfigurationService = mfaConfigurationService;
    }

    @Override
    public String getLoginUrl(HttpServletRequest httpServletRequest) {
        return mfaConfigurationService.getLoginUrl();
    }

    @Override
    public boolean hasCustomLoginUrl() {
        return StringUtils.isNoneEmpty(mfaConfigurationService.getLoginUrl());
    }
}
