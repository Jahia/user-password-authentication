package org.jahia.modules.mfa.impl.gql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import graphql.schema.DataFetchingEnvironment;
import org.jahia.modules.graphql.provider.dxm.osgi.annotations.GraphQLOsgiService;
import org.jahia.modules.graphql.provider.dxm.util.ContextUtil;
import org.jahia.modules.mfa.MfaService;
import org.jahia.modules.mfa.MfaSession;

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
    public GqlMfaResponse initiate(@GraphQLName("username") String username,
                                   @GraphQLName("password") String password,
                                   DataFetchingEnvironment environment) {
        try {
            HttpServletRequest httpServletRequest = ContextUtil.getHttpServletRequest(environment.getGraphQlContext());
            MfaSession session = mfaService.initiateMfa(username, password, httpServletRequest);
            return GqlMfaUtils.createSuccessResponse(session);
        } catch (IllegalArgumentException e) {
            return GqlMfaUtils.createErrorResponse(e.getMessage());
        } catch (Exception e) {
            return GqlMfaUtils.createErrorResponse("Failed to initiate MFA: " + e.getMessage());
        }
    }

    @GraphQLField
    @GraphQLName("prepareFactor")
    @GraphQLDescription("Prepare a specific MFA factor")
    public GqlMfaResponse prepareFactor(@GraphQLName("factorType") String factorType,
                                        DataFetchingEnvironment environment) {
        try {
            HttpServletRequest httpServletRequest = ContextUtil.getHttpServletRequest(environment.getGraphQlContext());
            MfaSession session = mfaService.prepareFactor(factorType, httpServletRequest);
            String error = session.getFactorPreparationError(factorType);
            if (error != null) {
                return GqlMfaUtils.createErrorResponse(error);
            }

            return GqlMfaUtils.createSessionStatusResponse(session);
        } catch (Exception e) {
            return GqlMfaUtils.createErrorResponse("Failed to prepare factor: " + e.getMessage());
        }
    }

    @GraphQLField
    @GraphQLName("clear")
    @GraphQLDescription("Clear current MFA session")
    public GqlMfaResponse clear(DataFetchingEnvironment environment) {
        try {
            HttpServletRequest httpServletRequest = ContextUtil.getHttpServletRequest(environment.getGraphQlContext());
            mfaService.clearMfaSession(httpServletRequest);
            GqlMfaResponse response = new GqlMfaResponse();
            response.setSuccess(true);
            response.setSessionState("not_started");
            return response;
        } catch (Exception e) {
            return GqlMfaUtils.createErrorResponse("Failed to clear session: " + e.getMessage());
        }
    }

    @GraphQLField
    @GraphQLName("factors")
    @GraphQLDescription("Access MFA factors specific mutations")
    public GqlMfaFactorsMutation getMfaFactors() {
        return new GqlMfaFactorsMutation(mfaService);
    }
}
