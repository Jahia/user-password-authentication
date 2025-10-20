package org.jahia.modules.mfa;

import java.io.Serializable;

/**
 * Represents the state of a single MFA factor within a session.
 * Tracks preparation status, completion status, errors, and associated data.
 */
public class MfaFactorState implements Serializable {
    private boolean prepared = false;
    private boolean completed = false;
    private String verificationError;

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

    public String getVerificationError() {
        return verificationError;
    }

    public void setVerificationError(String verificationError) {
        this.verificationError = verificationError;
    }
}
