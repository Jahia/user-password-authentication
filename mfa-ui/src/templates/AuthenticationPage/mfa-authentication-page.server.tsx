import { AbsoluteArea, Area, jahiaComponent } from "@jahia/javascript-modules-library";
import { Layout } from "../Layout.jsx";

jahiaComponent(
  {
    componentType: "template",
    nodeType: "jnt:page",
    name: "mfa-authentication-page",
    displayName: "MFA Authentication Page",
  },
  ({ "jcr:title": title }, { renderContext }) => (
    <Layout title={title}>
      <div className={"card"}>
        <Area name="authentication" nodeType={"mfaui:authentication"} />
      </div>
      <AbsoluteArea name="footer" parent={renderContext.getSite()} nodeType="mfaui:footer" />
    </Layout>
  ),
);
