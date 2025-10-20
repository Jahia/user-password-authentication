package org.jahia.modules.mfa.impl.gql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import org.jahia.modules.mfa.MfaSession;
import org.jahia.modules.mfa.MfaSessionState;

import java.util.ArrayList;
import java.util.List;

public abstract class GqlMfaBaseResponse {
    @GraphQLField
    @GraphQLDescription("Operation success status")
    private boolean success;

    @GraphQLField
    @GraphQLDescription("Current MFA session state")
    private String sessionState;

    @GraphQLField
    @GraphQLDescription("List of required MFA factors")
    private List<String> requiredFactors;

    @GraphQLField
    @GraphQLDescription("List of completed MFA factors")
    private List<String> completedFactors;

    @GraphQLField
    @GraphQLDescription("Error details when the operation failed")
    private GqlMfaError error;

    protected GqlMfaBaseResponse() {

    }

    protected GqlMfaBaseResponse(MfaSession session) {
        success = MfaSessionState.IN_PROGRESS.equals(session.getState());
        sessionState = session.getState().getValue();
        requiredFactors = new ArrayList<>(session.getPreparedFactors());
        completedFactors = new ArrayList<>(session.getCompletedFactors());
    }

    public final boolean isSuccess() {
        return success;
    }

    protected final void setSuccess(boolean success) {
        this.success = success;
    }

    public String getSessionState() {
        return sessionState;
    }

    protected void setSessionState(String sessionState) {
        this.sessionState = sessionState;
    }

    public List<String> getRequiredFactors() {
        return requiredFactors;
    }

    protected void setRequiredFactors(List<String> requiredFactors) {
        this.requiredFactors = requiredFactors;
    }

    public List<String> getCompletedFactors() {
        return completedFactors;
    }

    protected void setCompletedFactors(List<String> completedFactors) {
        this.completedFactors = completedFactors;
    }

    public GqlMfaError getError() {
        return error;
    }

    public void setError(GqlMfaError error) {
        this.error = error;
    }
}
