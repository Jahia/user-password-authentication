export interface CodeVerificationResult {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}
export default async function verifyEmailCodeFactor(
  apiRoot: string,
  code: string,
): Promise<CodeVerificationResult> {
  const response = await fetch(apiRoot, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: /* GraphQL */ `
        mutation verifyEmailCodeFactor($code: String!) {
          mfa {
            factors {
              verifyEmailCodeFactor(code: $code) {
                success
                error
                sessionState
                requiredFactors
                completedFactors
              }
            }
          }
        }
      `,
      variables: { code },
    }),
  });
  const result = await response.json();
  if (result?.data?.mfa?.factors?.verifyEmailCodeFactor?.success === true) {
    return { success: true };
  } else {
    return {
      success: false,
      error: {
        code: result?.data?.mfa?.factors?.verifyEmailCodeFactor?.error || "UNKNOWN_ERROR", // TODO we should probably introduce error codes
        message:
          result?.data?.mfa?.factors?.verifyEmailCodeFactor?.error || "Code verification failed",
      },
    };
  }
}
