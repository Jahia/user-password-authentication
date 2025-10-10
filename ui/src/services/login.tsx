export interface LoginResult {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

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
              error
              sessionState
              requiredFactors
              completedFactors
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
        code: result?.data?.mfa?.initiate?.error || "UNKNOWN_ERROR", // TODO we should probably introduce error codes
        message: result?.data?.mfa?.initiate?.error || "Login failed",
      },
    };
  }
}
