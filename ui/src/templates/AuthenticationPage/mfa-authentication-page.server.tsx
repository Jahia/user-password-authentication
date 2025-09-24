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
      {/*<div*/}
      {/*  style={{*/}
      {/*    minHeight: "100vh",*/}
      {/*    background: "linear-gradient(133deg, #140933 0%, #00A0E3 100%)",*/}
      {/*    backgroundBlendMode: "darken",*/}
      {/*  }}*/}
      {/*>*/}
      {/*</div>*/}
      <div className={"card"}>
        <div className={"card-header"}>
          <Area name="card-header" />
        </div>
        <main>
          <Area name="authentication" nodeType={"mfaui:authentication"} />
        </main>
        <div className={"card-footer"}>
          <Area name="card-footer" />
        </div>
      </div>
      <AbsoluteArea name="footer" parent={renderContext.getSite()} nodeType="mfaui:footer" />
    </Layout>
  ),
);
