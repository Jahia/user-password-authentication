import { type BaseError, type BaseSuccess, createError } from "./common";

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
              }
            }
          }
        }
      `,
      variables: { username, password },
    }),
  });
  const result = await response.json();
  const success = result?.data?.mfa?.initiate?.session?.initiated;
  if (success) {
    return {
      success: true,
    };
  } else {
    return createError(result?.data?.mfa?.initiate?.session?.error);
  }
}
