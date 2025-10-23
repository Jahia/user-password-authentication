package org.jahia.modules.mfa.impl.gql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLName;
import org.jahia.modules.mfa.MfaException;
import org.jahia.modules.mfa.MfaSession;

/**
 * GraphQL response type for MFA operations.
 */
@GraphQLName("MfaGenericResponse")
@GraphQLDescription("Generic response for MFA operations")
public class GqlMfaGenericResponse extends GqlMfaBaseResponse {

    protected GqlMfaGenericResponse() {
    }

    protected GqlMfaGenericResponse(MfaSession session) {
        super(session);
    }

    static GqlMfaGenericResponse buildSuccessResponse(MfaSession session) {
        GqlMfaGenericResponse response = new GqlMfaGenericResponse(session);
        response.setSuccess(true);
        return response;
    }

    static GqlMfaGenericResponse buildErrorResponse(MfaException mfaException) {
        return GqlMfaUtils.buildErrorResponse(mfaException, GqlMfaGenericResponse::new);
    }

    static GqlMfaGenericResponse buildErrorResponse(Exception unexpectedException) {
        return GqlMfaUtils.buildErrorResponse(unexpectedException, GqlMfaGenericResponse::new);
    }
}
