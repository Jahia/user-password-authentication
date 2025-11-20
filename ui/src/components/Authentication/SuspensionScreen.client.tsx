import { useState } from "react";
import { useApiRoot } from "../../hooks/ApiRootContext";
import ErrorMessage from "./ErrorMessage.client";
import { tError } from "../../services/i18n";
import { Trans } from "react-i18next";
import { t } from "i18next";
import clear from "../../services/clear";

interface SuspensionScreenProps {
  suspensionDurationInSeconds: number;
}
export default function SuspensionScreen(props: SuspensionScreenProps) {
  const [error, setError] = useState(() =>
    t("suspended_user", { suspensionDurationInHours: props.suspensionDurationInSeconds }),
  );
  const [inProgress, setInProgress] = useState(false);
  const apiRoot = useApiRoot();

  function restartLogin() {
    setInProgress(true);
    clear(apiRoot)
      .then((result) => {
        if (result.success) {
          // refresh the page
          window.location.reload();
          setError("");
        } else {
          setError(tError(result.error));
        }
      })
      .finally(() => setInProgress(false));
  }

  return (
    <>
      {error && <ErrorMessage message={error} />}
      <hr />
      {!inProgress && (
        <div className={"additionalAction"}>
          <a data-testid="restart-login" href="#" onClick={restartLogin}>
            <Trans i18nKey="suspended.restart_login" />
          </a>
        </div>
      )}
    </>
  );
}
