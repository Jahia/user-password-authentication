package org.jahia.modules.mfa.impl.factors;

import org.apache.commons.lang3.StringUtils;
import org.jahia.api.Constants;
import org.jahia.bin.Render;
import org.jahia.modules.mfa.*;
import org.jahia.osgi.BundleUtils;
import org.jahia.registries.ServicesRegistry;
import org.jahia.services.content.*;
import org.jahia.services.content.decorator.JCRSiteNode;
import org.jahia.services.content.decorator.JCRUserNode;
import org.jahia.services.mail.MailService;
import org.jahia.services.render.*;
import org.jahia.services.sites.JahiaSitesService;
import org.jahia.services.usermanager.JahiaUser;
import org.jahia.utils.i18n.Messages;
import org.osgi.framework.Bundle;
import org.osgi.framework.BundleContext;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.RepositoryException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;
import javax.servlet.http.HttpServletResponse;
import java.io.Serializable;
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
    public static final String MAIL_CODE_TEMPLATE_NAME = "mailCodeTemplate";
    private static final SecureRandom random = new SecureRandom();

    private RenderService renderService;
    private JahiaSitesService sitesService;
    private String mailCodeContentPath;
    private String resourceBundleName;

    @Activate
    protected void activate(BundleContext bundleContext) {
        logger.info("Initializing MFA mail code factor provider...");
        Bundle currentBundle = bundleContext.getBundle();
        String moduleId = BundleUtils.getModuleId(currentBundle);
        this.mailCodeContentPath = String.format("/modules/%s/%s/contents/mfaMailCode", moduleId, BundleUtils.getModuleVersion(currentBundle));
        this.resourceBundleName = "resources." + moduleId;
    }

    @Reference
    public void setRenderService(RenderService renderService) {
        this.renderService = renderService;
    }

    @Reference
    public void setSitesService(JahiaSitesService sitesService) {
        this.sitesService = sitesService;
    }

    @Override
    public String getFactorType() {
        return FACTOR_TYPE;
    }

    @Override
    public Serializable prepare(PreparationContext preparationContext) throws MfaException {
        JCRUserNode user = preparationContext.getUser();
        String emailAddress = getUserEmailAddress(user);

        // Generate verification code
        MfaSession mfaSession = preparationContext.getMfaSession();
        String code = generateEmailCode();
        String mailContent = generateMailContent(mfaSession, preparationContext.getHttpServletRequest(), preparationContext.getHttpServletResponse(), code);
        String mailSubject = Messages.get(resourceBundleName, "jahia-mfa.mail.title", mfaSession.getUserPreferredLanguage());

        MailService mailService = ServicesRegistry.getInstance().getMailService();
        if (mailService.sendHtmlMessage(null, emailAddress, null, null, mailSubject, mailContent)) {
            logger.info("Validation code sent to user {} (email: {})", user.getName(), emailAddress);
        } else {
            throw new MfaException("factor.email_code.sending_validation_code_failed", "user", user.getName());
        }
        String maskedEmail = getMaskedEmail(emailAddress);
        return new PreparationResult(code, maskedEmail);
    }

    private static String getMaskedEmail(String emailAddress) {
        String localPart = StringUtils.substringBefore(emailAddress, "@");
        String domain = StringUtils.substringAfter(emailAddress, "@");
        String maskedEmail;

        if (localPart.length() <= 2) {
            // For very short local parts, just show first char + asterisks
            maskedEmail = localPart.charAt(0) + "***@" + domain;
        } else {
            // Show first and last char with asterisks in between
            maskedEmail = localPart.charAt(0) + "***" + localPart.charAt(localPart.length() - 1) + "@" + domain;
        }
        return maskedEmail;
    }

    @Override
    public boolean verify(VerificationContext verificationContext) throws MfaException {
        String submittedCode = (String) verificationContext.getVerificationData();
        if (StringUtils.isEmpty(submittedCode)) {
            throw new MfaException("factor.email_code.verification_code_required");
        }
        PreparationResult preparationResult = (PreparationResult) verificationContext.getPreparationResult();
        String storedCode = preparationResult != null ? preparationResult.getCode() : null;
        if (StringUtils.isEmpty(storedCode)) {
            throw new MfaException("factor.email_code.missing_prepared_code");
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
            throw new MfaException("factor.email_code.preparation_failed", "user", user.getName());
        }
        if (email == null || email.trim().isEmpty()) {
            throw new MfaException("factor.email_code.email_not_configured_for_user", "user", user.getName()); // TODO should we skip MFA in this case?
        }
        return email;
    }

    private String generateMailContent(MfaSession mfaSession, HttpServletRequest currentRequest, HttpServletResponse currentResponse, String code) throws MfaException {
        // will be "guest" at this stage, and it's sounds logical to render the mail code as guest user, for caching purpose.
        JahiaUser user = JCRSessionFactory.getInstance().getCurrentUser();
        try {
            return JCRTemplate.getInstance().doExecuteWithSystemSessionAsUser(user, Constants.LIVE_WORKSPACE, mfaSession.getUserPreferredLanguage(), session -> {

                RenderContext localRenderContext = new RenderContext(unwrapRequest(currentRequest), currentResponse, session.getUser());
                // Use live workspace to benefit from HTML cache capabilities of Jahia rendering engine
                localRenderContext.setEditMode(false);
                localRenderContext.setWorkspace(Constants.LIVE_WORKSPACE);
                localRenderContext.setServletPath(Render.getRenderServletPath());

                // Build a resource from the mail code content node
                JCRNodeWrapper mailCodeContentNode = session.getNode(mailCodeContentPath);
                Resource resource = new Resource(mailCodeContentNode, "html", MAIL_CODE_TEMPLATE_NAME, Resource.CONFIGURATION_PAGE);
                localRenderContext.setMainResource(resource);

                // Resolve site, use the one from the session if specified, otherwise use the module as site, this allows site template resolution.
                JCRSiteNode resolvedSite = null;
                if (mfaSession.getSiteKey() != null) {
                    resolvedSite = sitesService.getSiteByKey(mfaSession.getSiteKey(), session);
                    localRenderContext.setSite(resolvedSite);
                } else {
                    localRenderContext.setSite(mailCodeContentNode.getResolveSite());
                }

                if (logger.isDebugEnabled()) {
                    logger.debug("In order to debug the HTML output of the mfa mail code verification template, " +
                            "you can directly visit: {}", String.format("/cms/render/live/%s%s.%s.html%s", mfaSession.getUserPreferredLanguage(), mailCodeContentPath,
                            MAIL_CODE_TEMPLATE_NAME, resolvedSite != null ? "?jsite=" + resolvedSite.getIdentifier() : ""));
                }

                try {
                    String out = renderService.render(resource, localRenderContext);
                    if (StringUtils.isEmpty(out) || !out.contains("{{CODE}}")) {
                        // No output, no code placeholder, something went wrong with the rendering
                        throw new RenderException("Failed to render mail content for MFA mail code, please check your template");
                    }

                    // Replace the {{CODE}} placeholder with the actual code, we do that after rendering to allow caching of the rendered content.
                    return out.replace("{{CODE}}", code);
                } catch (RenderException e) {
                    throw new RepositoryException(e);
                }
            });
        } catch (RepositoryException e) {
            logger.error("An error occurred while generating mail content for MFA mail code, enable debug log level to get help");
            throw new MfaException("factor.email_code.generating_email_content_failed");
        }
    }

    private HttpServletRequest unwrapRequest(HttpServletRequest request) {
        // Request may have been done over GraphQL, the contextPath will be: "/modules" which will break every links generated from Jahia render chain.
        // It's possible to unwrap the request to get original request.
        if (request instanceof HttpServletRequestWrapper) {
            return (HttpServletRequest) ((HttpServletRequestWrapper) request).getRequest();
        }
        return request;
    }

    /**
     * Preparation result for email code factor provider.
     * <p>
     * Contains the generated verification code and the masked email address.
     * This is the response of the {@link #prepare(PreparationContext)} method
     * and is then used during the {@link #verify(VerificationContext)} method.
     */
    public static class PreparationResult implements Serializable {
        final String code;
        final String maskedEmail;

        public PreparationResult(String code, String maskedEmail) {
            this.code = code;
            this.maskedEmail = maskedEmail;
        }

        public String getCode() {
            return code;
        }

        public String getMaskedEmail() {
            return maskedEmail;
        }
    }
}
