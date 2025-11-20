/**
 * Base structure for the GraphQL APIs on successful responses.
 */
export interface BaseSuccess {
  success: true;
}

/**
 * Base structure for the GraphQL APIs on error response.
 * The error contains a `code` and an optional array of `arguments` (with a `name` and `value`)
 */

export interface BaseError {
  success: false;
  error: {
    code: string;
    arguments: Array<{ name: string; value: string }>;
  };
  suspensionDurationInSeconds: number;
}
