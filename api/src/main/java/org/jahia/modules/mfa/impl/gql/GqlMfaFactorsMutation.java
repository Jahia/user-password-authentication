package org.jahia.modules.mfa.impl.gql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import graphql.schema.DataFetchingEnvironment;
import org.jahia.modules.graphql.provider.dxm.util.ContextUtil;
import org.jahia.modules.mfa.MfaException;
import org.jahia.modules.mfa.MfaService;
import org.jahia.modules.mfa.MfaSession;
import org.jahia.modules.mfa.impl.factors.EmailCodeFactorProvider;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * This GraphQL mutation class handles MFA factors specific operations.
 * TODO: move to a separate package and export via OSGi, in order to allow extending it with custom factors from other modules.
 */
@GraphQLName("MfaFactorsMutation")
@GraphQLDescription("MFA state-modifying operations")
public class GqlMfaFactorsMutation {

    private final MfaService mfaService;

    public GqlMfaFactorsMutation(MfaService mfaService) {
        this.mfaService = mfaService;
    }

    @GraphQLField
    @GraphQLName("prepareEmailCodeFactor")
    @GraphQLDescription("Prepare the email code factor")
    public GqlMfaEmailCodeFactorPreparationResponse prepareEmailCodeFactor(DataFetchingEnvironment environment) {
        GqlMfaEmailCodeFactorPreparationResponse response;
        try {
            HttpServletRequest httpServletRequest = ContextUtil.getHttpServletRequest(environment.getGraphQlContext());
            HttpServletResponse httpServletResponse = ContextUtil.getHttpServletResponse(environment.getGraphQlContext());
            MfaSession session = mfaService.prepareFactor(EmailCodeFactorProvider.FACTOR_TYPE, httpServletRequest, httpServletResponse);
            response = GqlMfaEmailCodeFactorPreparationResponse.buildSuccessResponse(session);
        } catch (MfaException e) {
            response = GqlMfaEmailCodeFactorPreparationResponse.buildErrorResponse(e);
        } catch (Exception unexpectedException) {
            response = GqlMfaEmailCodeFactorPreparationResponse.buildErrorResponse(unexpectedException);
        }
        response.setRequiredFactors(mfaService.getAvailableFactors());
        return response;
    }

    @GraphQLField
    @GraphQLName("verifyEmailCodeFactor")
    @GraphQLDescription("Verify email code factor")
    public GqlMfaGenericResponse verifyEmailCodeFactor(@GraphQLName("code") String code, DataFetchingEnvironment environment) {
        GqlMfaGenericResponse response;
        try {
            HttpServletRequest httpServletRequest = ContextUtil.getHttpServletRequest(environment.getGraphQlContext());
            MfaSession session = mfaService.verifyFactor(EmailCodeFactorProvider.FACTOR_TYPE, httpServletRequest, code);
            response = GqlMfaGenericResponse.buildSuccessResponse(session);
        } catch (MfaException e) {
            response = GqlMfaGenericResponse.buildErrorResponse(e);
        } catch (Exception unexpectedException) {
            response = GqlMfaGenericResponse.buildErrorResponse(unexpectedException);
        }
        response.setRequiredFactors(mfaService.getAvailableFactors());
        return response;
    }
}
