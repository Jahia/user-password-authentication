package org.jahia.modules.mfa;

import java.io.Serializable;
import java.util.Collections;
import java.util.Map;

/**
 * Represents an error that occurred during Multi-Factor Authentication (MFA) operations.
 * <p>
 * Errors can originate at either the <b>session level</b> (fatal / irrecoverable) or the
 * <b>factor level</b> (recoverable, scoped to a single factor).
 * <ul>
 *   <li><b>Session-level errors</b> (stored in {@link MfaSession#getError()}) terminate the whole MFA flow and
 *   require starting a new session (for example: <code>no_active_session</code>, <code>authentication_failed</code>).</li>
 *   <li><b>Factor-level errors</b> (stored in {@link MfaFactorState#getError()}) only affect the specific factor and may be retried
 *   or a different factor can be attempted (for example: invalid code, rate limit exceeded).</li>
 * </ul>
 */
public class MfaError implements Serializable {
    private final String code;
    private final Map<String, String> arguments;

    /**
     * Creates an error with a code and optional arguments.
     * @param code error code
     * @param arguments contextual key/value pairs (never null, may be empty)
     */
    public MfaError(String code, Map<String, String> arguments) {
        this.code = code;
        this.arguments = arguments;
    }

    /**
     * Creates an error with just a code (no arguments).
     * @param code stable error code
     */
    public MfaError(String code) {
        this(code, Collections.emptyMap());
    }

    /**
     * Returns the stable error code to be used by clients for i18n / branching logic.
     */
    public String getCode() {
        return code;
    }

    /**
     * Returns immutable argument map providing contextual details (may be empty, never null).
     */
    public Map<String, String> getArguments() {
        return arguments;
    }
}
