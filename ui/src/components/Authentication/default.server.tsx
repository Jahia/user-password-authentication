import {
  AddResources,
  buildEndpointUrl,
  buildModuleFileUrl,
  buildNodeUrl,
  Island,
  jahiaComponent,
} from "@jahia/javascript-modules-library";
import classes from "./component.module.css";
import "@fontsource-variable/nunito-sans";
import Authentication from "./Authentication.client.jsx";
import type { Props } from "./types";

jahiaComponent(
  {
    nodeType: "upaui:authentication",
    displayName: "UPA Authentication Component",
    componentType: "view",
  },
  (props: Props, { renderContext }) => {
    // the API root is generated server-side
    const apiRoot = buildEndpointUrl("/modules/graphql");
    const site = renderContext.getSite();
    // pass the JCR props server-side -> client-side
    const content: Props = {
      contextPath: renderContext.getRequest().getContextPath(),
      // under /modules/, the site of the render is a template set, whose users are not site users
      siteKey: site?.getPath().startsWith("/sites/") ? site.getSiteKey() : undefined,
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
        <AddResources type="css" resources={buildModuleFileUrl("dist/assets/style.css")} />
        <header className={classes.header}>
          <img
            src={
              props.logo ? buildNodeUrl(props.logo) : buildModuleFileUrl("static/default-logo.svg")
            }
            alt="Logo"
          />
        </header>
        <main className={classes.main}>
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
