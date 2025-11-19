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
              prepareEmailCodeFactor {
                success
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
      `,
    }),
  });
  const result = await response.json();
  if (result?.data?.mfa?.factors?.prepareEmailCodeFactor?.success === true) {
    return {
      success: true,
      maskedEmail: result?.data?.mfa?.factors?.prepareEmailCodeFactor?.maskedEmail,
    };
  } else {
    return {
      success: false,
      error: {
        code: result?.data?.mfa?.factors?.prepareEmailCodeFactor?.error?.code || "unexpected_error",
        arguments: result?.data?.mfa?.factors?.prepareEmailCodeFactor?.error?.arguments || [],
      },
    };
  }
}
