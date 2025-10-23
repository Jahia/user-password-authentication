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
import org.jahia.modules.mfa.MfaSessionState;

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
        GqlMfaGenericResponse response;
        try {
            HttpServletRequest httpServletRequest = ContextUtil.getHttpServletRequest(environment.getGraphQlContext());
            MfaSession session = mfaService.initiateMfa(username, password, siteKey, httpServletRequest);
            response = GqlMfaGenericResponse.buildSuccessResponse(session);
        } catch (MfaException e) {
            response = GqlMfaGenericResponse.buildErrorResponse(e);
        } catch (Exception e) {
            response = GqlMfaGenericResponse.buildErrorResponse(e);
        }
        response.setRequiredFactors(mfaService.getAvailableFactors());
        return response;
    }


    @GraphQLField
    @GraphQLName("clear")
    @GraphQLDescription("Clear current MFA session")
    public GqlMfaGenericResponse clear(DataFetchingEnvironment environment) {
        GqlMfaGenericResponse response;
        try {
            HttpServletRequest httpServletRequest = ContextUtil.getHttpServletRequest(environment.getGraphQlContext());
            mfaService.clearMfaSession(httpServletRequest);
            response = new GqlMfaGenericResponse();
            response.setSuccess(true);
            response.setSessionState(MfaSessionState.NOT_STARTED.getValue());
        } catch (Exception e) {
            response = GqlMfaGenericResponse.buildErrorResponse(e);
        }
        response.setRequiredFactors(mfaService.getAvailableFactors());
        return response;
    }

    @GraphQLField
    @GraphQLName("factors")
    @GraphQLDescription("Access MFA factors specific mutations")
    public GqlMfaFactorsMutation getMfaFactors() {
        return new GqlMfaFactorsMutation(mfaService);
    }
}
