import type { BaseError, BaseSuccess } from "./common";

type VerifyEmailFactorResultSuccess = BaseSuccess;
type VerifyEmailFactorResultError = BaseError;
export type VerifyEmailFactorResult = VerifyEmailFactorResultSuccess | VerifyEmailFactorResultError;

export default async function verifyEmailCodeFactor(
  apiRoot: string,
  code: string,
): Promise<VerifyEmailFactorResult> {
  const response = await fetch(apiRoot, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: /* GraphQL */ `
        mutation verifyEmailCodeFactor($code: String!) {
          mfa {
            factors {
              emailCode {
                verify(code: $code) {
                  session {
                    state
                  }
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
      variables: { code },
    }),
  });
  const result = await response.json();
  if (result?.data?.mfa?.factors?.emailCode?.verify?.session?.state === "COMPLETED") {
    return { success: true };
  } else {
    return {
      success: false,
      error: {
        code: result?.data?.mfa?.factors?.emailCode?.verify?.error?.code || "unexpected_error",
        arguments: result?.data?.mfa?.factors?.emailCode?.verify?.error?.arguments || [],
      },
    };
  }
}
