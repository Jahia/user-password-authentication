import { AbsoluteArea, Area, jahiaComponent } from "@jahia/javascript-modules-library";
import { Layout } from "../Layout.jsx";

jahiaComponent(
  {
    componentType: "template",
    nodeType: "jnt:page",
    name: "upa-authentication-page",
    displayName: "UPA Authentication Page",
  },
  ({ "jcr:title": title }, { renderContext }) => (
    <Layout title={title}>
      <div className={"card"}>
        <Area name="authentication" nodeType={"upaui:authentication"} />
      </div>
      <AbsoluteArea name="footer" parent={renderContext.getSite()} nodeType="upaui:footer" />
    </Layout>
  ),
);
