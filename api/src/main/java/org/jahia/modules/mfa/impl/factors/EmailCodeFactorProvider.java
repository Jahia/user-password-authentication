package org.jahia.modules.mfa.impl.factors;

import org.apache.commons.lang3.StringUtils;
import org.jahia.api.Constants;
import org.jahia.bin.Render;
import org.jahia.modules.mfa.*;
import org.jahia.osgi.BundleUtils;
import org.jahia.registries.ServicesRegistry;
import org.jahia.services.content.JCRNodeWrapper;
import org.jahia.services.content.JCRSessionFactory;
import org.jahia.services.content.JCRSessionWrapper;
import org.jahia.services.content.JCRTemplate;
import org.jahia.services.content.decorator.JCRSiteNode;
import org.jahia.services.content.decorator.JCRUserNode;
import org.jahia.services.mail.MailService;
import org.jahia.services.render.RenderContext;
import org.jahia.services.render.RenderException;
import org.jahia.services.render.RenderService;
import org.jahia.services.render.Resource;
import org.jahia.services.sites.JahiaSite;
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
    public String prepare(PreparationContext preparationContext) throws MfaException {
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
                JCRSiteNode resolvedSite = resolveSite(mfaSession, currentRequest, session, mailCodeContentNode);
                localRenderContext.setSite(resolvedSite);

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
            throw new MfaException("Error generating mail content for MFA mail code", e);
        }
    }

    /**
     * Resolves the site node for the {@link RenderContext} used during email generation.
     * <p>
     * When the MFA session contains a site key, that site is used directly. When no site key
     * is specified in the MFA session, this method uses the MFA module itself as the site
     * context to enable proper site template resolution during email content rendering.
     * <p>
     * In the latter case, the server name is determined using the following priority order:
     * <ol>
     *   <li>Use the server name from the HTTP request if it matches an existing site</li>
     *   <li>Use the default site's server name (if a default site is configured)</li>
     *   <li>Fall back to the system site's server name</li>
     * </ol>
     * <p>
     *
     * @param mfaSession          the MFA session containing the site key
     * @param request             the current HTTP request
     * @param session             the current JCR session used for repository interactions
     * @param mailCodeContentNode the JCR node associated with the mail code's content
     * @return the resolved site node for the given context
     * @throws RepositoryException if an error occurs while accessing the repository
     */
    private JCRSiteNode resolveSite(MfaSession mfaSession, HttpServletRequest request, JCRSessionWrapper session, JCRNodeWrapper mailCodeContentNode) throws RepositoryException {
        JCRSiteNode resolvedSite;
        if (mfaSession.getSiteKey() != null) {
            return sitesService.getSiteByKey(mfaSession.getSiteKey(), session);
        }
        String serverName;
        resolvedSite = sitesService.getSiteByServerName(request.getServerName(), session);
        if (resolvedSite != null) {
            serverName = resolvedSite.getServerName();
        } else {
            JahiaSite defaultSite = sitesService.getDefaultSite();
            String siteNode = defaultSite == null ? "/sites/systemsite" : defaultSite.getJCRLocalPath();
            resolvedSite = (JCRSiteNode) session.getNode(siteNode);
            serverName = resolvedSite.getServerName();
        }
        resolvedSite = new JCRSiteNode(mailCodeContentNode.getResolveSite().getDecoratedNode()) {
            @Override
            public String getServerName() {
                return serverName;
            }
        };
        return resolvedSite;
    }


    private HttpServletRequest unwrapRequest(HttpServletRequest request) {
        // Request may have been done over GraphQL, the contextPath will be: "/modules" which will break every link generated from Jahia render chain.
        // It's possible to unwrap the request to get the original request.
        if (request instanceof HttpServletRequestWrapper) {
            return (HttpServletRequest) ((HttpServletRequestWrapper) request).getRequest();
        }
        return request;
    }
}
