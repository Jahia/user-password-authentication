package org.jahia.modules.mfa;

import java.io.Serializable;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static java.util.stream.Collectors.*;

/**
 * Comprehensive MFA session that serves as the single source of truth for all MFA state.
 * Includes factor preparation status, verification results, and error tracking.
 */
public class MfaSession implements Serializable {
    private final MfaSessionContext context;
    private boolean initiated;
    private final Map<String, MfaFactorState> factorStates;
    private long suspensionDurationInSeconds;
    private MfaError error;

    public MfaSession(MfaSessionContext context) {
        this.context = context;
        this.factorStates = new HashMap<>();
        this.suspensionDurationInSeconds = 0; // means not suspended
        this.error = null;
    }

    public MfaSessionContext getContext() {
        return context;
    }

    public boolean isInitiated() {
        return initiated;
    }

    public void setInitiated(boolean initiated) {
        this.initiated = initiated;
    }

    public MfaFactorState getOrCreateFactorState(String factorType) {
        return factorStates.computeIfAbsent(factorType, k -> new MfaFactorState());
    }

    public long getSuspensionDurationInSeconds() {
        return suspensionDurationInSeconds;
    }

    public void setSuspensionDurationInSeconds(long suspensionDurationInSeconds) {
        this.suspensionDurationInSeconds = suspensionDurationInSeconds;
    }

    public MfaError getError() {
        return error;
    }

    public void setError(MfaError error) {
        this.error = error;
    }

    public List<String> getCompletedFactors() {
        return factorStates.entrySet().stream()
                .filter(entry -> entry.getValue().isCompleted())
                .map(Map.Entry::getKey)
                .collect(toList());
    }

}
