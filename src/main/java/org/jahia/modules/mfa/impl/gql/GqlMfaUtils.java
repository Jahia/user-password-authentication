package org.jahia.modules.mfa.impl.gql;

import org.jahia.modules.mfa.MfaSession;

import java.util.ArrayList;
import java.util.List;

public class GqlMfaUtils {

    private GqlMfaUtils() {
        // helper class
    }

    // Helper methods to reduce duplication
    public static GqlMfaResponse createSuccessResponse(MfaSession session) {
        GqlMfaResponse response = new GqlMfaResponse();
        response.setSuccess(true);
        response.setSessionState(session.getState());
        return response;
    }

    public static GqlMfaResponse createSessionStatusResponse(MfaSession session) {
        GqlMfaResponse response = createSuccessResponse(session);

        List<String> preparedFactors = new ArrayList<>(session.getPreparedFactors());
        response.setRequiredFactors(preparedFactors);

        List<String> completedFactors = new ArrayList<>(session.getCompletedFactors());
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
