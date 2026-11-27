import type { JCRNodeWrapper } from "org.jahia.services.content";

export interface Props {
  /**
   * The context path of Jahia.
   * Could be `''` (empty string, this is the default) or `'/my-context'` (if a custom context path is set via `CATALINA_CONTEXT` env variable).
   *
   */
  contextPath: string;
  /**
   * The key of the site of the page that renders the component, sent with the credentials so that a user of that site can sign in.
   */
  siteKey?: string;
  logo?: JCRNodeWrapper;
  loginEmailFieldLabel: string;
  loginPasswordFieldLabel: string;
  loginSubmitButtonLabel: string;
  loginBelowPasswordFieldHtml?: string;
  loginAdditionalActionHtml?: string;
  emailCodeVerificationFieldLabel: string;
  emailCodeVerificationSubmitButtonLabel: string;
  emailCodeVerificationAdditionalActionHtml?: string;
  emailCodeVerificationAdditionalActionResendLabel: string;
}
