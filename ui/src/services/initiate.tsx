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
          upa {
            mfaInitiate(username: $username, password: $password) {
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
  const success = result?.data?.upa?.mfaInitiate?.session?.initiated;
  if (success) {
    return {
      success: true,
    };
  } else {
    return createError(result?.data?.upa?.mfaInitiate?.session?.error);
  }
}
