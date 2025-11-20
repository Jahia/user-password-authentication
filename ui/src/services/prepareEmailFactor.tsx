import type { BaseError, BaseSuccess } from "./common";

interface PrepareEmailFactorResultSuccess extends BaseSuccess {
  maskedEmail: string;
}
type PrepareEmailFactorResultError = BaseError;
export type PrepareEmailFactorResult =
  | PrepareEmailFactorResultSuccess
  | PrepareEmailFactorResultError;
export default async function prepareEmailFactor(
  apiRoot: string,
): Promise<PrepareEmailFactorResult> {
  const response = await fetch(apiRoot, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: /* GraphQL */ `
        mutation prepareEmailCodeFactor($factorType: String!) {
          mfa {
            factors {
              emailCode {
                prepare {
                  session {
                    error {
                      code
                      arguments {
                        name
                        value
                      }
                    }
                    suspensionDurationInSeconds
                    factorState(factorType: $factorType) {
                      prepared
                      preparationError {
                        code
                        arguments {
                          name
                          value
                        }
                      }
                    }
                  }
                  maskedEmail
                }
              }
            }
          }
        }
      `,
      variables: { factorType: "email_code" },
    }),
  });
  const result = await response.json();
  if (
    result?.data?.mfa?.factors?.emailCode?.prepare?.session?.factorState?.prepared &&
    !result?.data?.mfa?.factors?.emailCode?.prepare?.session?.factorState?.preparationError
  ) {
    return {
      success: true,
      maskedEmail: result?.data?.mfa?.factors?.emailCode?.prepare?.maskedEmail,
    };
  } else {
    const error = result?.data?.mfa?.factors?.emailCode?.prepare?.session?.factorState
      ?.preparationError ||
      result?.data?.mfa?.factors?.emailCode?.prepare?.session?.error || {
        code: "unexpected_error",
        arguments: [],
      };
    return {
      success: false,
      error: error,
      suspensionDurationInSeconds:
        result?.data?.mfa?.factors?.emailCode?.prepare?.session?.suspensionDurationInSeconds,
    };
  }
}
