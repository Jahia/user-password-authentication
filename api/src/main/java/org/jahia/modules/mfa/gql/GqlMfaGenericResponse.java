package org.jahia.modules.mfa.gql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import org.jahia.modules.mfa.MfaSession;

/**
 * GraphQL response type for MFA operations.
 * Wraps the underlying session so clients can inspect errors, suspension status, and factor states.
 */
@GraphQLName("MfaGenericResponse")
@GraphQLDescription("Generic response wrapper for MFA operations exposing the current session state")
public class GqlMfaGenericResponse {

    private final GqlSession session;

    @GraphQLField
    @GraphQLName("session")
    @GraphQLDescription("Current MFA session state (may contain an irrecoverable session error or factor-specific errors)")
    public GqlSession getSession() {
        return session;
    }

    public GqlMfaGenericResponse(MfaSession session) {
        this.session = new GqlSession(session);
    }
}
