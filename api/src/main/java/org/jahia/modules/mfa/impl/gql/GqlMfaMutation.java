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
        try {
            HttpServletRequest httpServletRequest = ContextUtil.getHttpServletRequest(environment.getGraphQlContext());
            MfaSession session = mfaService.initiateMfa(username, password, siteKey, httpServletRequest);
            return new GqlMfaGenericResponse(session);
        } catch (MfaException mfaException) {
            return new GqlMfaGenericResponse(mfaException);
        } catch (Exception unknownException) {
            return new GqlMfaGenericResponse(unknownException);
        }
    }


    @GraphQLField
    @GraphQLName("clear")
    @GraphQLDescription("Clear current MFA session")
    public GqlMfaGenericResponse clear(DataFetchingEnvironment environment) {
        GqlMfaGenericResponse response;
        try {
            HttpServletRequest httpServletRequest = ContextUtil.getHttpServletRequest(environment.getGraphQlContext());
            mfaService.clearMfaSession(httpServletRequest);
            return new GqlMfaGenericResponse((MfaSession) null); // there is no session anymore

        } catch (Exception exception) {
            return new GqlMfaGenericResponse(exception);
        }
    }

    @GraphQLField
    @GraphQLName("factors")
    @GraphQLDescription("Access MFA factors specific mutations")
    public static GqlFactorsMutation getMfaFactors() {
        return new GqlFactorsMutation();
    }

}
