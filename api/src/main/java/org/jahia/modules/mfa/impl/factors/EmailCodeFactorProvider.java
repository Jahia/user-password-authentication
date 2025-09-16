package org.jahia.modules.mfa.impl.factors;

import org.apache.commons.lang3.StringUtils;
import org.jahia.modules.mfa.MfaException;
import org.jahia.modules.mfa.MfaFactorProvider;
import org.jahia.modules.mfa.PreparationContext;
import org.jahia.modules.mfa.VerificationContext;
import org.jahia.registries.ServicesRegistry;
import org.jahia.services.content.decorator.JCRUserNode;
import org.jahia.services.mail.MailService;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.RepositoryException;
import java.security.SecureRandom;

/**
 * Email code MFA factor provider.
 * Generates and verifies email verification codes.
 */
@Component(service = MfaFactorProvider.class, immediate = true)
public class EmailCodeFactorProvider implements MfaFactorProvider {
    private static final Logger logger = LoggerFactory.getLogger(EmailCodeFactorProvider.class);
    private static final int EMAIL_CODE_LENGTH = 6;
    public static final String FACTOR_TYPE = "email_code";
    private static final SecureRandom random = new SecureRandom();

    @Override
    public String getFactorType() {
        return FACTOR_TYPE;
    }

    @Override
    public String prepare(PreparationContext preparationContext) throws MfaException {
        JCRUserNode user = preparationContext.getUser();
        String emailAddress = getUserEmailAddress(user);

        // Generate verification code
        String code = generateEmailCode();

        MailService mailService = ServicesRegistry.getInstance().getMailService();
        // TODO use i18n for email details
        String subject = "Validation code";
        String message = String.format("Your verification code is: %s", code);

        if (mailService.sendMessage(null, emailAddress, null, null, subject, message)) {
            logger.info("Validation code sent to user {} (email: {})", user.getName(), emailAddress);
        } else {
            throw new MfaException(String.format("Failed to send validation code to user: %s", user.getName()));
        }
        return code;

    }


    @Override
    public boolean verify(VerificationContext verificationContext) throws MfaException {
        String submittedCode = (String) verificationContext.getVerificationData();
        if (StringUtils.isEmpty(submittedCode)) {
            throw new MfaException("Verification code is required");
        }
        String storedCode = (String) verificationContext.getPreparationResult();
        if (StringUtils.isEmpty(storedCode)) {
            throw new MfaException("No verification code found. Please request a new code.");
        }
        return StringUtils.equals(submittedCode, storedCode);
    }

    private static String generateEmailCode() {
        StringBuilder code = new StringBuilder();
        for (int i = 0; i < EMAIL_CODE_LENGTH; i++) {
            code.append(random.nextInt(10));
        }
        return code.toString();
    }

    private static String getUserEmailAddress(JCRUserNode user) throws MfaException {
        String email;
        try {
            email = user.hasProperty("j:email") ? user.getProperty("j:email").getString() : null;
        } catch (RepositoryException e) {
            throw new MfaException(String.format("Failed to prepare email code factor for user: %s", user.getName()), e);
        }
        if (email == null || email.trim().isEmpty()) {
            throw new MfaException("User does not have an email address configured"); // TODO should we skip MFA in this case?
        }
        return email;
    }

}
