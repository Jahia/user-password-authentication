import { type BaseError, type BaseSuccess, createError } from "./common";

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
          upa {
            mfaFactors {
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
                    factorState(factorType: $factorType) {
                      prepared
                      error {
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
  const preparationResult = result?.data?.upa?.mfaFactors?.emailCode?.prepare;
  const success =
    preparationResult?.session?.factorState?.prepared &&
    !preparationResult?.session?.factorState?.error &&
    preparationResult?.maskedEmail;
  if (success) {
    return {
      success: true,
      maskedEmail: preparationResult.maskedEmail,
    };
  } else {
    return createError(
      preparationResult?.session?.error,
      preparationResult?.session?.factorState?.error,
    );
  }
}
