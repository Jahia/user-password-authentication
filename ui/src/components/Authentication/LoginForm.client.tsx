import { type FormEvent, useState } from "react";
import { initiate } from "../../services";
import classes from "./component.module.css";
import { useApiRoot } from "../../hooks/ApiRootContext.jsx";
import ErrorMessage from "./ErrorMessage.client";
import type { Props } from "./types";
import { tError } from "../../services/i18n";
import type { MfaError } from "../../services/common";

interface LoginFormProps {
  content: Props;
  onSuccess: (username: string) => void;
  onAllFactorsCompleted: () => void;
  onFatalError: (error: MfaError) => void;
}

export default function LoginForm(props: Readonly<LoginFormProps>) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [inProgress, setInProgress] = useState(false);
  const apiRoot = useApiRoot();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setInProgress(true);

    initiate(apiRoot, username, password)
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
        <label htmlFor={"username"}>{props.content.loginEmailFieldLabel}</label>
        <input
          id={"username"}
          name={"username"}
          className={classes.loginInput}
          type="text"
          autoComplete={"username"}
          placeholder="Email"
          data-testid="login-username"
          onChange={(e) => setUsername(e.target.value)}
        />
        <label htmlFor={"password"}>{props.content.loginPasswordFieldLabel}</label>
        <input
          id={"password"}
          name={"password"}
          className={classes.loginInput}
          type="password"
          autoComplete={"current-password"}
          placeholder="Password"
          data-testid="login-password"
          onChange={(e) => setPassword(e.target.value)}
        />
        {props.content.loginBelowPasswordFieldHtml && (
          <div
            data-testid="below-password-field"
            className={classes.belowPasswordField}
            dangerouslySetInnerHTML={{ __html: props.content.loginBelowPasswordFieldHtml }}
          />
        )}
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
