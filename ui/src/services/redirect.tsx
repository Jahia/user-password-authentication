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

    // Only allow relative URLs (starting with a single /, not //)
    if (redirect.startsWith("/") && !redirect.startsWith("//")) {
      return redirect;
    }

    // If it's an absolute URL, only allow if it's for the same origin
    const url = new URL(redirect, window.location.origin);
    if (url.origin === window.location.origin) {
      return url.pathname + url.search + url.hash;
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
export function redirect(contextPath: string): void {
  const urlParams = new URLSearchParams(window.location.search);
  const redirectParam = urlParams.get("redirect");

  // Validate redirect URL
  const safeRedirect = getSafeRedirect(redirectParam, contextPath);
  console.log("safeRedirect", safeRedirect);
  window.location.href = safeRedirect;
}
