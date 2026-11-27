---
# Allowed version bumps: patch, minor, major
user-password-authentication: patch
---

Fixed the sign-in of a user of a site. Once the password was verified, the user was looked up among the server users only, so the email code was never sent and the sign-in failed. The login page also sends its site when its URL starts with a language or a context path, such as `/fr/sites/<site>/login.html`.
