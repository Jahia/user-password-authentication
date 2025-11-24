package org.jahia.modules.mfa.impl;

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
    private ConfigurationService configurationService;

    @Reference
    public void setConfigurationService(ConfigurationService configurationService) {
        this.configurationService = configurationService;
    }

    @Override
    public String getLoginUrl(HttpServletRequest httpServletRequest) {
        return configurationService.getLoginUrl();
    }

    @Override
    public boolean hasCustomLoginUrl() {
        // to be registered, the LoginUrlProvider must return true here
        // this has been improved in https://github.com/Jahia/jahia-private/pull/4240, but is not available in Jahia 8.2.1.0 (the target Jahia version of this module)
        return true;
    }
}
