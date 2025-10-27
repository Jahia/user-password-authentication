package org.jahia.modules.mfa;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Comprehensive MFA session that serves as the single source of truth for all MFA state.
 * Includes factor preparation status, verification results, and error tracking.
 */
public class MfaSession implements Serializable {
    private final String userId;
    private final Locale userPreferredLanguage;
    private final String siteKey;
    private MfaSessionState state;
    private final List<String> requiredFactors;
    private final Map<String, MfaFactorState> factorStates;
    private final LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    /**
     * Preparation result per factor
     */
    private final Map<String, Serializable> factorPreparationResults;

    public MfaSession(String userId, Locale userPreferredLanguage, String siteKey, List<String> requiredFactors) {
        this.userId = userId;
        this.userPreferredLanguage = userPreferredLanguage;
        this.siteKey = siteKey;
        this.state = MfaSessionState.INITIATED;
        this.requiredFactors = requiredFactors;
        this.factorStates = new HashMap<>();
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.factorPreparationResults = new HashMap<>();
    }

    // ===== BASIC GETTERS =====

    public String getUserId() {
        return userId;
    }

    public String getSiteKey() {
        return siteKey;
    }

    public MfaSessionState getState() {
        return state;
    }

    public void setState(MfaSessionState state) {
        this.state = state;
        this.updatedAt = LocalDateTime.now();
    }

    public List<String> getRequiredFactors() {
        return requiredFactors;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public Locale getUserPreferredLanguage() {
        return userPreferredLanguage;
    }

    public Serializable getPreparationResult(String factorType) {
        return factorPreparationResults.get(factorType);
    }

    public void setPreparationResult(String factorType, Serializable preparationResult) {
        factorPreparationResults.put(factorType, preparationResult);
    }

    // ===== FACTOR STATE MANAGEMENT =====

    /**
     * Marks a factor as successfully prepared.
     */
    public void markFactorPrepared(String factorType) {
        MfaFactorState factorState = getOrCreateFactorState(factorType);
        factorState.setPrepared(true);

        // Check if all required factors are now prepared
        boolean allPrepared = requiredFactors.stream()
                .allMatch(this::isFactorPrepared);
        if (allPrepared) {
            setState(MfaSessionState.PREPARED);
        } else {
            setState(MfaSessionState.PREPARING);
        }
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Marks a factor preparation as failed.
     */
    public void markFactorPreparationFailed(String factorType) {
        MfaFactorState factorState = getOrCreateFactorState(factorType);
        factorState.setPrepared(false);
        setState(MfaSessionState.FAILED);
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Marks a factor as successfully verified.
     */
    public void markFactorCompleted(String factorType) {
        MfaFactorState factorState = getOrCreateFactorState(factorType);
        factorState.setCompleted(true);
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Marks a factor verification as failed.
     */
    public void markFactorVerificationFailed(String factorType) {
        MfaFactorState factorState = getOrCreateFactorState(factorType);
        factorState.setCompleted(false);
        this.updatedAt = LocalDateTime.now();
    }

    // ===== QUERY METHODS =====

    public boolean isFactorPrepared(String factorType) {
        MfaFactorState factorState = factorStates.get(factorType);
        return factorState != null && factorState.isPrepared();
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

    // ===== PRIVATE HELPERS =====

    private MfaFactorState getOrCreateFactorState(String factorType) {
        return factorStates.computeIfAbsent(factorType, k -> new MfaFactorState());
    }
}
