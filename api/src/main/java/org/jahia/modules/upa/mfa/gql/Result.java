package org.jahia.modules.upa.mfa.gql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import org.jahia.modules.upa.mfa.MfaSession;

/**
 * Generic GraphQL result wrapper for MFA operations.
 * <p>
 * Provides access to the current MFA session so clients can inspect factor states,
 * verification progress, suspension status and any session or factor-level errors.
 * <p>
 * Returned by mutation and query entry points that need to expose the MFA session state.
 */
@GraphQLName("MfaResult")
@GraphQLDescription("Result wrapper exposing the current MFA session state")
public class Result {

    private final Session session;

    @GraphQLField
    @GraphQLName("session")
    @GraphQLDescription("Current MFA session (may contain errors or suspension info)")
    public Session getSession() {
        return session;
    }

    public Result(MfaSession session) {
        this.session = new Session(session);
    }
}
