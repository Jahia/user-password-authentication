import { useState, useEffect, useMemo } from "react";
import LoginForm from "./LoginForm.client.jsx";
import { ApiRootContext } from "../../hooks/ApiRootContext.jsx";
import EmailCodeVerificationForm from "./EmailCodeVerificationForm.client.jsx";
import type { Props } from "./types";
import { Trans } from "react-i18next";
enum Step {
  LOGIN,
  VERIFY,
  COMPLETE,
}

export default function ({ apiRoot, content }: { apiRoot: string; content: Props }) {
  const [step, setStep] = useState<Step>(Step.LOGIN);
  const [countdown, setCountdown] = useState<number>(5);
  const [isClient, setIsClient] = useState(false);

  // Ensure client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only calculate redirect URL on client
  const redirectUrl = useMemo(() => {
    if (!isClient || typeof window === "undefined") return null;

    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("redirect");
  }, [isClient]);

  useEffect(() => {
    if (step === Step.COMPLETE && redirectUrl && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (step === Step.COMPLETE && redirectUrl && countdown === 0) {
      window.location.href = redirectUrl;
    }
  }, [step, countdown, redirectUrl]);

  const handleImmediateRedirect = () => {
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  };

  return (
    <ApiRootContext value={apiRoot}>
      {step === Step.LOGIN && (
        <LoginForm
          content={content}
          onSuccess={() => {
            setStep(Step.VERIFY);
          }}
        />
      )}
      {step === Step.VERIFY && (
        <EmailCodeVerificationForm
          content={content}
          onSuccess={() => {
            setStep(Step.COMPLETE);
          }}
        />
      )}
      {step === Step.COMPLETE && (
        <div data-testid="success-message">
          <Trans i18nKey="complete.successful" />
          {isClient && redirectUrl && (
            <div style={{ marginTop: "15px" }}>
              <div style={{ fontSize: "14px", color: "#666", marginBottom: "10px" }}>
                <Trans
                  i18nKey="complete.redirect_url"
                  components={{
                    mark: <code />,
                  }}
                  values={{
                    redirectUrl: redirectUrl,
                  }}
                />
              </div>
              <div style={{ fontSize: "16px", color: "#333", marginBottom: "10px" }}>
                <Trans
                  i18nKey="complete.redirecting_countdown"
                  values={{
                    countdown: countdown,
                  }}
                />
              </div>
              <button
                onClick={handleImmediateRedirect}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
                type="button"
              >
                <Trans i18nKey="complete.redirecting_go_label" />
              </button>
            </div>
          )}
        </div>
      )}
    </ApiRootContext>
  );
}
