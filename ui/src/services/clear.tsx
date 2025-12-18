import { type BaseError, type BaseSuccess, createError } from "./common";

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
  // once cleared, the session is expected to not be initiated anymore
  const success = result?.data?.mfa?.clear?.session?.initiated === false;
  if (success) {
    return {
      success: true,
    };
  } else {
    return createError(result?.data?.mfa?.clear?.session?.error);
  }
}
