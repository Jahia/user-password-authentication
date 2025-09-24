import { jahiaComponent } from "@jahia/javascript-modules-library";
import classes from "./component.module.css";

interface Props {
  copyright: string;
}

jahiaComponent(
  {
    componentType: "view",
    nodeType: "mfaui:footer",
    displayName: "MFA Footer",
  },
  ({ copyright }: Props) => {
    return (
      <footer className={classes.footer}>
        <p>
          Copyrights © {new Date().getFullYear()} {copyright}
        </p>
      </footer>
    );
  },
);
