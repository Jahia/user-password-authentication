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
      `,
      variables: { username, password },
    }),
  });
  const result = await response.json();
  if (result?.data?.mfa?.initiate?.session?.state === "INITIATED") {
    return {
      success: true,
    };
  } else {
    return {
      success: false,
      error: {
        code: result?.data?.mfa?.initiate?.error?.code || "unexpected_error",
        arguments: result?.data?.mfa?.initiate?.error?.arguments || [],
      },
    };
  }
}
