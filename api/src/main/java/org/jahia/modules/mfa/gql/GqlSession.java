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

    protected GqlSession(MfaSession session) {
        this.session = session;
    }

    @GraphQLField
    @GraphQLDescription("List of required MFA factors")
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
    public long getSuspensionDurationInSeconds() {
        return session.getSuspensionDurationInSeconds();
    }

    @GraphQLField
    @GraphQLDescription("") // TODO
    public GqlError getError() {
        return session.getError() == null ? null : new GqlError(session.getError());
    }
}
