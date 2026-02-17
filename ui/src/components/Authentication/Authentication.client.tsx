import { useState } from "react";
import LoginForm from "./LoginForm.client.jsx";
import { ApiRootContext } from "../../hooks/ApiRootContext.jsx";
import EmailCodeVerificationForm from "./EmailCodeVerificationForm.client.jsx";
import type { Props } from "./types";
import { redirect } from "../../services";
import FatalErrorScreen from "./FatalErrorScreen.client.js";
import type { MfaError } from "../../services/common";
enum Step {
  LOGIN,
  VERIFY,
  COMPLETE,
  /**
   * The user is in a state where the MFA module cannot continue because of a fatal error.
   */
  FATAL_ERROR,
}

export default function Authentication({
  apiRoot,
  content,
}: Readonly<{
  apiRoot: string;
  content: Props;
}>) {
  const [step, setStep] = useState<Step>(Step.LOGIN);
  const [fatalError, setFatalError] = useState<MfaError | undefined>(undefined);

  const handleVerifySuccess = () => {
    setStep(Step.COMPLETE);
    redirect(content.contextPath);
  };

  const resetFlow = () => {
    setStep(Step.LOGIN);
    setFatalError(undefined);
  }
  return (
    <ApiRootContext value={apiRoot}>
      {step === Step.FATAL_ERROR && fatalError && <FatalErrorScreen error={fatalError} onResetFlow={() =>resetFlow()} />}
      {step === Step.LOGIN && (
        <LoginForm
          content={content}
          onSuccess={() => {
            setStep(Step.VERIFY);
          }}
          onAllFactorsCompleted={() => {
            handleVerifySuccess();
          }}
          onFatalError={(error) => {
            setFatalError(error);
            setStep(Step.FATAL_ERROR);
          }}
        />
      )}
      {step === Step.VERIFY && (
        <EmailCodeVerificationForm
          content={content}
          onSuccess={() => {
            handleVerifySuccess();
          }}
          onFatalError={(error) => {
            setFatalError(error);
            setStep(Step.FATAL_ERROR);
          }}
        />
      )}
    </ApiRootContext>
  );
}
