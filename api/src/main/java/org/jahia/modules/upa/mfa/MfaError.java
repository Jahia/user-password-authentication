package org.jahia.modules.upa.mfa;

import java.io.Serializable;
import java.util.Collections;
import java.util.Map;

/**
 * Represents an error that occurred during Multi-Factor Authentication operations.
 * <p>
 * Errors can occur at two levels:
 * <ul>
 *   <li><b>Session-level errors</b> - Fatal errors that invalidate the entire MFA session
 *   (e.g., authentication_failed, no_active_session)</li>
 *   <li><b>Factor-level errors</b> - Recoverable errors specific to a single factor
 *   (e.g., invalid verification code, rate limit exceeded)</li>
 * </ul>
 * <p>
 * Each error consists of an error code (for client-side i18n and logic branching)
 * and optional arguments that provide contextual details.
 */
public class MfaError implements Serializable {
    private final String code;
    private final Map<String, String> arguments;

    /**
     * Creates an error with a code and optional arguments.
     *
     * @param code      error code
     * @param arguments contextual key/value pairs (never null, may be empty)
     */
    public MfaError(String code, Map<String, String> arguments) {
        this.code = code;
        this.arguments = arguments;
    }

    /**
     * Creates an error with just a code (no arguments).
     *
     * @param code error code
     */
    public MfaError(String code) {
        this(code, Collections.emptyMap());
    }

    /**
     * Returns the error code for this error.
     * <p>
     * The error code should be used by clients for i18n lookups.
     *
     * @return the error code
     */
    public String getCode() {
        return code;
    }

    /**
     * Returns the contextual arguments for this error.
     * <p>
     * Arguments provide additional details that can be interpolated into error messages
     * or used for debugging purposes.
     *
     * @return an immutable map of argument key-value pairs (never null, may be empty)
     */
    public Map<String, String> getArguments() {
        return arguments;
    }
}
