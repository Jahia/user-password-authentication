package org.jahia.modules.mfa.impl.factors;

import org.jahia.modules.mfa.MfaFactorProvider;
import org.jahia.modules.mfa.MfaSession;
import org.jahia.services.content.decorator.JCRUserNode;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.RepositoryException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import java.security.SecureRandom;
import java.util.HashMap;
import java.util.Map;

/**
 * Email code MFA factor provider.
 * Generates and verifies email verification codes.
 */
@Component(service = MfaFactorProvider.class, immediate = true)
public class EmailCodeFactorProvider implements MfaFactorProvider {
    private static final Logger logger = LoggerFactory.getLogger(EmailCodeFactorProvider.class);
    private static final int EMAIL_CODE_LENGTH = 6;
    private static final String SESSION_KEY_PREFIX = "mfa_email_code_";
    protected static final String FACTOR_TYPE = "email_code";
    private static final SecureRandom random = new SecureRandom();

    @Override
    public String getFactorType() {
        return FACTOR_TYPE;
    }

    @Override
    public void prepare(MfaSession session, JCRUserNode user, HttpServletRequest request) {
        try {
            String email = user.hasProperty("j:email") ? user.getProperty("j:email").getString() : null;
            if (email == null || email.trim().isEmpty()) {
                session.markFactorPreparationFailed(getFactorType(), "User does not have an email address configured");
                return;
            }

            // Generate verification code
            String code = generateEmailCode();

            // Store code in HTTP session for verification
            HttpSession httpSession = request.getSession();
            httpSession.setAttribute(SESSION_KEY_PREFIX + user.getName(), code);

            // TODO: Send actual email (for now just log)
            logger.info("Generated email code for user {}: {}", user.getName(), code);

            // Update MFA session with preparation data
            Map<String, Object> data = new HashMap<>();
            data.put("email", email);
            data.put("codeSent", true);

            session.markFactorPrepared(getFactorType(), data);

        } catch (RepositoryException e) {
            logger.error("Failed to prepare email code factor for user: {}", user.getName(), e);
            session.markFactorPreparationFailed(getFactorType(), "Failed to prepare email verification");
        }
    }

    @Override
    public void verify(MfaSession session, JCRUserNode user, HttpServletRequest request) {
        try {
            // Get submitted code from request attribute (set by GraphQL mutation)
            String submittedCode = (String) request.getAttribute("code");
            if (submittedCode == null || submittedCode.trim().isEmpty()) {
                session.markFactorVerificationFailed(getFactorType(), "Verification code is required");
                return;
            }

            // Get stored code from HTTP session
            HttpSession httpSession = request.getSession(false);
            if (httpSession == null) {
                session.markFactorVerificationFailed(getFactorType(), "No active session found");
                return;
            }

            String storedCode = (String) httpSession.getAttribute(SESSION_KEY_PREFIX + user.getName());
            if (storedCode == null) {
                session.markFactorVerificationFailed(getFactorType(), "No verification code found. Please request a new code.");
                return;
            }

            // Verify code
            if (submittedCode.trim().equals(storedCode)) {
                // Clear code after successful verification
                httpSession.removeAttribute(SESSION_KEY_PREFIX + user.getName());
                session.markFactorCompleted(getFactorType());
            } else {
                session.markFactorVerificationFailed(getFactorType(), "Invalid verification code");
            }

        } catch (Exception e) {
            logger.error("Failed to verify email code for user: {}", user.getName(), e);
            session.markFactorVerificationFailed(getFactorType(), "Verification failed due to system error");
        }
    }

    private String generateEmailCode() {
        StringBuilder code = new StringBuilder();
        for (int i = 0; i < EMAIL_CODE_LENGTH; i++) {
            code.append(random.nextInt(10));
        }
        return code.toString();
    }
}
