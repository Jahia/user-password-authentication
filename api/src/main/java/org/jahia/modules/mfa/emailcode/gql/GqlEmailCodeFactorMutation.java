package org.jahia.modules.mfa.emailcode.gql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import graphql.schema.DataFetchingEnvironment;
import org.jahia.modules.graphql.provider.dxm.osgi.annotations.GraphQLOsgiService;
import org.jahia.modules.graphql.provider.dxm.util.ContextUtil;
import org.jahia.modules.mfa.MfaService;
import org.jahia.modules.mfa.MfaSession;
import org.jahia.modules.mfa.emailcode.EmailCodeFactorProvider;
import org.jahia.modules.mfa.gql.GqlMfaGenericResponse;

import javax.inject.Inject;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import static org.jahia.modules.mfa.emailcode.EmailCodeFactorProvider.FACTOR_TYPE;

@GraphQLName("MfaEmailCodeFactorMutation")
@GraphQLDescription("Mutation operations for the email code factor")
public class GqlEmailCodeFactorMutation {
    private MfaService mfaService;

    @Inject
    @GraphQLOsgiService
    public void setMfaService(MfaService mfaService) {
        this.mfaService = mfaService;
    }

    @GraphQLField
    @GraphQLName("prepare")
    @GraphQLDescription("Prepare the email code factor (generates and sends a code)")
    public GqlMfaEmailCodeFactorPreparationResponse prepare(DataFetchingEnvironment environment) {
        HttpServletRequest httpServletRequest = ContextUtil.getHttpServletRequest(environment.getGraphQlContext());
        HttpServletResponse httpServletResponse = ContextUtil.getHttpServletResponse(environment.getGraphQlContext());
        MfaSession session = mfaService.prepareFactor(FACTOR_TYPE, httpServletRequest, httpServletResponse);

        EmailCodeFactorProvider.PreparationResult preparationResult = (EmailCodeFactorProvider.PreparationResult) session.getOrCreateFactorState(FACTOR_TYPE).getPreparationResult();
        return new GqlMfaEmailCodeFactorPreparationResponse(session, preparationResult);
    }

    @GraphQLField
    @GraphQLName("verify")
    @GraphQLDescription("Verify the email code factor by submitting the received code")
    public GqlMfaGenericResponse verify(@GraphQLName("code") String code, DataFetchingEnvironment environment) {
        HttpServletRequest httpServletRequest = ContextUtil.getHttpServletRequest(environment.getGraphQlContext());
        HttpServletResponse httpServletResponse = ContextUtil.getHttpServletResponse(environment.getGraphQlContext());
        MfaSession session = mfaService.verifyFactor(FACTOR_TYPE, code, httpServletRequest, httpServletResponse);
        return new GqlMfaGenericResponse(session);
    }

}
