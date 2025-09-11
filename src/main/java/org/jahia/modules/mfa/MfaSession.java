package org.jahia.modules.mfa;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * Comprehensive MFA session that serves as the single source of truth for all MFA state.
 * Includes factor preparation status, verification results, and error tracking.
 */
public class MfaSession implements Serializable {
    private final String userId;
    private final String sessionId; // TODO what's the intention of storing the session id here? as the MfaSession is istelf stored in session...
    private MfaSessionState state;
    private final Map<String, MfaFactorState> factorStates;
    private final LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public MfaSession(String userId, String sessionId) {
        this.userId = userId;
        this.sessionId = sessionId;
        this.state = MfaSessionState.NOT_STARTED;
        this.factorStates = new HashMap<>();
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // ===== BASIC GETTERS =====

    public String getUserId() {
        return userId;
    }

    public String getSessionId() {
        return sessionId;
    }

    public MfaSessionState getState() {
        return state;
    }

    public void setState(MfaSessionState state) {
        this.state = state;
        this.updatedAt = LocalDateTime.now();
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    // ===== FACTOR STATE MANAGEMENT =====

    /**
     * Marks a factor as successfully prepared.
     */
    public void markFactorPrepared(String factorType) {
        MfaFactorState factorState = getOrCreateFactorState(factorType);
        factorState.setPrepared(true);
        factorState.setPreparationError(null);
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Marks a factor preparation as failed.
     */
    public void markFactorPreparationFailed(String factorType, String error) {
        MfaFactorState factorState = getOrCreateFactorState(factorType);
        factorState.setPrepared(false);
        factorState.setPreparationError(error);
        setState(MfaSessionState.FAILED);
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Marks a factor as successfully verified.
     */
    public void markFactorCompleted(String factorType) {
        MfaFactorState factorState = getOrCreateFactorState(factorType);
        factorState.setCompleted(true);
        factorState.setVerificationError(null);
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Marks a factor verification as failed.
     */
    public void markFactorVerificationFailed(String factorType, String error) {
        MfaFactorState factorState = getOrCreateFactorState(factorType);
        factorState.setCompleted(false);
        factorState.setVerificationError(error);
        this.updatedAt = LocalDateTime.now();
    }

    // ===== QUERY METHODS =====

    public boolean isFactorPrepared(String factorType) {
        MfaFactorState factorState = factorStates.get(factorType);
        return factorState != null && factorState.isPrepared();
    }

    public boolean isFactorCompleted(String factorType) {
        MfaFactorState factorState = factorStates.get(factorType);
        return factorState != null && factorState.isCompleted();
    }

    public Set<String> getCompletedFactors() {
        return factorStates.entrySet().stream()
                .filter(entry -> entry.getValue().isCompleted())
                .map(Map.Entry::getKey)
                .collect(java.util.stream.Collectors.toSet());
    }

    public Set<String> getPreparedFactors() {
        return factorStates.entrySet().stream()
                .filter(entry -> entry.getValue().isPrepared())
                .map(Map.Entry::getKey)
                .collect(java.util.stream.Collectors.toSet());
    }

    /**
     * Gets the preparation error for a specific factor, if any.
     */
    public String getFactorPreparationError(String factorType) {
        MfaFactorState factorState = factorStates.get(factorType);
        return factorState != null ? factorState.getPreparationError() : null;
    }

    /**
     * Gets the verification error for a specific factor, if any.
     */
    public String getFactorVerificationError(String factorType) {
        MfaFactorState factorState = factorStates.get(factorType);
        return factorState != null ? factorState.getVerificationError() : null;
    }

    // ===== PRIVATE HELPERS =====

    private MfaFactorState getOrCreateFactorState(String factorType) {
        return factorStates.computeIfAbsent(factorType, k -> new MfaFactorState());
    }
}
