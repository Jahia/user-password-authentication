---
# Allowed version bumps: patch, minor, major
user-password-authentication: patch
---

Enable automatic cache flushing when updating the login URL in the Jahia UPA module (#162)

When you update the `loginUrl` in the Jahia UPA module configuration, the system now automatically flushes the HTML output caches. This ensures that any pages previously rendered and cached using `org.jahia.services.render.URLGenerator.getLogin()` will immediately reflect the new login URL, preventing users from seeing outdated login pages.
