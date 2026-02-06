import { jahiaComponent } from "@jahia/javascript-modules-library";
import { useTranslation } from "react-i18next";

// i18n message keys
const I18N_TITLE = "email.title";
const I18N_MESSAGE = "email.message";
const I18N_VALIDITY = "email.validity";
const I18N_NOT_REQUESTED_TITLE = "email.notRequested.title";
const I18N_NOT_REQUESTED_MESSAGE = "email.notRequested.message";

jahiaComponent(
  {
    componentType: "template",
    nodeType: "upa:mfaEmailCode",
    name: "emailCodeTemplate",
    displayName: "Email Code Template",
    priority: 2,
  },
  (_, { renderContext }) => {
    const { t } = useTranslation();
    // Trigger a cache flush when a site installed module is start/stop
    renderContext.getMainResource().getDependencies().add(renderContext.getSite().getPath());

    const headHtml = `
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="x-apple-disable-message-reformatting" />
      <title>${t(I18N_TITLE)}</title>
      <!--[if mso]>
      <style type="text/css">
        body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
      </style>
      <![endif]-->
    `;
    const bodyHtml = `
      <!-- rendered by 'user-password-authentication-ui' module -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #F6FAFC;">
        <tbody>
          <tr>
            <td align="center" style="padding: 24px;">
              <!--[if mso]>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="486" align="center">
                <tbody>
                  <tr>
                    <td>
              <![endif]-->
              
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 486px; background-color: #ffffff; border: 1px solid #e0e0e0; box-shadow: 0px 4px 8px rgba(19, 28, 33, 0.08);">
                <tbody>
                  <tr>
                    <td style="padding: 32px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tbody>
                          <tr>
                            <td align="center" style="padding-bottom: 40px;">
                              <a href="https://jahia.cloud" style="color: #00A0E3; text-decoration: underline; display: inline-block;">
                                <img src="https://academy.jahia.com/jahia-cloud-logo-small.png" alt="Jahia" width="155" height="70" style="display: block; border: 0; outline: none; text-decoration: none;" />
                              </a>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tbody>
                          <tr>
                            <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 14px; color: #293136; line-height: 1.6; padding-bottom: 24px;">
                              <p data-testid="email-message" style="margin: 0; padding: 0;">${t(I18N_MESSAGE)}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding-bottom: 24px;">
                              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                                <tbody>
                                  <tr>
                                    <td align="center" style="background-color: #F6F6F6; padding: 24px;">
                                      <p style="margin: 0; padding: 0; font-family: 'Courier New', Courier, monospace; font-size: 28px; font-weight: 700; color: #293136; line-height: 26px;">
                                        <span data-testid="code">{{CODE}}</span>
                                      </p>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td align="center" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 14px; color: #293136; padding-bottom: 40px;">
                              <p data-testid="validity" style="margin: 0; padding: 0;">${t(I18N_VALIDITY)}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 700; color: #00A0E3; padding-bottom: 8px;">
                              <p data-testid="footer-title" style="margin: 0; padding: 0;">${t(I18N_NOT_REQUESTED_TITLE)}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 14px; color: #293136; line-height: 1.6;">
                              <p data-testid="footer-text" style="margin: 0; padding: 0;">${t(I18N_NOT_REQUESTED_MESSAGE)}</p>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
              
              <!--[if mso]>
                    </td>
                  </tr>
                </tbody>
              </table>
              <![endif]-->
            </td>
          </tr>
        </tbody>
      </table>
    `;

    // Use dangerouslySetInnerHTML to maintain the HTML comments needed for Internet Explorer
    return (
      <html lang="en">
        <head dangerouslySetInnerHTML={{ __html: headHtml }} />
        <body
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
          style={{
            margin: 0,
            padding: 0,
            width: "100%",
            height: "100%",
            WebkitTextSizeAdjust: "100%",
            textSizeAdjust: "100%",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
            lineHeight: 1.6,
            color: "#293136",
            backgroundColor: "#F6FAFC",
          }}
        />
      </html>
    );
  },
);
