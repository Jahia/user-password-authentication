/**
 * Base structure for the GraphQL APIs on successful responses.
 */
export interface BaseSuccess {
  success: true;
  remainingFactors: Array<string>;
}

export interface MfaError {
  code: string;
  arguments?: Array<{ name: string; value: string }>;
}
/**
 * Base structure for the GraphQL APIs on error response.
 * The error contains a `code` and an optional array of `arguments` (with a `name` and `value`)
 */

export interface BaseError {
  success: false;
  remainingFactors?: Array<string>; // TODO review
  error: MfaError;
  fatalError?: boolean;
}

/**
 * Creates an error response based on provided session and factor errors.
 * If neither session nor factor errors are provided, an "unexpected_error" error is returned with a fatal flag set to true.
 *
 * @param {MfaError} sessionError - The session-level error. This error takes precedence when present.
 * @param {MfaError} [factorError] - The factor-level error. Used if no session error is provided.
 * @return {BaseError} The constructed error response indicating success as false, the relevant error, and a flag indicating whether the error is fatal.
 */
export function createError(sessionError: MfaError, factorError?: MfaError): BaseError {
  if (sessionError) {
    // if a session error is present, it takes precedence over a factor error
    return {
      success: false,
      error: sessionError,
      fatalError: true,
    };
  }
  if (factorError) {
    return {
      success: false,
      error: factorError,
      fatalError: false,
    };
  }
  // if neither a session nor a factor error is present, the error is set to "unexpected_error" and considered fatal
  return {
    success: false,
    error: { code: "unexpected_error" },
    fatalError: true,
  };
}
