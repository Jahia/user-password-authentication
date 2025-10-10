import type { JCRNodeWrapper } from "org.jahia.services.content";

export interface Props {
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
