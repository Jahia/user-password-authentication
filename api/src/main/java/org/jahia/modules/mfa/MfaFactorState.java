package org.jahia.modules.mfa;

import java.io.Serializable;

/**
 * Represents the state of a single MFA factor within a session.
 * Tracks preparation and completion statuses.
 */
public class MfaFactorState implements Serializable {
    private boolean prepared = false;
    private boolean verified = false;
    private MfaError error;
    private Serializable preparationResult;

    public boolean isPrepared() {
        return prepared;
    }

    public void setPrepared(boolean prepared) {
        this.prepared = prepared;
    }

    public boolean isVerified() {
        return verified;
    }

    public void setVerified(boolean verified) {
        this.verified = verified;
    }

    public MfaError getError() {
        return error;
    }

    public void setError(MfaError error) {
        this.error = error;
    }

    public Serializable getPreparationResult() {
        return preparationResult;
    }

    public void setPreparationResult(Serializable preparationResult) {
        this.preparationResult = preparationResult;
    }
}
