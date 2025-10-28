package org.jahia.modules.mfa;

import org.jahia.services.content.decorator.JCRUserNode;

/**
 * Exception thrown when the MFA preparation rate limit is exceeded.<br>
 *
 * Unlike other exceptions that may occur during the preparation of an MFA factor, {@link MfaPreparationRateLimitException} does not mark the MFA session as failed.
 */
public class MfaPreparationRateLimitException extends MfaException {
    public MfaPreparationRateLimitException(String factorType, JCRUserNode user, long nextRetryInSeconds) {
        super("prepare.rate_limit_exceeded", "nextRetryInSeconds", String.valueOf(nextRetryInSeconds), "factorType", factorType, "user", user.getName());
    }
}
