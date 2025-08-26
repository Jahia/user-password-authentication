package org.jahia.modules.mfa;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import graphql.schema.DataFetchingEnvironment;
import org.jahia.modules.graphql.provider.dxm.osgi.annotations.GraphQLOsgiService;
import org.jahia.modules.graphql.provider.dxm.util.ContextUtil;
import org.jahia.modules.mfa.impl.gql.GqlMfaResponse;
import org.jahia.modules.mfa.impl.gql.GqlMfaUtils;

import javax.servlet.http.HttpServletRequest;

/**
 * This GraphQL mutation class handles MFA factors specific operations.
 * It's exported and exposed, because it could be extended by other modules that would add their own factors.
 */
@GraphQLName("MfaFactorsMutation")
@GraphQLDescription("MFA state-modifying operations")
public class GqlMfaFactorsMutation {

    private final static String EMAIL_CODE_FACTOR = "email_code";

    private MfaService mfaService;

    public GqlMfaFactorsMutation(MfaService mfaService) {
        this.mfaService = mfaService;
    }

    @GraphQLField
    @GraphQLName("verifyEmailCodeFactor")
    @GraphQLDescription("Verify email code factor")
    public GqlMfaResponse verifyEmailCodeFactor(@GraphQLName("code") String code, DataFetchingEnvironment environment) {
        try {
            HttpServletRequest httpServletRequest = ContextUtil.getHttpServletRequest(environment.getGraphQlContext());

            // Set the code for the provider to access
            httpServletRequest.setAttribute("code", code);
            MfaSession session = mfaService.verifyFactor(EMAIL_CODE_FACTOR, httpServletRequest);
            String error = session.getFactorVerificationError(EMAIL_CODE_FACTOR);
            if (error != null) {
                return GqlMfaUtils.createErrorResponse(error);
            }

            return GqlMfaUtils.createSessionStatusResponse(session);
        } catch (Exception e) {
            return GqlMfaUtils.createErrorResponse("Failed to verify email code: " + e.getMessage());
        }
    }
}
