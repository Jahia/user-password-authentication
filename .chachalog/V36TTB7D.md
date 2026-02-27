---
# Allowed version bumps: patch, minor, major
user-password-authentication: patch
---

Set default login URL to empty in the Jahia UPA module configuration (#162)

By default, the `loginUrl` setting is now empty when the module is installed. This means its `LoginUrlProvider` is disabled by default, ensuring that existing installations are not affected by unexpected login redirections. To enable the custom login redirection, specify your desired login page URL in the configuration.
