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
        mutation verifyEmailCodeFactor($code: String!, $factorType: String!) {
          mfa {
            factors {
              emailCode {
                verify(code: $code) {
                  session {
                    factorState(factorType: $factorType) {
                      verified
                      error {
                        code
                        arguments {
                          name
                          value
                        }
                      }
                    }
                    error {
                      code
                      arguments {
                        name
                        value
                      }
                    }
                    suspensionDurationInSeconds
                  }
                }
              }
            }
          }
        }
      `,
      variables: { code, factorType: "email_code" },
    }),
  });
  const result = await response.json();
  if (result?.data?.mfa?.factors?.emailCode?.verify?.session?.factorState?.verified) {
    return { success: true };
  } else {
    console.log(result);
    const error = result?.data?.mfa?.factors?.emailCode?.verify?.session?.factorState?.error ||
      result?.data?.mfa?.factors?.emailCode?.verify?.session?.error || {
        code: "unexpected_error",
        arguments: [],
      };
    return {
      success: false,
      error: error,
      suspensionDurationInSeconds:
        result?.data?.mfa?.factors?.emailCode?.verify?.session?.suspensionDurationInSeconds,
    };
  }
}
