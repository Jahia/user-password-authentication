import type { BaseError, BaseSuccess } from "./common";

type InitiateResultSuccess = BaseSuccess;
type InitiateResultError = BaseError;
export type InitiateResult = InitiateResultSuccess | InitiateResultError;

export default async function initiate(
  apiRoot: string,
  username: string,
  password: string,
): Promise<InitiateResult> {
  const response = await fetch(apiRoot, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: /* GraphQL */ `
        mutation initiate($username: String!, $password: String!) {
          mfa {
            initiate(username: $username, password: $password) {
              session {
                initiated
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
      `,
      variables: { username, password },
    }),
  });
  const result = await response.json();
  console.log("result", result);
  if (result?.data?.mfa?.initiate?.session?.initiated) {
    return {
      success: true,
    };
  } else {
    const error = result?.data?.mfa?.initiate?.session?.error || { code: "unexpected_error" };
    return {
      success: false,
      error: error,
      suspensionDurationInSeconds:
        result?.data?.mfa?.initiate?.session?.suspensionDurationInSeconds,
    };
  }
}
