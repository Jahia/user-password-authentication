package org.jahia.modules.mfa.impl.gql;

import org.jahia.modules.mfa.MfaSession;

import java.util.List;
import java.util.stream.Collectors;

public class GqlMfaUtils {

    // Helper methods to reduce duplication
    public static GqlMfaResponse createSuccessResponse(MfaSession session) {
        GqlMfaResponse response = new GqlMfaResponse();
        response.setSuccess(true);
        response.setSessionState(session.getState());
        return response;
    }

    public static GqlMfaResponse createSessionStatusResponse(MfaSession session) {
        GqlMfaResponse response = new GqlMfaResponse();
        response.setSuccess(true);
        response.setSessionState(session.getState());

        List<String> preparedFactors = session.getPreparedFactors().stream()
                .collect(Collectors.toList());
        response.setRequiredFactors(preparedFactors);

        List<String> completedFactors = session.getCompletedFactors().stream()
                .collect(Collectors.toList());
        response.setCompletedFactors(completedFactors);

        return response;
    }

    public static GqlMfaResponse createErrorResponse(String error) {
        GqlMfaResponse response = new GqlMfaResponse();
        response.setSuccess(false);
        response.setError(error);
        return response;
    }
}
