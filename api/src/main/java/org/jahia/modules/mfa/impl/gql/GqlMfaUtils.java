package org.jahia.modules.mfa.impl.gql;

import org.jahia.modules.mfa.MfaException;
import org.jahia.modules.mfa.MfaSessionState;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;
import java.util.stream.Collectors;

/**
 * Utility class for MFA GraphQL operations.
 * Provides helper methods for error handling and response building.
 */
public class GqlMfaUtils {
    private static final Logger logger = LoggerFactory.getLogger(GqlMfaUtils.class);

    private GqlMfaUtils() {
        // helper class
    }

    /**
     * Creates a GraphQL MFA error from an MFA exception.
     * <p>
     * Converts the exception's code and arguments into a structured GraphQL error object
     * that can be returned to the client.
     *
     * @param mfaException the MFA exception to convert
     * @return a GraphQL MFA error with code and arguments
     * @see GqlMfaError
     * @see MfaException#getCode()
     * @see MfaException#getArguments()
     */
    public static GqlMfaError createError(MfaException mfaException) {
        GqlMfaError error = new GqlMfaError();
        error.setCode(mfaException.getCode());
        // Convert Map<String, String> to List<GqlMfaError.Argument>
        Map<String, String> argumentsMap = mfaException.getArguments();
        List<GqlMfaError.Argument> argumentsList = argumentsMap != null
                ? argumentsMap.entrySet().stream()
                .map(entry -> createArgument(entry.getKey(), entry.getValue()))
                .collect(Collectors.toList())
                : Collections.emptyList();
        error.setArguments(argumentsList);
        return error;
    }

    private static GqlMfaError.Argument createArgument(String name, String value) {
        GqlMfaError.Argument arg = new GqlMfaError.Argument();
        arg.setName(name);
        arg.setValue(value);
        return arg;
    }

    /**
     * Builds an error response from an MFA exception.
     * <p>
     * Creates a response object with success set to {@code false}, the error populated from the exception,
     * and the session state set to {@link MfaSessionState#FAILED}.
     *
     * @param <T>          the response type extending {@link GqlMfaBaseResponse}
     * @param mfaException the MFA exception containing error details
     * @param supplier     the supplier to create the response instance
     * @return a populated error response
     * @see #createError(MfaException)
     */
    public static <T extends GqlMfaBaseResponse> T buildErrorResponse(MfaException mfaException, Supplier<T> supplier) {
        T response = supplier.get();
        response.setSuccess(false);
        response.setError(GqlMfaUtils.createError(mfaException));
        response.setSessionState(MfaSessionState.FAILED.getValue());
        return response;
    }

    /**
     * Builds an error response from an unexpected exception.
     * <p>
     * Logs the unexpected exception for troubleshooting and creates a generic error response
     * with an "unexpected_error" code. The session state is set to {@link MfaSessionState#FAILED}.
     *
     * @param <T>                 the response type extending {@link GqlMfaBaseResponse}
     * @param unexpectedException the unexpected exception that occurred
     * @param supplier            the supplier to create the response instance
     * @return a populated error response with generic error code
     * @see #createError(MfaException)
     */
    public static <T extends GqlMfaBaseResponse> T buildErrorResponse(Exception unexpectedException, Supplier<T> supplier) {
        logger.warn("An unexpected exception occurred: {}", unexpectedException.getMessage());
        logger.debug("Details:", unexpectedException);
        T response = supplier.get();
        response.setSuccess(false);
        response.setError(GqlMfaUtils.createError(new MfaException("unexpected_error")));
        response.setSessionState(MfaSessionState.FAILED.getValue());
        return response;
    }

}
