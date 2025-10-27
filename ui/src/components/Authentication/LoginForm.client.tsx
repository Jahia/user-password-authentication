import { type FormEvent, useState } from "react";
import { initiate } from "../../services";
import { useApiRoot } from "../../hooks/ApiRootContext.jsx";
import ErrorMessage from "./ErrorMessage.client";
import type { Props } from "./types";
import { tError } from "../../services/i18n";

interface LoginFormProps {
  content: Props;
  onSuccess: (username: string) => void;
  onSuspended: (args: Array<{ name: string; value: string }>) => void;
}

export default function (props: LoginFormProps) {
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
          props.onSuccess(username);
          setError("");
        } else if (result.error.code === "suspended_user") {
          props.onSuspended(result.error.arguments);
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
          type="password"
          autoComplete={"current-password"}
          placeholder="Password"
          data-testid="login-password"
          onChange={(e) => setPassword(e.target.value)}
        />
        {props.content.loginBelowPasswordFieldHtml && (
          <div
            className={"belowPasswordField"}
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
          className={"additionalAction"}
          dangerouslySetInnerHTML={{ __html: props.content.loginAdditionalActionHtml }}
        />
      )}
    </>
  );
}
