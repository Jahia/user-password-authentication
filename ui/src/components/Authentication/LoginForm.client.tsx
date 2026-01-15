import { type FormEvent, useState } from "react";
import { initiate } from "../../services";
import classes from "./component.module.css";
import { useApiRoot } from "../../hooks/ApiRootContext.jsx";
import ErrorMessage from "./ErrorMessage.client";
import type { Props } from "./types";
import { tError } from "../../services/i18n";
import type { MfaError } from "../../services/common";

/**
 * Extracts the site key from the current URL path.
 * Expected format: /sites/{siteKey}/...
 *
 * @returns the extracted site key, or undefined if the URL doesn't match the expected format
 */
function extractSiteKeyFromUrl(): string | undefined {
  const url = globalThis.location.pathname;
  const match = new RegExp(/^\/sites\/([^/]+)/).exec(url);
  if (!match) {
    console.warn(
      `Unable to extract site key from URL: ${url} (expected format: /sites/{siteKey}/...)`,
    );
    return undefined;
  }
  return match[1];
}

interface LoginFormProps {
  content: Props;
  onSuccess: (username: string) => void;
  onAllFactorsCompleted: () => void;
  onFatalError: (error: MfaError) => void;
}

export default function LoginForm(props: Readonly<LoginFormProps>) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true); // by default, enable the "remember me" feature
  const [error, setError] = useState("");
  const [inProgress, setInProgress] = useState(false);
  const apiRoot = useApiRoot();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setInProgress(true);

    const site = extractSiteKeyFromUrl();

    initiate(apiRoot, username, password, rememberMe, site)
      .then((result) => {
        if (result.success) {
          // special case if there is no factor configured
          if (result.remainingFactors.length === 0) props.onAllFactorsCompleted();
          else {
            props.onSuccess(username);
          }
          setError("");
        } else if (result?.fatalError) {
          props.onFatalError(result.error);
        } else {
          setError(tError(result.error));
        }
      })
      .finally(() => setInProgress(false));
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className={classes.formField}>
          <label htmlFor={"username"}>{props.content.loginEmailFieldLabel}</label>
          <input
            id={"username"}
            name={"username"}
            type="text"
            autoComplete={"username"}
            placeholder="Email"
            data-testid="login-username"
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className={classes.formField}>
          <label htmlFor={"password"}>{props.content.loginPasswordFieldLabel}</label>
          <input
            id={"password"}
            name={"password"}
            type="password"
            autoComplete={"current-password"}
            placeholder="Password"
            data-testid="login-password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {props.content.loginBelowPasswordFieldHtml && (
          <div
            data-testid="below-password-field"
            className={classes.belowPasswordField}
            dangerouslySetInnerHTML={{ __html: props.content.loginBelowPasswordFieldHtml }}
          />
        )}
        <div className={classes.formField}>
          <input
            id={"rememberMe"}
            name={"rememberMe"}
            type="checkbox"
            checked={rememberMe}
            data-testid="login-remember-me"
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <label htmlFor={"rememberMe"}>Remember me</label>
        </div>
        <ErrorMessage message={error} />
        <button type="submit" disabled={inProgress} data-testid="login-submit">
          {props.content.loginSubmitButtonLabel}
        </button>
      </form>
      <hr />
      {props.content.loginAdditionalActionHtml && (
        <div
          data-testid="additional-action"
          className={classes.additionalAction}
          dangerouslySetInnerHTML={{ __html: props.content.loginAdditionalActionHtml }}
        />
      )}
    </>
  );
}
