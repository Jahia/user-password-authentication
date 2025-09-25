package org.jahia.modules.mfa.impl.gql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import org.jahia.modules.mfa.MfaSessionState;

import java.util.List;

/**
 * GraphQL response type for MFA operations.
 */
@GraphQLName("MfaResponse")
@GraphQLDescription("Response for MFA operations")
public class GqlMfaResponse {

    @GraphQLField
    @GraphQLDescription("Operation success status")
    private boolean success;

    @GraphQLField
    @GraphQLDescription("Error message if operation failed")
    private String error;

    @GraphQLField
    @GraphQLDescription("Current MFA session state")
    private String sessionState;

    @GraphQLField
    @GraphQLDescription("List of required MFA factors")
    private List<String> requiredFactors;

    @GraphQLField
    @GraphQLDescription("List of completed MFA factors")
    private List<String> completedFactors;

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public String getSessionState() {
        return sessionState;
    }

    public void setSessionState(MfaSessionState sessionState) {
        this.sessionState = sessionState.getValue();
    }

    public List<String> getRequiredFactors() {
        return requiredFactors;
    }

    public void setRequiredFactors(List<String> requiredFactors) {
        this.requiredFactors = requiredFactors;
    }

    public List<String> getCompletedFactors() {
        return completedFactors;
    }

    public void setCompletedFactors(List<String> completedFactors) {
        this.completedFactors = completedFactors;
    }
}
