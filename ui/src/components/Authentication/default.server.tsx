import { buildEndpointUrl, Island, jahiaComponent } from "@jahia/javascript-modules-library";
import Authentication from "./Authentication.client.jsx";
import type { AdditionalActionProps } from "./types";

jahiaComponent(
  {
    nodeType: "mfaui:authentication",
    displayName: "MFA Authentication Component",
    componentType: "view",
  },
  ({
    additionalActionLoginText,
    additionalActionLoginLinkURL,
    additionalActionLoginLinkLabel,
  }: {
    additionalActionLoginText?: string;
    additionalActionLoginLinkURL?: string;
    additionalActionLoginLinkLabel?: string;
  }) => {
    // the API root is generated server-side
    const apiRoot = buildEndpointUrl("/modules/graphql");
    // for the login form, the details about the additional action are defined as JCR properties
    const additionalActionLogin: AdditionalActionProps = {
      text: additionalActionLoginText,
      linkURL: additionalActionLoginLinkURL,
      linkLabel: additionalActionLoginLinkLabel,
    };
    return (
      <Island
        component={Authentication}
        props={{
          apiRoot,
          additionalActionLogin,
        }}
      />
    );
  },
);
