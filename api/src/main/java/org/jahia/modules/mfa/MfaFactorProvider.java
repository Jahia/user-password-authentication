package org.jahia.modules.mfa;

import java.io.Serializable;

/**
 * Interface for MFA factor providers.
 * Each factor type should implement this interface to provide factor-specific logic.
 * The provider works directly with MfaSession to update factor state.
 */
public interface MfaFactorProvider {

    /**
     * Gets the factor type this provider handles as a string identifier.
     *
     * @return the factor type identifier
     */
    String getFactorType();

    /**
     * Prepares the factor for verification (e.g., generates and sends code).
     * Updates the session state directly through the provided preparation context.
     * <p>
     * If an error occurs during preparation, the implementation should throw an {@link MfaException}
     * which will be caught by the service and recorded in the session's error state.
     *
     * @param preparationContext the context containing all necessary data for preparation
     * @return a serializable result of the preparation step
     * @throws MfaException if an error occurs when preparing the factor
     */
    Serializable prepare(PreparationContext preparationContext) throws MfaException;

    /**
     * Verifies the factor with the provided data.
     * Updates the session state directly through the provided verification context.
     * <p>
     * If an error occurs during verification, the implementation should throw an {@link MfaException}
     * which will be caught by the service and recorded in the session's error state.
     *
     * @param verificationContext the context containing all necessary data for verification
     * @return true if verification is successful, false otherwise
     * @throws MfaException if an error occurs during verification
     */
    boolean verify(VerificationContext verificationContext) throws MfaException;
}
