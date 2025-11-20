import type { BaseError, BaseSuccess } from "./common";

type ClearResultSuccess = BaseSuccess;
type ClearResultError = BaseError;
export type ClearResult = ClearResultSuccess | ClearResultError;

export default async function clear(apiRoot: string): Promise<ClearResult> {
  const response = await fetch(apiRoot, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: /* GraphQL */ `
        mutation clear {
          mfa {
            clear {
              session {
                initiated
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
  console.log("result", result);
  if (result?.data?.mfa?.clear?.session?.initiated === false) {
    return {
      success: true,
    };
  } else {
    return {
      success: false,
      error: {
        code: result?.data?.mfa?.clear?.error?.code || "unexpected_error",
        arguments: result?.data?.mfa?.clear?.error?.arguments || [],
      },
      suspensionDurationInSeconds: result?.data?.mfa?.clear?.session?.suspensionDurationInSeconds,
    };
  }
}
