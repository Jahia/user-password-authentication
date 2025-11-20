import { useState } from "react";
import LoginForm from "./LoginForm.client.jsx";
import { ApiRootContext } from "../../hooks/ApiRootContext.jsx";
import EmailCodeVerificationForm from "./EmailCodeVerificationForm.client.jsx";
import type { Props } from "./types";
import { redirect } from "../../services";
import SuspensionScreen from "./SuspensionScreen.client.js";
enum Step {
  LOGIN,
  VERIFY,
  COMPLETE,
  SUSPENDED,
}

export default function ({ apiRoot, content }: { apiRoot: string; content: Props }) {
  const [step, setStep] = useState<Step>(Step.LOGIN);
  const [suspensionDurationInSeconds, setSuspensionDurationInSeconds] = useState<number>(0);

  const handleVerifySuccess = () => {
    setStep(Step.COMPLETE);
    redirect(content.contextPath);
  };

  return (
    <ApiRootContext value={apiRoot}>
      {step === Step.SUSPENDED && (
        <SuspensionScreen suspensionDurationInSeconds={suspensionDurationInSeconds} />
      )}
      {step === Step.LOGIN && (
        <LoginForm
          content={content}
          onSuccess={() => {
            setStep(Step.VERIFY);
          }}
          onSuspended={(suspensionDurationInSeconds) => {
            setSuspensionDurationInSeconds(suspensionDurationInSeconds);
            setStep(Step.SUSPENDED);
          }}
        />
      )}
      {step === Step.VERIFY && (
        <EmailCodeVerificationForm
          content={content}
          onSuccess={() => {
            handleVerifySuccess();
          }}
          onSuspended={(suspensionDurationInSeconds) => {
            setSuspensionDurationInSeconds(suspensionDurationInSeconds);
            setStep(Step.SUSPENDED);
          }}
        />
      )}
    </ApiRootContext>
  );
}
