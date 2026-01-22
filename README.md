# User Password Authentication (UPA)

A multifactor-enabled User Password Authentication system for Jahia, providing secure login forms, GraphQL API, and customizable MFA flows.

## Features

- **Customizable login forms** with MFA support
- **GraphQL API** for authentication and user management
- **Email-based MFA** with customizable templates
- **Extensible architecture** for custom MFA factors

## Requirements

- Java 11+
- Maven 3+
- Jahia 8.2.3+

## Structure

This is a [Maven-managed monorepo](pom.xml) containing the following modules:
- [ui](ui): this module is a [JavaScript Module](https://academy.jahia.com/tutorials-get-started/front-end-developer/introduction) that contains all UI elements of the module
- [api](api): this module is a Java GraphQL API extension. It adds a `upa` namespace at the root of the `Query` and `Mutation` objects, and all the necessary implementation details to log users in. The simplest ways to create valid GraphQL queries in this namespace are:

    - Using the [GraphQL Playground](http://localhost:8080/modules/graphql-dxm-provider/tools/graphql-workspace.jsp)
    - Taking inspiration from the [GraphQL queries used by the login form](ui/src/services)

  The API is fully configurable under the `org.jahia.modules.upa.mfa.cfg` configuration key. [A safe default configuration is provided.](api/src/main/resources/META-INF/configurations/org.jahia.modules.upa.mfa.cfg)

  It supports custom MFA (multifactor authentication) factors, with examples available in [test-modules/mfa-custom-factor](test-modules/mfa-custom-factor).

- [test-modules](test-modules): sample code used by automated tests.

    - [test-modules/mfa-custom-factor](test-modules/mfa-custom-factor): implementation of a custom MFA factor.
    - [test-modules/mfa-custom-mail-code-template](test-modules/mfa-custom-mail-code-template): custom MFA code email template.
    - [test-modules/template-set](test-modules/template-set): very basic template set to place the login form inside an empty page.

## Development

To build this monorepo locally, run the following commands:

```bash
git clone https://github.com/Jahia/user-password-authentication.git
cd user-password-authentication
mvn package
```

To deploy the module on your running Jahia instance, refer to [this Jahia Academy page](https://academy.jahia.com/documentation/jahia-cms/jahia-8.2/developer/java-module-development/deploying-a-module-using-maven).

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

