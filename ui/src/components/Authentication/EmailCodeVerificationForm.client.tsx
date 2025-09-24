import { type CSSProperties, type FormEvent, useEffect, useRef, useState } from "react";
import { useApiRoot } from "../../hooks/ApiRootContext";
import { prepareEmailFactor, verifyEmailCodeFactor } from "../../services";
import classes from "./component.module.css";
import ErrorMessage from "./ErrorMessage.client";
import type { AdditionalActionProps } from "./types";
import AdditionalAction from "./AdditionalAction.client";

interface EmailCodeVerificationFormProps {
  onSuccess: () => void;
}
export default function EmailCodeVerificationForm(props: EmailCodeVerificationFormProps) {
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [inProgress, setInProgress] = useState(false);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const apiRoot = useApiRoot();

  const CODE_LENGTH = 6;

  const hiddenInputStyle: CSSProperties = {
    position: "absolute",
    opacity: 0,
    pointerEvents: "auto",
    left: 0,
    top: 0,
  };

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
  const codeSlots = code.padEnd(CODE_LENGTH, " ").slice(0, CODE_LENGTH).split("");

  const handleCodeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCode(value);
  };

  const handleDigitClick = (index: number) => {
    hiddenInputRef.current?.focus();
    hiddenInputRef.current?.setSelectionRange(index, index);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setInProgress(true);
    if (code.length < CODE_LENGTH) {
      setError(`Please enter the ${CODE_LENGTH}-digit code.`);
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
      className={` ${classes.digitBox} ${code.length === index ? classes.digitBoxActive : classes.digitBoxInactive}`}
      key={index}
      onClick={() => handleDigitClick(index)}
      role="textbox"
      aria-label={`Digit ${index + 1}`}
    >
      {char === " " ? "" : char}
    </div>
  );

  const resendCodeAdditionalAction: AdditionalActionProps = {
    text: "Didn't receive the code?",
    linkURL: handleResendCode,
    linkLabel: "Resend code",
    inProgress,
  };
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
        <div className={classes.codeContainer} onClick={() => hiddenInputRef.current?.focus()}>
          <input
            ref={hiddenInputRef}
            type="text"
            inputMode="numeric"
            autoFocus
            maxLength={CODE_LENGTH}
            value={code}
            onChange={handleCodeInputChange}
            style={hiddenInputStyle}
            aria-label="Enter verification code"
            data-testid="verification-code"
          />
          {codeSlots.map(renderDigitBox)}
        </div>
        <ErrorMessage message={error} />
        <button type="submit" disabled={inProgress} data-testid="verification-submit">
          Verify
        </button>
        <AdditionalAction props={resendCodeAdditionalAction} />
      </form>
    </div>
  );
}
