package org.jahia.modules.mfa;

import java.io.Serializable;

/**
 * Represents the state of a single MFA factor within a session.
 * Tracks preparation and completion statuses.
 */
public class MfaFactorState implements Serializable {
    private boolean prepared = false;
    private boolean verified = false;
    private MfaError preparationError;
    private MfaError verificationError;
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

    public boolean isCompleted() {
        return prepared && verified;
    }

    public MfaError getPreparationError() {
        return preparationError;
    }

    public void setPreparationError(MfaError preparationError) {
        this.preparationError = preparationError;
    }

    public MfaError getVerificationError() {
        return verificationError;
    }

    public void setVerificationError(MfaError verificationError) {
        this.verificationError = verificationError;
    }

    public Serializable getPreparationResult() {
        return preparationResult;
    }

    public void setPreparationResult(Serializable preparationResult) {
        this.preparationResult = preparationResult;
    }
}
