package org.jahia.modules.mfa;

import java.io.Serializable;
import java.util.Collections;
import java.util.Map;

/**
 * Represents an error that occurred during MFA operations.
 */
public class MfaError implements Serializable {
    private final String code;
    private final Map<String, String> arguments;

    public MfaError(String code, Map<String, String> arguments) {
        this.code = code;
        this.arguments = arguments;
    }

    public MfaError(String code) {
        this(code, Collections.emptyMap());
    }

    public String getCode() {
        return code;
    }

    public Map<String, String> getArguments() {
        return arguments;
    }
}

