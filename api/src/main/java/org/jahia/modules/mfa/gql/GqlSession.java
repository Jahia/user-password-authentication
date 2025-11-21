package org.jahia.modules.mfa.gql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import org.jahia.modules.mfa.MfaSession;

import java.util.List;

@GraphQLName("MfaSession")
@GraphQLDescription("Details about the current MFA session")
public class GqlSession {

    private final MfaSession session;

    public GqlSession(MfaSession session) {
        this.session = session;
    }

    @GraphQLField
    @GraphQLDescription("Whether the MFA session has been initiated")
    public boolean isInitiated() {
        return session.isInitiated();
    }

    @GraphQLField
    @GraphQLDescription("Details about the current MFA factor")
    public GqlFactorState factorState(@GraphQLName("factorType") String factorType) {
        return new GqlFactorState(session.getOrCreateFactorState(factorType));
    }

    @GraphQLField
    @GraphQLDescription("List of required MFA factors")
    public List<String> getRequiredFactors() {
        return session.getContext().getRequiredFactors();
    }

    @GraphQLField
    @GraphQLDescription("List of completed MFA factors")
    public List<String> getCompletedFactors() {
        return session.getVerifiedFactors();
    }

    @GraphQLField
    @GraphQLDescription("Suspension duration in seconds if the user is temporarily suspended due to too many failed attempts. Returns null if not suspended.")
    public Long getSuspensionDurationInSeconds() {
        return session.getSuspensionDurationInSeconds();
    }

    @GraphQLField
    @GraphQLDescription("Session-level error indicating an irrecoverable failure. If not null, the session has permanently failed and must be discarded. A new session must be created to retry authentication. Check this before checking factor-level errors.")
    public GqlError getError() {
        return session.getError() == null ? null : new GqlError(session.getError());
    }
}
