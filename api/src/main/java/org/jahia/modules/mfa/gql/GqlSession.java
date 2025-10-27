package org.jahia.modules.mfa.gql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import org.jahia.modules.mfa.MfaSession;

import java.util.ArrayList;
import java.util.List;

@GraphQLName("MfaSession")
@GraphQLDescription("Details about the current MFA session")
public class GqlSession {

    @GraphQLField
    @GraphQLDescription("state of the session")
    private final GqlSessionState state;

    @GraphQLField
    @GraphQLDescription("List of required MFA factors")
    private final List<String> requiredFactors;

    @GraphQLField
    @GraphQLDescription("List of completed MFA factors")
    private final List<String> completedFactors;

    protected GqlSession(MfaSession session) {
        state = session != null ? GqlSessionState.from(session.getState()) : null;
        requiredFactors = session != null ? new ArrayList<>(session.getPreparedFactors()) : null;
        completedFactors = session != null ? new ArrayList<>(session.getCompletedFactors()) : null;
    }

    public GqlSessionState getState() {
        return state;
    }

    public List<String> getRequiredFactors() {
        return requiredFactors;
    }

    public List<String> getCompletedFactors() {
        return completedFactors;
    }
}
