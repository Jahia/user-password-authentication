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
package org.jahia.modules.upa.mfa.impl.gql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import graphql.schema.DataFetchingEnvironment;
import org.jahia.modules.graphql.provider.dxm.osgi.annotations.GraphQLOsgiService;
import org.jahia.modules.graphql.provider.dxm.util.ContextUtil;
import org.jahia.modules.upa.mfa.MfaService;
import org.jahia.modules.upa.mfa.MfaSession;
import org.jahia.modules.upa.mfa.gql.Session;

import javax.inject.Inject;
import javax.servlet.http.HttpServletRequest;
import java.util.List;

@GraphQLName("UpaQuery")
@GraphQLDescription("Read-only Password Authentication (UPA) operations: availability, factors and current session state")
public class Query {

    private MfaService mfaService;

    @Inject
    @GraphQLOsgiService
    public void setMfaService(MfaService mfaService) {
        this.mfaService = mfaService;
    }


    @GraphQLField
    @GraphQLName("mfaAvailableFactors")
    @GraphQLDescription("List of factor types currently available and enabled")
    public List<String> availableFactors() {
        return mfaService.getAvailableFactors();
    }

    @GraphQLField
    @GraphQLName("mfaSession")
    @GraphQLDescription("Current MFA session (returns an error session if none exists)")
    public Session session(DataFetchingEnvironment environment) {
        HttpServletRequest httpServletRequest = ContextUtil.getHttpServletRequest(environment.getGraphQlContext());
        MfaSession session = mfaService.getMfaSession(httpServletRequest);
        if (session == null) {
            session = mfaService.createNoSessionError();
        }
        return new Session(session);
    }
}
