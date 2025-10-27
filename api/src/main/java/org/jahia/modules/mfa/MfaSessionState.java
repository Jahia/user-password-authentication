package org.jahia.modules.mfa;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.Serializable;

/**
 * Enumeration of MFA session states.
 */
public enum MfaSessionState {
    /**
     * Represents the state where the Multi-Factor Authentication (MFA) session has been successfully initiated with {@link MfaService#initiateMfa(String, String, String, HttpServletRequest)}, but no factors have been prepared or verified yet.
     */
    INITIATED("initiated"),

    /**
     * Represents the state where at least one Multi-Factor Authentication (MFA) factor
     * has been prepared using {@link MfaService#prepareFactor(String, HttpServletRequest, HttpServletResponse)}
     * but not all required factors have been fully prepared yet.
     */
    PREPARING("preparing"),

    /**
     * Represents the state where all required Multi-Factor Authentication (MFA) factors
     * have been successfully prepared using {@link MfaService#prepareFactor(String, HttpServletRequest, HttpServletResponse)}.
     * At this stage, the session is ready for the verification process to begin.
     */
    PREPARED("prepared"),

    /**
     * Represents the state where the Multi-Factor Authentication (MFA) session has been successfully completed using {@link MfaService#verifyFactor(String, HttpServletRequest, Serializable)}.
     */
    COMPLETED("completed"),
    /**
     * Represents the state where the Multi-Factor Authentication (MFA) session has failed
     * during the process of initiation, preparation, or verification using {@link MfaService}.
     * This state indicates that the session cannot proceed due to an error or invalid operation.
     */
    FAILED("failed");

    private final String value;

    MfaSessionState(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
