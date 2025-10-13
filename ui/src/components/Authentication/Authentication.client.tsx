import { useState } from "react";
import LoginForm from "./LoginForm.client.jsx";
import { ApiRootContext } from "../../hooks/ApiRootContext.jsx";
import EmailCodeVerificationForm from "./EmailCodeVerificationForm.client.jsx";
import type { Props } from "./types";

enum Step {
  LOGIN,
  VERIFY,
  COMPLETE,
}
export default function ({ apiRoot, content }: { apiRoot: string; content: Props }) {
  const [step, setStep] = useState<Step>(Step.LOGIN);

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
        <EmailCodeVerificationForm content={content} onSuccess={() => setStep(Step.COMPLETE)} />
      )}
      {step === Step.COMPLETE && (
        <div data-testid="success-message">Authentication Successful!</div>
      )}
    </ApiRootContext>
  );
}
