import { useMemo, useState } from "react";
import { useApiRoot } from "../../hooks/ApiRootContext";
import classes from "./component.module.css";
import ErrorMessage from "./ErrorMessage.client";
import { tError } from "../../services/i18n";
import { Trans, useTranslation } from "react-i18next";
import clear from "../../services/clear";
import type { MfaError } from "../../services/common";

interface FatalErrorScreenProps {
  error: MfaError;
}

const suspendedUserErrorCode = "suspended_user";
export default function FatalErrorScreen(props: Readonly<FatalErrorScreenProps>) {
  const { t } = useTranslation();
  const [inProgress, setInProgress] = useState(false);
  const apiRoot = useApiRoot();

  // Compute error message from props without side effects
  const errorMessage = useMemo(() => {
    if (props.error.code === suspendedUserErrorCode) {
      // special case for the suspension error message
      // Convert seconds to hours and round up for user-friendly display
      const suspensionDurationInSecondsArg = props.error.arguments?.find(
        (arg) => arg.name === "suspensionDurationInSeconds",
      )?.value;
      const suspensionDurationInHours = suspensionDurationInSecondsArg
        ? Math.ceil(Number(suspensionDurationInSecondsArg) / 3600)
        : 0;
      return t(suspendedUserErrorCode, { suspensionDurationInHours });
    } else {
      console.error("Unexpected error code:", props.error.code);
      return t(
        props.error.code,
        props.error.arguments?.reduce(
          (acc, arg) => ({ ...acc, [arg.name]: arg.value }),
          {} as Record<string, string>,
        ),
      );
    }
  }, [props.error]);

  const [message, setMessage] = useState(errorMessage);

  function restartLogin() {
    setInProgress(true);
    clear(apiRoot)
      .then((result) => {
        if (result.success) {
          // refresh the page
          globalThis.location.reload();
          setMessage("");
        } else {
          setMessage(tError(result.error));
        }
      })
      .finally(() => setInProgress(false));
  }

  return (
    <>
      {message && <ErrorMessage message={message} />}
      <hr />
      {!inProgress && (
        <div data-testid="additional-action" className={classes.additionalAction}>
          <a data-testid="restart-login" href="#" onClick={restartLogin}>
            <Trans i18nKey="suspended.restart_login" />
          </a>
        </div>
      )}
    </>
  );
}
