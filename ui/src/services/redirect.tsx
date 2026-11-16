function getSafeRedirect(redirect: string | null, contextPath: string): string {
  const DANGEROUS_SCHEMES = ["javascript:", "data:", "vbscript:", "file:", "blob:"];

  if (!redirect) {
    return contextPath + "/";
  }

  try {
    const decoded = decodeURIComponent(redirect).toLowerCase();

    // Block any dangerous schemes anywhere in the string
    if (DANGEROUS_SCHEMES.some((scheme) => decoded.startsWith(scheme))) {
      return contextPath + "/";
    }

    // Resolve the target the way the browser does, and only allow the current origin
    const url = new URL(redirect, window.location.origin);
    if (url.origin === window.location.origin) {
      return url.href;
    }
  } catch (e) {
    console.warn("Invalid redirect URL", e);
  }

  return contextPath + "/";
}

/**
 * Redirects the user to a specified URL based on the given context path and optional redirect parameter.
 * The redirect parameter is validated to ensure it's a safe URL.
 *
 * @param {string} contextPath - The base context path used to validate the redirect parameter.
 * @return {void} This function does not return a value.
 */
export default function redirect(contextPath: string): void {
  const urlParams = new URLSearchParams(window.location.search);
  const redirectParam = urlParams.get("redirect");

  // Validate redirect URL
  window.location.href = getSafeRedirect(redirectParam, contextPath);
}
