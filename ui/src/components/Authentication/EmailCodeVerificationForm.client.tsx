import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { useApiRoot } from "../../hooks/ApiRootContext";
import { prepareEmailFactor, verifyEmailCodeFactor } from "../../services";
import classes from "./component.module.css";
import ErrorMessage from "./ErrorMessage.client";
import type { Props } from "./types";
import clsx from "clsx";
import { tError } from "../../services/i18n";
import { Trans } from "react-i18next";
import { t } from "i18next";
import type { MfaError } from "../../services/common";

interface EmailCodeVerificationFormProps {
  content: Props;
  onSuccess: () => void;
  onFatalError: (error: MfaError) => void;
}
export default function EmailCodeVerificationForm(props: Readonly<EmailCodeVerificationFormProps>) {
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [error, setError] = useState("");
  const [inProgress, setInProgress] = useState(false);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const apiRoot = useApiRoot();

  const codeLength = 6;
  // 32px per digit, 6px between digits
  const codeContainerWidth = codeLength * 32 + (codeLength - 1) * 6 + "px";

  const prepareFactor = () => {
    prepareEmailFactor(apiRoot)
      .then((result) => {
        if (result.success) {
          setError("");
          setMaskedEmail(result.maskedEmail);
        } else if (result?.fatalError) {
          props.onFatalError(result.error);
        } else {
          setError(tError(result.error));
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    prepareFactor();
  }, []);

  if (loading) {
    return (
      <div>
        <Trans i18nKey="verify.loading" />
      </div>
    );
  }

  const codeSlots = code.padEnd(codeLength, " ").slice(0, codeLength).split("");

  const handleCodeInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replaceAll(/\D/g, "").slice(0, codeLength);
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
      setError(t("verify.code_too_short", { codeLength: codeLength }));
      return;
    }
    verifyEmailCodeFactor(apiRoot, code)
      .then((result) => {
        if (result.success) {
          setError("");
          props.onSuccess();
        } else if (result?.fatalError) {
          props.onFatalError(result.error);
        } else {
          setError(tError(result.error));
        }
      })
      .finally(() => setInProgress(false));
  };

  const handleResendCode = (): void => {
    setLoading(true);
    prepareFactor();
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
      <h2>
        <Trans i18nKey="header.title" />
      </h2>
      {error === "" && (
        <div>
          <Trans
            i18nKey="factor.email_code.verification_code_has_been_sent"
            components={{
              mark: <span style={{ fontWeight: 700 }} />,
            }}
            values={{
              maskedEmail: maskedEmail,
            }}
          />
        </div>
      )}

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
