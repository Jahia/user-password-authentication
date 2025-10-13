import { type FormEvent, useState } from "react";
import { login } from "../../services";
import { useApiRoot } from "../../hooks/ApiRootContext.jsx";
import ErrorMessage from "./ErrorMessage.client";
import type { Props } from "./types";

interface LoginFormProps {
  content: Props;
  onSuccess: (username: string) => void;
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

    login(apiRoot, username, password)
      .then((loginResult) => {
        if (loginResult.success) {
          props.onSuccess(username);
          setError("");
        } else {
          setError(loginResult.error?.message || "Login failed");
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
