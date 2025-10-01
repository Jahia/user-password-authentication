export interface PrepareEmailFactorResult {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}
export default async function prepareEmailFactor(
  apiRoot: string,
): Promise<PrepareEmailFactorResult> {
  const response = await fetch(apiRoot, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: /* GraphQL */ `
                mutation prepareFactor($factorType: String!) {
                    mfa {
                        prepareFactor(factorType: $factorType) {
                            success
                            error
                            sessionState
                            requiredFactors
                            completedFactors
                        }
                    }
                }
            `,
      variables: { factorType: "email_code" },
    }),
  });
  const result = await response.json();
  if (result?.data?.mfa?.prepareFactor?.success === true) {
    return { success: true };
  } else {
    return {
      success: false,
      error: {
        code: result?.data?.mfa?.prepareFactor?.error || "UNKNOWN_ERROR", // TODO we should probably introduce error codes
        message: result?.data?.mfa?.prepareFactor?.error || "Code verification failed",
      },
    };
  }
}
