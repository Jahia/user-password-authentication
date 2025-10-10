import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { useApiRoot } from "../../hooks/ApiRootContext";
import { prepareEmailFactor, verifyEmailCodeFactor } from "../../services";
import classes from "./component.module.css";
import ErrorMessage from "./ErrorMessage.client";
import type { Props } from "./types";
import clsx from "clsx";

interface EmailCodeVerificationFormProps {
  onSuccess: () => void;
  content: Props;
}
export default function EmailCodeVerificationForm(props: EmailCodeVerificationFormProps) {
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [inProgress, setInProgress] = useState(false);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const apiRoot = useApiRoot();

  const codeLength = 6;
  // 32px per digit, 6px between digits
  const codeContainerWidth = codeLength * 32 + (codeLength - 1) * 6 + "px";

  useEffect(() => {
    prepareEmailFactor(apiRoot)
      .then((result) => {
        if (result.success) {
          setError("");
        } else {
          setError(
            result.error?.message ||
              "An error occurred while sending the code. Please try again later.",
          );
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  const emailMasked = "***email***";
  const codeSlots = code.padEnd(codeLength, " ").slice(0, codeLength).split("");

  const handleCodeInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, codeLength);
    setCode(value);
  };

  const handleDigitClick = (index: number) => {
    hiddenInputRef.current?.focus();
    hiddenInputRef.current?.setSelectionRange(index, index);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setInProgress(true);
    if (code.length < codeLength) {
      setError(`Please enter the ${codeLength}-digit code.`);
      return;
    }
    verifyEmailCodeFactor(apiRoot, code)
      .then((r) => {
        if (r.success) {
          setError("");
          props.onSuccess();
        } else {
          setError(r.error?.message || "Verification failed");
        }
      })
      .finally(() => setInProgress(false));
  };

  const handleResendCode = (): void => {
    setLoading(true);
    prepareEmailFactor(apiRoot)
      .then((result) => {
        if (result.success) {
          setError("");
        } else {
          setError(
            result.error?.message ||
              "An error occurred while resending the code. Please try again later.",
          );
        }
      })
      .finally(() => setLoading(false));
  };

  const renderDigitBox = (char: string, index: number) => (
    <div
      className={clsx(
        classes.digitBox,
        code.length === index ? classes.digitBoxActive : classes.digitBoxInactive,
      )}
      key={index}
      onClick={() => handleDigitClick(index)}
      role="textbox"
      aria-label={`Digit ${index + 1}`}
    >
      {char === " " ? "" : char}
    </div>
  );

  return (
    <div>
      <h2>Two Factor Authentication</h2>
      <div>
        <span>
          A verification code has been sent to{" "}
          <span style={{ fontWeight: 700 }}>{emailMasked}</span>
          <br />
        </span>
        <span>This code will be valid for 15 minutes.</span>
      </div>

      <form onSubmit={handleSubmit}>
        <label htmlFor={"verificationCode"}>{props.content.emailCodeVerificationFieldLabel}</label>
        <div
          className={classes.codeContainer}
          style={{ width: codeContainerWidth }}
          onClick={() => hiddenInputRef.current?.focus()}
        >
          <input
            className={classes.hiddenInput}
            ref={hiddenInputRef}
            id={"verificationCode"}
            name={"verificationCode"}
            type="text"
            inputMode="numeric"
            autoFocus
            maxLength={codeLength}
            value={code}
            onChange={handleCodeInputChange}
            autoComplete={"one-time-code"}
            aria-label="Enter verification code"
            data-testid="verification-code"
          />
          {codeSlots.map(renderDigitBox)}
        </div>
        <ErrorMessage message={error} />
        <button type="submit" disabled={inProgress} data-testid="verification-submit">
          {props.content.emailCodeVerificationSubmitButtonLabel}
        </button>
        <hr />
        <div className={"additionalAction"}>
          {props.content.emailCodeVerificationAdditionalActionHtml && (
            <div
              dangerouslySetInnerHTML={{
                __html: props.content.emailCodeVerificationAdditionalActionHtml,
              }}
            />
          )}
          <a href="#" onClick={handleResendCode}>
            {props.content.emailCodeVerificationAdditionalActionResendLabel}
          </a>
        </div>
      </form>
    </div>
  );
}
