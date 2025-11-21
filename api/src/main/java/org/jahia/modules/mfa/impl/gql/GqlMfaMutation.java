package org.jahia.modules.mfa.impl.gql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import graphql.schema.DataFetchingEnvironment;
import org.jahia.modules.graphql.provider.dxm.osgi.annotations.GraphQLOsgiService;
import org.jahia.modules.graphql.provider.dxm.util.ContextUtil;
import org.jahia.modules.mfa.MfaException;
import org.jahia.modules.mfa.MfaService;
import org.jahia.modules.mfa.MfaSession;
import org.jahia.modules.mfa.gql.GqlFactorsMutation;
import org.jahia.modules.mfa.gql.GqlMfaGenericResponse;

import javax.inject.Inject;
import javax.servlet.http.HttpServletRequest;

@GraphQLName("MfaMutation")
@GraphQLDescription("MFA state-modifying operations")
public class GqlMfaMutation {

    private MfaService mfaService;

    @Inject
    @GraphQLOsgiService
    public void setMfaService(MfaService mfaService) {
        this.mfaService = mfaService;
    }

    @GraphQLField
    @GraphQLName("initiate")
    @GraphQLDescription("Initiate MFA authentication")
    public GqlMfaGenericResponse initiate(@GraphQLName("username") String username,
                                          @GraphQLName("password") String password,
                                          @GraphQLName("site") String siteKey,
                                          DataFetchingEnvironment environment) {
        HttpServletRequest httpServletRequest = ContextUtil.getHttpServletRequest(environment.getGraphQlContext());
        MfaSession session = mfaService.initiate(username, password, siteKey, httpServletRequest);
        return new GqlMfaGenericResponse(session);
    }


    @GraphQLField
    @GraphQLName("clear")
    @GraphQLDescription("Clear current MFA session")
    public GqlMfaGenericResponse clear(DataFetchingEnvironment environment) {
        GqlMfaGenericResponse response;
        HttpServletRequest httpServletRequest = ContextUtil.getHttpServletRequest(environment.getGraphQlContext());
        mfaService.clearMfaSession(httpServletRequest);
        // TODO review
        return new GqlMfaGenericResponse(new MfaSession(null));

    }

    @GraphQLField
    @GraphQLName("factors")
    @GraphQLDescription("Access MFA factors specific mutations")
    public static GqlFactorsMutation getMfaFactors() {
        return new GqlFactorsMutation();
    }

    /**
     * Converts an MfaError to MfaException for backward compatibility with GraphQL response structure.
     */
    private MfaException toMfaException(org.jahia.modules.mfa.MfaError error) {
        return new MfaException(error.getCode(), error.getArguments());
    }

}
