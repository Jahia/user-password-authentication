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

import javax.inject.Inject;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

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
    public GqlMfaResponse initiate(@GraphQLName("username") String username,
                                   @GraphQLName("password") String password,
                                   @GraphQLName("site") String siteKey,
                                   DataFetchingEnvironment environment) {
        GqlMfaResponse response;
        try {
            HttpServletRequest httpServletRequest = ContextUtil.getHttpServletRequest(environment.getGraphQlContext());
            MfaSession session = mfaService.initiateMfa(username, password, siteKey, httpServletRequest);
            response = GqlMfaUtils.createInitiateResponse(session);
        } catch (IllegalArgumentException e) {
            response = GqlMfaUtils.createErrorResponse(e.getMessage());
        } catch (Exception e) {
            response = GqlMfaUtils.createErrorResponse("Failed to initiate MFA: " + e.getMessage());
        }
        response.setRequiredFactors(mfaService.getAvailableFactors());
        return response;
    }

    @GraphQLField
    @GraphQLName("prepareFactor")
    @GraphQLDescription("Prepare a specific MFA factor")
    public GqlMfaResponse prepareFactor(@GraphQLName("factorType") String factorType,
                                        DataFetchingEnvironment environment) {
        GqlMfaResponse response;
        try {
            HttpServletRequest httpServletRequest = ContextUtil.getHttpServletRequest(environment.getGraphQlContext());
            HttpServletResponse httpServletResponse = ContextUtil.getHttpServletResponse(environment.getGraphQlContext());
            MfaSession session = mfaService.prepareFactor(factorType, httpServletRequest, httpServletResponse);
            response = GqlMfaUtils.createFactorPreparationResponse(session, factorType);
        } catch (Exception e) {
            response = GqlMfaUtils.createErrorResponse("Failed to prepare factor: " + e.getMessage());
        }
        response.setRequiredFactors(mfaService.getAvailableFactors());
        return response;
    }

    @GraphQLField
    @GraphQLName("clear")
    @GraphQLDescription("Clear current MFA session")
    public GqlMfaResponse clear(DataFetchingEnvironment environment) {
        GqlMfaResponse response;
        try {
            HttpServletRequest httpServletRequest = ContextUtil.getHttpServletRequest(environment.getGraphQlContext());
            mfaService.clearMfaSession(httpServletRequest);
            response = new GqlMfaResponse();
            response.setSuccess(true);
            response.setSessionState(MfaSessionState.NOT_STARTED);
        } catch (Exception e) {
            response = GqlMfaUtils.createErrorResponse("Failed to clear session: " + e.getMessage());
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
