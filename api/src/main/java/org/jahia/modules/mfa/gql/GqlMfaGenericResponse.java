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
    @GraphQLDescription("Details about the MFA session when the operation succeeds")
    private final GqlSession session;


    public GqlSession getSession() {
        return session;
    }


    public GqlMfaGenericResponse(MfaSession session) {
        this.session = new GqlSession(session);
    }

}
