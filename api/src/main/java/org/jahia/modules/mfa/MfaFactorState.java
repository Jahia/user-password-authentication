package org.jahia.modules.mfa;

import java.io.Serializable;

/**
 * Represents the state of a single MFA factor within a session.
 * Tracks preparation and completion statuses.
 */
public class MfaFactorState implements Serializable {
    private boolean prepared = false;
    private boolean completed = false;

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

}
