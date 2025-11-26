package org.jahia.modules.mfa.gql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import org.jahia.modules.mfa.MfaSession;

import java.util.List;

@GraphQLName("MfaSession")
@GraphQLDescription("Details about the current MFA session: initiation status, factors, suspension and errors")
public class Session {

    private final MfaSession mfaSession;

    public Session(MfaSession mfaSession) {
        this.mfaSession = mfaSession;
    }

    @GraphQLField
    @GraphQLName("initiated")
    @GraphQLDescription("Whether the MFA flow has been initiated (the username/password credentials have been validated)")
    public boolean isInitiated() {
        return mfaSession.isInitiated();
    }

    @GraphQLField
    @GraphQLName("factorState")
    @GraphQLDescription("Retrieve state for a specific factor (preparation, verification, factor-level error)")
    public FactorState factorState(@GraphQLName("factorType") String factorType) {
        return new FactorState(mfaSession.getOrCreateFactorState(factorType));
    }

    @GraphQLField
    @GraphQLName("requiredFactors")
    @GraphQLDescription("List of factor types required to complete the MFA flow")
    public List<String> getRequiredFactors() {
        return mfaSession.getContext().getRequiredFactors();
    }

    @GraphQLField
    @GraphQLName("verifiedFactors")
    @GraphQLDescription("List of factor types successfully verified so far")
    public List<String> getVerifiedFactors() {
        return mfaSession.getVerifiedFactors();
    }

    @GraphQLField
    @GraphQLName("suspensionDurationInSeconds")
    @GraphQLDescription("Suspension duration (in seconds) if the user is temporarily locked, null if not suspended")
    public Long getSuspensionDurationInSeconds() {
        return mfaSession.getSuspensionDurationInSeconds();
    }

    @GraphQLField
    @GraphQLName("error")
    @GraphQLDescription("Irrecoverable session-level error. If non-null the session must be discarded and re-initiated before any factor interaction.")
    public Error getError() {
        return mfaSession.getError() == null ? null : new Error(mfaSession.getError());
    }
}
