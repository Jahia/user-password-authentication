package org.jahia.modules.mfa;

import java.util.Collections;
import java.util.Map;

/**
 * Checked exception used by factor providers and MFA service logic to signal errors during
 * preparation or verification steps. It is transformed into an {@link MfaError} for transport
 * to clients. Use stable string constants for the <code>code</code> parameter (e.g. verify_factor_not_prepared).
 * <p>
 * Constructors offer convenience overloads for up to three key/value argument pairs;
 * for more arguments use the map-based constructor.
 */
public class MfaException extends Exception {
    private final String code;
    private final Map<String, String> arguments;

    /**
     * Creates an exception with a code and no arguments.
     * @param code stable error code
     */
    public MfaException(String code) {
        super();
        this.code = code;
        this.arguments = Collections.emptyMap();
    }

    /**
     * Creates an exception with a code and argument map.
     * @param code stable error code
     * @param arguments contextual key/value pairs (never null; if null an empty map should be provided externally)
     */
    public MfaException(String code, Map<String, String> arguments) {
        super();
        this.code = code;
        this.arguments = arguments;
    }

    /**
     * Convenience constructor for one argument.
     */
    public MfaException(String code, String argumentKey, String argumentValue) {
        this(code, Map.of(argumentKey, argumentValue));
    }

    /**
     * Convenience constructor for two arguments.
     */
    public MfaException(String code, String argument1Key, String argument1Value, String argument2Key, String argument2Value) {
        this(code, Map.of(argument1Key, argument1Value, argument2Key, argument2Value));
    }

    /**
     * Convenience constructor for three arguments.
     */
    public MfaException(String code, String argument1Key, String argument1Value, String argument2Key, String argument2Value, String argument3Key, String argument3Value) {
        this(code, Map.of(argument1Key, argument1Value, argument2Key, argument2Value, argument3Key, argument3Value));
    }

    /**
     * Returns the stable error code.
     */
    public String getCode() {
        return code;
    }

    /**
     * Returns immutable argument map (may be empty, never null).
     */
    public Map<String, String> getArguments() {
        return arguments;
    }
}
