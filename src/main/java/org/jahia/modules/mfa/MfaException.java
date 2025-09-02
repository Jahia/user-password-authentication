package org.jahia.modules.mfa;

public class MfaException extends Exception {
    // TODO should use error code and support i18n instead of using an error message
    public MfaException(String message) {
        super(message);
    }

    public MfaException(String message, Exception cause) {
        super(message, cause);
    }
}
