import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { useApiRoot } from "../../hooks/ApiRootContext";
import { prepareEmailFactor, verifyEmailCodeFactor } from "../../services";
import classes from "./component.module.css";
import ErrorMessage from "./ErrorMessage.client";
import type { Props } from "./types";
import { convertErrorArgsToInterpolation } from "../../services/i18n";
import { Trans, useTranslation } from "react-i18next";
import type { MfaError } from "../../services/common";

interface EmailCodeVerificationFormProps {
  content: Props;
  onSuccess: () => void;
  onFatalError: (error: MfaError) => void;
}
export default function EmailCodeVerificationForm(props: Readonly<EmailCodeVerificationFormProps>) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [error, setError] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const maskElementRef = useRef<HTMLDivElement>(null);
  const apiRoot = useApiRoot();

  const codeLength = 6;

  const prepareFactor = () => {
    prepareEmailFactor(apiRoot)
      .then((result) => {
        if (result.success) {
          setError("");
          setMaskedEmail(result.maskedEmail);
        } else if (result?.fatalError) {
          props.onFatalError(result.error);
        } else {
          const { key, interpolation } = convertErrorArgsToInterpolation(result.error);
          setError(t(key, interpolation));
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const updateMask = () => {
    if (inputRef.current && maskElementRef.current && /^\d*$/.test(inputRef.current.value)) {
      const filledLength = inputRef.current.value.length;
      maskElementRef.current.textContent =
        " ".repeat(filledLength) + "_".repeat(codeLength - filledLength);
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
    updateMask();
    prepareFactor();
  }, []);

  if (loading) {
    return (
      <div>
        <Trans i18nKey="verify.loading" />
      </div>
    );
  }

  const handleCodeInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replaceAll(/\D/g, "").slice(0, codeLength);
    setCode(value);
  };

  const handleFormInput = () => {
    if (formRef.current) {
      updateMask();
      // Check both form validity AND that the code has correct length
      // Note: HTML5 minLength validation doesn't work properly when values are typed (or set) programmatically
      //       Also, reading the actual input value from the DOM, to avoid stale state,
      //       since the latter might not be updated yet
      const currentValue = inputRef.current?.value || "";
      const isValidLength = currentValue.length === codeLength;
      setIsFormValid(formRef.current.checkValidity() && isValidLength);
    }
  };

  const setFormRef = (ref: HTMLFormElement | null) => {
    formRef.current = ref;
    updateMask();
    inputRef.current?.focus();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    verifyEmailCodeFactor(apiRoot, code).then((result) => {
      if (result.success) {
        setError("");
        props.onSuccess();
      } else if (result?.fatalError) {
        props.onFatalError(result.error);
      } else {
        const { key, interpolation } = convertErrorArgsToInterpolation(result.error);
        setError(t(key, interpolation));
      }
    });
  };

  const handleResendCode = (): void => {
    setLoading(true);
    prepareFactor();
  };

  return (
    <div className={classes.otpFormWrapper}>
      <h2>
        <Trans i18nKey={props.content.emailCodeVerificationFieldLabel} />
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

      <form ref={setFormRef} onSubmit={handleSubmit} onInput={handleFormInput}>
        <div
          style={{ "position": "relative", "--length": codeLength } as React.CSSProperties}
          className={classes.otp}
        >
          <div ref={maskElementRef} aria-hidden="true" />
          <input
            ref={inputRef}
            id={"verificationCode"}
            name={"verificationCode"}
            type="text"
            inputMode="numeric"
            autoFocus
            maxLength={codeLength}
            minLength={codeLength}
            value={code}
            onChange={handleCodeInputChange}
            autoComplete="one-time-code"
            aria-label="Enter verification code"
            data-testid="verification-code"
            required
          />
        </div>
        <ErrorMessage message={error} />
        <button
          type="submit"
          disabled={!isFormValid}
          data-testid="verification-submit"
          className={classes.submitButton}
        >
          {props.content.emailCodeVerificationSubmitButtonLabel}
        </button>
        <hr />
        <div data-testid="additional-action" className={classes.additionalAction}>
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
