package org.jahia.modules.mfa.impl.gql;

import org.jahia.modules.mfa.MfaSession;
import org.jahia.modules.mfa.MfaSessionState;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class GqlMfaUtils {

    private GqlMfaUtils() {
        // helper class
    }


    /**
     * Creates a GraphQL MFA response for an initiate operation.
     * The success status of the response is determined by whether the MFA session state
     * is equal to {@code MfaSessionState.IN_PROGRESS}.
     *
     * @param session the MFA session containing the current state, required,
     *                and completed factors
     * @return a {@code GqlMfaResponse} containing the required factors,
     * completed factors, session state, and success status
     */

    public static GqlMfaResponse createInitiateResponse(MfaSession session) {
        GqlMfaResponse response = createResponse(session);
        response.setSuccess(MfaSessionState.IN_PROGRESS.equals(session.getState()));
        return response;
    }


    /**
     * Creates a GraphQL Multi-Factor Authentication (MFA) response for a factor preparation operation.
     * The success status of the response is determined based on the current state of the MFA session
     * and any preparation errors for the specified factor.
     *
     * @param session    the MFA session containing the state and factor information
     * @param factorType the type of MFA factor being prepared
     * @return a {@code GqlMfaResponse} representing the result of the factor preparation operation,
     * including success status and error details if applicable
     */
    public static GqlMfaResponse createFactorPreparationResponse(MfaSession session, String factorType) {
        GqlMfaResponse response = createResponse(session);
        String error = session.getFactorPreparationError(factorType);
        if (MfaSessionState.FAILED.equals(session.getState()) || error != null) {
            response.setSuccess(false);
            response.setError(error);
        } else {
            // assume the operation successfully completes
            response.setSuccess(true);
        }
        return response;
    }

    /**
     * Creates a GraphQL Multi-Factor Authentication (MFA) response for a factor verification operation.
     * The success status of the response is determined based on the current state of the MFA session
     * and any verification errors for the specified factor.
     *
     * @param session    the MFA session containing the current state and factor verification information
     * @param factorType the type of MFA factor being verified
     * @return a {@code GqlMfaResponse} representing the result of the factor verification operation,
     * including success status and error details if applicable
     */
    public static GqlMfaResponse createFactorVerificationResponse(MfaSession session, String factorType) {
        GqlMfaResponse response = createResponse(session);
        String error = session.getFactorVerificationError(factorType);
        if (MfaSessionState.FAILED.equals(session.getState()) || error != null) {
            response.setSuccess(false);
            if (factorType != null) {
                response.setError(error);
            }
        } else {
            // assume the operation successfully completes
            response.setSuccess(true);
        }
        return response;
    }


    /**
     * Creates a GraphQL Multi-Factor Authentication (MFA) response representing
     * an error state, useful when an unexpected error occurs. This method sets the response as unsuccessful and includes
     * the provided error message.
     *
     * @param error the error message to include in the response
     * @return a {@code GqlMfaResponse} containing the error message, an unsuccessful
     * status, an empty list of required and completed factors, and a session state
     * of {@code MfaSessionState.FAILED}
     */
    public static GqlMfaResponse createErrorResponse(String error) {
        GqlMfaResponse response = new GqlMfaResponse();
        response.setRequiredFactors(Collections.emptyList());
        response.setCompletedFactors(Collections.emptyList());
        response.setSuccess(false);
        response.setError(error);
        response.setSessionState(MfaSessionState.FAILED);
        return response;
    }

    private static GqlMfaResponse createResponse(MfaSession session) {
        GqlMfaResponse response = new GqlMfaResponse();
        List<String> preparedFactors = new ArrayList<>(session.getPreparedFactors());
        response.setRequiredFactors(preparedFactors);
        List<String> completedFactors = new ArrayList<>(session.getCompletedFactors());
        response.setCompletedFactors(completedFactors);
        response.setSessionState(session.getState());
        return response;
    }
}
