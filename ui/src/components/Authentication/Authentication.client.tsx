import { useState } from "react";
import LoginForm from "./LoginForm.client.jsx";
import { ApiRootContext } from "../../hooks/ApiRootContext.jsx";
import EmailCodeVerificationForm from "./EmailCodeVerificationForm.client.jsx";
import type { AdditionalActionProps } from "./types";

enum Step {
  LOGIN,
  VERIFY,
  COMPLETE,
}
export default function ({
  apiRoot,
  additionalActionLogin,
}: {
  apiRoot: string;
  additionalActionLogin?: AdditionalActionProps;
}) {
  const [step, setStep] = useState<Step>(Step.LOGIN);

  return (
    <ApiRootContext value={apiRoot}>
      <div>
        {step === Step.LOGIN && (
          <LoginForm
            additionalAction={additionalActionLogin}
            onSuccess={() => {
              setStep(Step.VERIFY);
            }}
          />
        )}
        {step === Step.VERIFY && (
          <EmailCodeVerificationForm onSuccess={() => setStep(Step.COMPLETE)} />
        )}
        {step === Step.COMPLETE && (
          <div data-testid="success-message">Authentication Successful!</div>
        )}
      </div>
    </ApiRootContext>
  );
}
