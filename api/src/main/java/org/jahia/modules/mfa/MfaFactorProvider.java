package org.jahia.modules.mfa;

import java.io.Serializable;

/**
 * Interface for implementing custom MFA factor providers.
 * <p>
 * Each MFA factor type (e.g., email code, SMS, TOTP) should implement this interface
 * to provide factor-specific preparation and verification logic. Implementations are
 * registered as OSGi services and automatically discovered by the MFA service.
 * <p>
 * The provider works with {@link PreparationContext} and {@link VerificationContext}
 * to access session data and HTTP request/response objects.
 */
public interface MfaFactorProvider {

    /**
     * Returns the unique factor type identifier for this provider.
     * <p>
     * This identifier is used throughout the MFA system to reference this factor type
     * (e.g., "emailCode", "totp", "sms").
     *
     * @return the factor type identifier
     */
    String getFactorType();

    /**
     * Prepares the factor for verification.
     * <p>
     * Preparation typically involves generating and sending a verification challenge to the user.
     * For example, an email code factor would generate a random code and send it via email.
     * <p>
     * The returned preparation result should contain any information needed for verification
     * or to be returned to the client (e.g., masked email address, QR code data).
     * <p>
     * If an error occurs, throw an {@link MfaException} with an appropriate error code.
     * The MFA service will catch it and attach the error to the session state.
     *
     * @param preparationContext the context containing session data and HTTP request/response
     * @return a serializable result of the preparation step (may be null)
     * @throws MfaException if an error occurs during preparation
     */
    Serializable prepare(PreparationContext preparationContext) throws MfaException;

    /**
     * Verifies the factor with the provided verification data.
     * <p>
     * This method validates the user-provided verification data against the expected value
     * (which was typically generated during preparation). For example, an email code factor
     * would compare the submitted code against the code that was sent.
     * <p>
     * If an error occurs, throw an {@link MfaException} with an appropriate error code.
     * The MFA service will catch it and attach the error to the factor state.
     *
     * @param verificationContext the context containing session data, preparation result, and verification data
     * @return true if verification succeeds, false otherwise
     * @throws MfaException if an error occurs during verification
     */
    boolean verify(VerificationContext verificationContext) throws MfaException;
}
