package org.jahia.modules.mfa.gql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import org.jahia.modules.mfa.MfaException;
import org.jahia.modules.mfa.MfaSession;

/**
 * GraphQL response type for MFA operations.
 */
@GraphQLName("MfaGenericResponse")
@GraphQLDescription("Generic response for MFA operations")
public class GqlMfaGenericResponse {
    @GraphQLField
    @GraphQLDescription("Error details when the operation fails")
    private final GqlError error;

    @GraphQLField
    @GraphQLDescription("Details about the MFA session when the operation succeeds")
    private final GqlSession session;


    public GqlSession getSession() {
        return session;
    }

    public GqlError getError() {
        return error;
    }

    public GqlMfaGenericResponse(MfaSession session) {
        this.error = null;
        this.session = new GqlSession(session);
    }

    public GqlMfaGenericResponse(MfaException mfaException) {
        this.error = new GqlError(mfaException);
        this.session = null;
    }

    public GqlMfaGenericResponse(Exception unexpectedException) {
        this.error = new GqlError(unexpectedException);
        this.session = null;
    }
}
