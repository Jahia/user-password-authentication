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
        mutation prepareEmailCodeFactor {
          mfa {
            factors {
              emailCode {
                prepare {
                  session {
                    state
                  }
                  maskedEmail
                  error {
                    code
                    arguments {
                      name
                      value
                    }
                  }
                }
              }
            }
          }
        }
      `,
    }),
  });
  const result = await response.json();
  if (result?.data?.mfa?.factors?.emailCode?.prepare?.session?.state === "PREPARED") {
    return {
      success: true,
      maskedEmail: result?.data?.mfa?.factors?.emailCode?.prepare?.maskedEmail,
    };
  } else {
    return {
      success: false,
      error: {
        code: result?.data?.mfa?.factors?.emailCode?.prepare?.error?.code || "unexpected_error",
        arguments: result?.data?.mfa?.factors?.emailCode?.prepare?.error?.arguments || [],
      },
    };
  }
}
