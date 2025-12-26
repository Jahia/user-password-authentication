package org.jahia.modules.upa.mfa.impl.gql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import graphql.schema.DataFetchingEnvironment;
import org.jahia.modules.graphql.provider.dxm.osgi.annotations.GraphQLOsgiService;
import org.jahia.modules.graphql.provider.dxm.util.ContextUtil;
import org.jahia.modules.upa.mfa.MfaService;
import org.jahia.modules.upa.mfa.MfaSession;
import org.jahia.modules.upa.mfa.gql.FactorsMutation;
import org.jahia.modules.upa.mfa.gql.Result;

import javax.inject.Inject;
import javax.servlet.http.HttpServletRequest;

@GraphQLName("UpaMutation")
@GraphQLDescription("User Password Authentication (UPA) state-modifying operations")
public class Mutation {

    private MfaService mfaService;

    @Inject
    @GraphQLOsgiService
    public void setMfaService(MfaService mfaService) {
        this.mfaService = mfaService;
    }

    @GraphQLField
    @GraphQLName("mfaInitiate")
    @GraphQLDescription("Initiate MFA authentication")
    public Result initiate(@GraphQLName("username") String username,
                           @GraphQLName("password") String password,
                           @GraphQLName("site") String siteKey,
                           DataFetchingEnvironment environment) {
        HttpServletRequest httpServletRequest = ContextUtil.getHttpServletRequest(environment.getGraphQlContext());
        MfaSession session = mfaService.initiate(username, password, siteKey, httpServletRequest);
        return new Result(session);
    }


    @GraphQLField
    @GraphQLName("mfaClear")
    @GraphQLDescription("Clear current MFA session")
    public Result clear(DataFetchingEnvironment environment) {
        HttpServletRequest httpServletRequest = ContextUtil.getHttpServletRequest(environment.getGraphQlContext());
        mfaService.clearMfaSession(httpServletRequest);
        return new Result(new MfaSession(null));
    }

    @GraphQLField
    @GraphQLName("mfaFactors")
    @GraphQLDescription("Access MFA factors specific mutations")
    public static FactorsMutation getMfaFactors() {
        return new FactorsMutation();
    }

}
