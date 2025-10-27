package org.jahia.modules.mfa.gql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLName;
import org.jahia.modules.mfa.MfaSessionState;

@GraphQLName("MfaSessionState")
public enum GqlSessionState {
    @GraphQLDescription("The session has been successfully initiated, but no factors have been prepared or verified yet.")
    INITIATED,

    @GraphQLDescription("At least one factor has been prepared, but not all required factors have been fully prepared yet.")
    PREPARING,

    @GraphQLDescription("All required factors have been prepared.")
    PREPARED,

    @GraphQLDescription("The session has been successfully completed.")
    COMPLETED,

    @GraphQLDescription("The session has failed.")
    FAILED;

    static GqlSessionState from(MfaSessionState sessionState) {
        return sessionState == null ? null : GqlSessionState.valueOf(sessionState.name());
    }
}
