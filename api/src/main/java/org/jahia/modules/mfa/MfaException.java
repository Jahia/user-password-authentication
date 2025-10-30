package org.jahia.modules.mfa;

import java.util.Collections;
import java.util.Map;

public class MfaException extends Exception {
    private final String code;
    private final Map<String, String> arguments;

    public MfaException(String code) {
        super();
        this.code = code;
        this.arguments = Collections.emptyMap();
    }

    public MfaException(String code, Map<String, String> arguments) {
        super();
        this.code = code;
        this.arguments = arguments;
    }

    public MfaException(String code, String argumentKey, String argumentValue) {
        this(code, Map.of(argumentKey, argumentValue));
    }

    public MfaException(String code, String argument1Key, String argument1Value, String argument2Key, String argument2Value) {
        this(code, Map.of(argument1Key, argument1Value, argument2Key, argument2Value));
    }

    public MfaException(String code, String argument1Key, String argument1Value, String argument2Key, String argument2Value, String argument3Key, String argument3Value) {
        this(code, Map.of(argument1Key, argument1Value, argument2Key, argument2Value, argument3Key, argument3Value));
    }

    public String getCode() {
        return code;
    }

    public Map<String, String> getArguments() {
        return arguments;
    }
}
