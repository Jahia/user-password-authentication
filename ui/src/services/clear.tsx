interface ClearResultSuccess {
  success: true;
}
interface ClearResultError {
  success: false;
  error: {
    code: string;
    arguments: Array<{ name: string; value: string }>;
  };
}
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
              success
            }
          }
        }
      `,
    }),
  });
  const result = await response.json();
  if (result?.data?.mfa?.clear?.success === true) {
    return { success: true };
  } else {
    return {
      success: false,
      error: {
        code: result?.data?.mfa?.clear?.error?.code || "unexpected_error",
        arguments: result?.data?.mfa?.clear?.error?.arguments || [],
      },
    };
  }
}
