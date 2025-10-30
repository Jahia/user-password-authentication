import { useState } from "react";
import LoginForm from "./LoginForm.client.jsx";
import { ApiRootContext } from "../../hooks/ApiRootContext.jsx";
import EmailCodeVerificationForm from "./EmailCodeVerificationForm.client.jsx";
import type { Props } from "./types";
import { redirect } from "../../services/redirect";

enum Step {
  LOGIN,
  VERIFY,
  COMPLETE,
}

export default function ({ apiRoot, content }: { apiRoot: string; content: Props }) {
  const [step, setStep] = useState<Step>(Step.LOGIN);

  const handleVerifySuccess = () => {
    setStep(Step.COMPLETE);
    redirect(content.contextPath);
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
            handleVerifySuccess();
          }}
        />
      )}
    </ApiRootContext>
  );
}
