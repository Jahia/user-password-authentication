package org.jahia.modules.mfa;

import java.util.HashMap;
import java.util.Map;

/**
 * Represents the state of a single MFA factor within a session.
 * Tracks preparation status, completion status, errors, and associated data.
 */
public class MfaFactorState {
    private boolean prepared = false;
    private boolean completed = false;
    private String preparationError;
    private String verificationError;
    private final Map<String, Object> data = new HashMap<>();

    public boolean isPrepared() {
        return prepared;
    }

    public void setPrepared(boolean prepared) {
        this.prepared = prepared;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public String getPreparationError() {
        return preparationError;
    }

    public void setPreparationError(String preparationError) {
        this.preparationError = preparationError;
    }

    public String getVerificationError() {
        return verificationError;
    }

    public void setVerificationError(String verificationError) {
        this.verificationError = verificationError;
    }

    public Map<String, Object> getData() {
        return data;
    }
}
