package org.jahia.test.gql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import graphql.annotations.annotationTypes.GraphQLTypeExtension;
import graphql.schema.DataFetchingEnvironment;
import org.jahia.modules.graphql.provider.dxm.osgi.annotations.GraphQLOsgiService;
import org.jahia.modules.graphql.provider.dxm.util.ContextUtil;
import org.jahia.modules.mfa.MfaService;
import org.jahia.modules.mfa.MfaSession;
import org.jahia.modules.mfa.gql.GqlFactorsMutation;
import org.jahia.modules.mfa.gql.GqlMfaGenericResponse;
import org.jahia.test.CustomFactorProvider;
import org.jahia.test.VerificationData;

import javax.inject.Inject;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import static org.jahia.test.CustomFactorProvider.FACTOR_TYPE;

@GraphQLName("MfaCustomFactorMutation")
@GraphQLTypeExtension(GqlFactorsMutation.class)
public class GqlCustomFactorMutation {

    private MfaService mfaService;

    @Inject
    @GraphQLOsgiService
    public void setMfaService(MfaService mfaService) {
        this.mfaService = mfaService;
    }


    @GraphQLField
    @GraphQLName("prepare")
    @GraphQLDescription("Prepare the custom factor")
    public GqlCustomFactorPreparationResponse prepare(DataFetchingEnvironment environment) {
        HttpServletRequest httpServletRequest = ContextUtil.getHttpServletRequest(environment.getGraphQlContext());
        HttpServletResponse httpServletResponse = ContextUtil.getHttpServletResponse(environment.getGraphQlContext());
        MfaSession session = mfaService.prepareFactor(FACTOR_TYPE, httpServletRequest, httpServletResponse);
        CustomFactorProvider.PreparationResult preparationResult = (CustomFactorProvider.PreparationResult) session.getOrCreateFactorState(FACTOR_TYPE).getPreparationResult();
        return new GqlCustomFactorPreparationResponse(session, preparationResult);

    }

    @GraphQLField
    @GraphQLName("verify")
    @GraphQLDescription("Verify the custom factor")
    public GqlMfaGenericResponse verify(@GraphQLName("number") Integer number, DataFetchingEnvironment environment) {
        HttpServletRequest httpServletRequest = ContextUtil.getHttpServletRequest(environment.getGraphQlContext());
        HttpServletResponse httpServletResponse = ContextUtil.getHttpServletResponse(environment.getGraphQlContext());
        VerificationData verificationData = new VerificationData(number);
        MfaSession session = mfaService.verifyFactor(FACTOR_TYPE, verificationData, httpServletRequest, httpServletResponse);
        return new GqlMfaGenericResponse(session);

    }

}
