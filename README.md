# User Password Authentication (UPA)

This repository contains all the pieces of a multifactor-enabled User Password Authentication system, packaged as several Jahia Modules.

## Structure

This is a [Maven-managed monorepo](pom.xml) containing the following modules:

- [ui](ui): this module is a [JavaScript Module](https://academy.jahia.com/tutorials-get-started/front-end-developer/introduction) that contains all UI elements of the module:

    - A login form:

      (screenshot)

      This login form is the rendition of a `upaui:authentication` node, to brand the form to your colors, you can create your own views of this node type. This repo is under a [permissive license](LICENSE) and can be used a base for your custom code.

    - A MFA (multifactor authentication) code email:

      (screenshot)

      This email is the rendition of a `upa:mfaMailCode` node, which can also be customized to your brand colors.

- [api](api): this module a Java GraphQL API extension. It adds a `upa` namespace at the root of the `Query` and `Mutation` objects, and all the necessary implementation details to log users in. The simplest ways to create valid GraphQL queries in this namespace are:

    - Using the [GraphQL Playground](http://localhost:8080/modules/graphql-dxm-provider/tools/graphql-workspace.jsp)
    - Taking inspiration from the [GraphQL queries used by the login form](ui/src/services)

  The API is fully configurable under the `org.jahia.modules.upa.mfa.cfg` configuration key. [A safe default configuration is provided.](api/src/main/resources/META-INF/configurations/org.jahia.modules.upa.mfa.cfg)

  It supports custom MFA (multifactor authentication) factors, see below.

- [test-modules](test-modules): sample code used by automated tests.

    - [test-modules/mfa-custom-factor](test-modules/mfa-custom-factor): implementation of a custom MFA factor.
    - [test-modules/mfa-custom-mail-code-template](test-modules/mfa-custom-mail-code-template): custom MFA code email template.
    - [test-modules/template-set](test-modules/template-set): very basic template set to place the login form inside an empty page.

## Development

You'll need a working Java+Maven environment.

To build this monorepo locally, run the following commands:

```bash
# Create a local copy
git clone https://github.com/Jahia/user-password-authentication.git

cd user-password-authentication

# Build all modules
mvn package
```
