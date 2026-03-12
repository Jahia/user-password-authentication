# user-password-authentication Changelog

## 0.0.1

* Enable automatic cache flushing when updating the login URL in the Jahia UPA module (#162)

  When you update the `loginUrl` in the Jahia UPA module configuration, the system now automatically flushes the HTML output caches. This ensures that any pages previously rendered and cached using `org.jahia.services.render.URLGenerator.getLogin()` will immediately reflect the new login URL, preventing users from seeing outdated login pages.

* Set default login URL to empty in the Jahia UPA module configuration (#162)

  By default, the `loginUrl` setting is now empty when the module is installed. This means its `LoginUrlProvider` is disabled by default, ensuring that existing installations are not affected by unexpected login redirections. To enable the custom login redirection, specify your desired login page URL in the configuration.

* Remove margin for below password field (#165)
