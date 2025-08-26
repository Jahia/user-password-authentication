package org.jahia.modules.mfa.impl;

import org.jahia.modules.mfa.MfaService;
import org.jahia.params.valves.LoginUrlProvider;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import javax.servlet.http.HttpServletRequest;

/**
 * Provides custom login URL when MFA is enabled.
 */
@Component(immediate = true, service = LoginUrlProvider.class)
public class MfaLoginUrlProvider implements LoginUrlProvider {

    private MfaService mfaService;
    private MfaServiceImpl mfaServiceImpl;

    @Reference
    public void setMfaService(MfaService mfaService) {
        this.mfaService = mfaService;
        // Cast to implementation to access config
        this.mfaServiceImpl = (MfaServiceImpl) mfaService;
    }

    @Override
    public String getLoginUrl(HttpServletRequest httpServletRequest) {
        return mfaService.isEnabled() ? mfaServiceImpl.getConfigInstance().loginUrl() : null;
    }

    @Override
    public boolean hasCustomLoginUrl() {
        return true;
    }
}
