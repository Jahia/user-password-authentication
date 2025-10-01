import type { AdditionalActionProps } from "./types";
import { type MouseEvent } from "react";

export default function AdditionalAction({ props }: { props?: AdditionalActionProps }) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (typeof props?.linkURL === "string") {
      window.location.href = props.linkURL;
    } else if (typeof props?.linkURL === "function") {
      props.linkURL();
    }
  };

  return (
    <>
      <hr />
      <div className={"additionalAction"}>
        {props?.text ? <p>{props.text}</p> : ""}
        {props?.linkLabel && props?.linkURL && (
          <a
            href="#"
            onClick={handleClick}
            aria-disabled={props.inProgress}
            style={{ pointerEvents: props.inProgress ? "none" : "auto" }}
          >
            {props.linkLabel}
          </a>
        )}
      </div>
    </>
  );
}
