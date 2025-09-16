/*
 * Copyright (C) 2002-2025 Jahia Solutions Group SA. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.jahia.modules.mfa.impl.gql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import graphql.schema.DataFetchingEnvironment;
import org.jahia.modules.graphql.provider.dxm.osgi.annotations.GraphQLOsgiService;
import org.jahia.modules.graphql.provider.dxm.util.ContextUtil;
import org.jahia.modules.mfa.MfaService;
import org.jahia.modules.mfa.MfaSession;
import org.jahia.modules.mfa.MfaSessionState;
import org.jahia.modules.mfa.impl.MfaConfigurationService;

import javax.inject.Inject;
import javax.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.List;

@GraphQLName("MfaQuery")
@GraphQLDescription("MFA read-only operations")
public class GqlMfaQuery {

    private MfaService mfaService;
    private MfaConfigurationService mfaConfigurationService;

    @Inject
    @GraphQLOsgiService
    public void setMfaService(MfaService mfaService) {
        this.mfaService = mfaService;
    }

    @Inject
    @GraphQLOsgiService
    public void setMfaConfigurationService(MfaConfigurationService mfaConfigurationService) {
        this.mfaConfigurationService = mfaConfigurationService;
    }

    @GraphQLField
    @GraphQLName("enabled")
    @GraphQLDescription("Check if MFA is enabled")
    public boolean enabled() {
        return mfaConfigurationService.isEnabled();
    }

    @GraphQLField
    @GraphQLName("availableFactors")
    @GraphQLDescription("Get list of available MFA factors")
    public List<String> availableFactors() {
        return mfaService.getAvailableFactors();
    }

    @GraphQLField
    @GraphQLName("sessionStatus")
    @GraphQLDescription("Get current MFA session status")
    public GqlMfaResponse sessionStatus(DataFetchingEnvironment environment) {
        GqlMfaResponse response = new GqlMfaResponse();
        response.setRequiredFactors(mfaService.getAvailableFactors());
        try {
            HttpServletRequest httpServletRequest = ContextUtil.getHttpServletRequest(environment.getGraphQlContext());

            MfaSession session = mfaService.getMfaSession(httpServletRequest);

            if (session == null) {
                response.setSuccess(true);
                response.setSessionState(MfaSessionState.NOT_STARTED);
                response.setRequiredFactors(List.of());
                response.setCompletedFactors(List.of());
                return response;
            }

            // Build response from service data directly in GraphQL layer
            response.setSuccess(true);
            response.setSessionState(session.getState());

            response.setCompletedFactors(new ArrayList<>(session.getCompletedFactors()));

            return response;

        } catch (Exception e) {
            response.setSuccess(false);
            response.setError("Failed to get session status: " + e.getMessage());
            return response;
        }
    }
}
