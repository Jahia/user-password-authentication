package org.jahia.modules.mfa;

/**
 * Enumeration of MFA session states.
 */
public enum MfaSessionState {
    NOT_STARTED("not_started"),
    IN_PROGRESS("in_progress"),
    COMPLETED("completed"),
    FAILED("failed");

    private final String value;

    MfaSessionState(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
