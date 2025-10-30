import {
  buildEndpointUrl,
  buildModuleFileUrl,
  buildNodeUrl,
  Island,
  jahiaComponent,
} from "@jahia/javascript-modules-library";
import Authentication from "./Authentication.client.jsx";
import type { Props } from "./types";

jahiaComponent(
  {
    nodeType: "mfaui:authentication",
    displayName: "MFA Authentication Component",
    componentType: "view",
  },
  (props: Props, { renderContext }) => {
    // the API root is generated server-side
    const apiRoot = buildEndpointUrl("/modules/graphql");
    // pass the JCR props server-side -> client-side
    const content: Props = {
      contextPath: renderContext.getRequest().getContextPath(),
      loginEmailFieldLabel: props.loginEmailFieldLabel,
      loginPasswordFieldLabel: props.loginPasswordFieldLabel,
      loginSubmitButtonLabel: props.loginSubmitButtonLabel,
      loginBelowPasswordFieldHtml: props.loginBelowPasswordFieldHtml,
      loginAdditionalActionHtml: props.loginAdditionalActionHtml,
      emailCodeVerificationFieldLabel: props.emailCodeVerificationFieldLabel,
      emailCodeVerificationSubmitButtonLabel: props.emailCodeVerificationSubmitButtonLabel,
      emailCodeVerificationAdditionalActionHtml: props.emailCodeVerificationAdditionalActionHtml,
      emailCodeVerificationAdditionalActionResendLabel:
        props.emailCodeVerificationAdditionalActionResendLabel,
    };
    return (
      <>
        <header>
          <img
            src={
              props.logo ? buildNodeUrl(props.logo) : buildModuleFileUrl("static/default-logo.svg")
            }
            alt="Logo"
          />
        </header>
        <main>
          <Island
            component={Authentication}
            props={{
              apiRoot,
              content,
            }}
          />
        </main>
      </>
    );
  },
);
