package org.jahia.modules.mfa.gql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import org.jahia.modules.mfa.MfaSession;

/**
 * GraphQL response type for MFA operations.
 * Wraps the underlying session so clients can inspect errors, suspension status, and factor states.
 */
@GraphQLName("MfaResult")
@GraphQLDescription("Base response for MFA operations exposing the current session")
public class Result {

    private final Session session;

    @GraphQLField
    @GraphQLName("session")
    @GraphQLDescription("Current MFA session if any")
    public Session getSession() {
        return session;
    }

    public Result(MfaSession session) {
        this.session = new Session(session);
    }
}
