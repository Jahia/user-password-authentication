import { type FormEvent, type MouseEvent, useState } from "react";
import { login } from "../../services";
import { useApiRoot } from "../../hooks/ApiRootContext.jsx";
import classes from "./component.module.css";
import ErrorMessage from "./ErrorMessage.client";
import type { AdditionalActionProps } from "./types";
import AdditionalAction from "./AdditionalAction.client";

interface LoginFormProps {
  additionalAction?: AdditionalActionProps;
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
  const onForgotPassword = async (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    console.log("forget password"); // TODO to implement
  };

  return (
    <form onSubmit={handleSubmit} className={classes.form}>
      <label htmlFor={"username"}>Email</label>
      <input
        id={"username"}
        name={"username"}
        type="text"
        autoComplete={"username"}
        placeholder="Email"
        data-testid="login-username"
        onChange={(e) => setUsername(e.target.value)}
      />
      <label htmlFor={"password"}>Password</label>
      <input
        id={"password"}
        name={"password"}
        type="password"
        autoComplete={"current-password"}
        placeholder="Password"
        data-testid="login-password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <a href="#" className={classes.forgotPassword} onClick={onForgotPassword}>
        Forgot password ?
      </a>
      <ErrorMessage message={error} />
      <button type="submit" disabled={inProgress} data-testid="login-submit">
        Login
      </button>
      <AdditionalAction props={props.additionalAction} />
    </form>
  );
}
