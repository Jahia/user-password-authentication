import type { BaseError, BaseSuccess } from "./common";

type LoginResultSuccess = BaseSuccess;
type LoginResultError = BaseError;
export type LoginResult = LoginResultSuccess | LoginResultError;

export default async function login(
  apiRoot: string,
  username: string,
  password: string,
): Promise<LoginResult> {
  const response = await fetch(apiRoot, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: /* GraphQL */ `
        mutation initiate($username: String!, $password: String!) {
          mfa {
            initiate(username: $username, password: $password) {
              success
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
  if (result?.data?.mfa?.initiate?.success === true) {
    return { success: true };
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
