package org.jahia.modules.mfa;

import java.util.Collections;
import java.util.Map;

/**
 * Exception thrown by MFA factor providers during preparation or verification.
 * <p>
 * This checked exception is used to signal errors in factor-specific operations.
 * The MFA service catches these exceptions and converts them into {@link MfaError}
 * objects that are attached to the session or factor state.
 * <p>
 */
public class MfaException extends Exception {
    private final String code;
    private final Map<String, String> arguments;

    /**
     * Creates an exception with a code and no arguments.
     *
     * @param code error code
     */
    public MfaException(String code) {
        super();
        this.code = code;
        this.arguments = Collections.emptyMap();
    }

    /**
     * Creates an exception with a code and argument map.
     *
     * @param code      error code
     * @param arguments contextual key/value pairs (never null)
     */
    public MfaException(String code, Map<String, String> arguments) {
        super();
        this.code = code;
        this.arguments = arguments;
    }

    /**
     * Convenience constructor for one argument.
     *
     * @param code          error code
     * @param argumentKey   the argument key
     * @param argumentValue the argument value
     */
    public MfaException(String code, String argumentKey, String argumentValue) {
        this(code, Map.of(argumentKey, argumentValue));
    }

    /**
     * Convenience constructor for two arguments.
     *
     * @param code           error code
     * @param argument1Key   first argument key
     * @param argument1Value first argument value
     * @param argument2Key   second argument key
     * @param argument2Value second argument value
     */
    public MfaException(String code, String argument1Key, String argument1Value, String argument2Key, String argument2Value) {
        this(code, Map.of(argument1Key, argument1Value, argument2Key, argument2Value));
    }

    /**
     * Convenience constructor for three arguments.
     *
     * @param code           error code
     * @param argument1Key   first argument key
     * @param argument1Value first argument value
     * @param argument2Key   second argument key
     * @param argument2Value second argument value
     * @param argument3Key   third argument key
     * @param argument3Value third argument value
     */
    public MfaException(String code, String argument1Key, String argument1Value, String argument2Key, String argument2Value, String argument3Key, String argument3Value) {
        this(code, Map.of(argument1Key, argument1Value, argument2Key, argument2Value, argument3Key, argument3Value));
    }

    /**
     * Returns the error code.
     *
     * @return the error code
     */
    public String getCode() {
        return code;
    }

    /**
     * Returns the argument map with contextual details.
     *
     * @return an immutable map of arguments (may be empty, never null)
     */
    public Map<String, String> getArguments() {
        return arguments;
    }
}
