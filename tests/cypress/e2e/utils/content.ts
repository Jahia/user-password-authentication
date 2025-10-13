import {addNode, createSite, deleteSite, enableModule, publishAndWaitJobEnding} from '@jahia/cypress';
import {JContent} from '@jahia/jcontent-cypress/dist/page-object/jcontent';
import 'cypress-iframe';
import gql from 'graphql-tag';

export const LOGIN_PAGE_NAME = 'myLoginPage'; // Should match the MFA configuration YAML files

export const DEFAULT_LANGUAGE = 'en';

export const DEFAULT_LOGIN_EMAIL_FIELD_LABEL = 'Email';
export const DEFAULT_LOGIN_PASSWORD_FIELD_LABEL = 'Password';
export const DEFAULT_LOGIN_SUBMIT_BUTTON_LABEL = 'Login';
export const DEFAULT_BELOW_PASSWORD_FIELD_HTML = '<a target="_blank" href="https://id.jahia.com/lost-password">Forgot password ?</a>';
export const DEFAULT_LOGIN_ADDITIONAL_ACTION_HTML = '<p>Don\'t have a Jahia Cloud account?</p><a target="_blank" href="https://id.jahia.com/home/registration.html">Create an account</a>';
export const DEFAULT_EMAIL_CODE_VERIFICATION_FIELD_LABEL = 'Verification code';
export const DEFAULT_EMAIL_CODE_VERIFICATION_SUBMIT_BUTTON_LABEL = 'Verify';
export const DEFAULT_EMAIL_CODE_VERIFICATION_ADDITIONAL_ACTION_HTML = '<p>Didn\'t receive the code?</p>';
export const DEFAULT_EMAIL_CODE_VERIFICATION_ADDITIONAL_ACTION_RESEND_LABEL = 'Resend code';

/**
 * Creates a new site with a login page. If a site matching this `siteKey` already exists, it is first deleted.
 * @param siteKey the site key to create
 * @param language site language
 */
export function createSiteWithLoginPage(siteKey: string, language = DEFAULT_LANGUAGE) {
    deleteSite(siteKey);
    createSite(siteKey, {
        locale: language,
        serverName: 'localhost',
        templateSet: 'jahia-multi-factor-authentication-test-module'
    });
    enableModule('jahia-multi-factor-authentication-ui', siteKey);
    addNode({
        parentPathOrId: `/sites/${siteKey}`,
        name: LOGIN_PAGE_NAME,
        primaryNodeType: 'jnt:page',
        properties: [
            {name: 'jcr:title', value: 'Login page', language: language},
            {name: 'j:templateName', value: 'mfa-authentication-page'}
        ]
    });

    // Workaround: open JContent edit iframe to trigger area creation
    cy.login();
    cy.visit(`/cms/editframe/default/${language}/sites/${siteKey}/${LOGIN_PAGE_NAME}.html?redirect=false`);
    cy.get('div[type="area"][areaType="mfaui:authentication"]').should('exist');
    publishAndWaitJobEnding(`/sites/${siteKey}`, [language]);
}

/**
 * JCR properties of the MFA Authentication Component.
 *
 * @see "mfaui:authentication" view (`ui/src/components/Authentication/default.server.tsx`)
 */
export interface AuthenticationProps {
    loginEmailFieldLabel?: string;
    loginPasswordFieldLabel?: string;
    loginSubmitButtonLabel?: string;
    loginBelowPasswordFieldHtml?: string;
    loginAdditionalActionHtml?: string;
    emailCodeVerificationFieldLabel?: string;
    emailCodeVerificationSubmitButtonLabel?: string;
    emailCodeVerificationAdditionalActionHtml?: string;
    emailCodeVerificationAdditionalActionResendLabel?: string;
}

/**
 * Updates login page properties for a specific site and language. It sends GraphQL mutations
 * to update the specified properties and verifies the updates on completion.
 *
 * @param {string} siteKey - The key identifying the site where the login page properties are being updated.
 * @param {AuthenticationProps} props - An object representing the properties to be updated, with keys as property names and values as property values.
 * @param {string} [language=DEFAULT_LANGUAGE] - The language in which the properties should be updated. Defaults to a predefined default language.
 * @return {void} This function does not return a value but performs actions such as updating the site properties and validating the updates.
 */
export function updateSiteLoginPageProps(siteKey: string, props: AuthenticationProps, language: string = DEFAULT_LANGUAGE): void {
    const propertyMutations = Object.entries(props)
        .map(([name, value], idx) => `
            mutate_${idx}: mutateProperty(name: "${name}") {
                setValue(language: "${language}", value: "${value}")
            }
        `)
        .join('\n');

    const query = gql`
        mutation {
            jcr {
                mutateNode(pathOrId: "/sites/${siteKey}/${LOGIN_PAGE_NAME}/authentication") {
                    ${propertyMutations}
                }
            }
        }
    `;

    cy.apollo({
        mutation: query
    }).then(response => {
        // For each property, check that the value has been updated
        Object.entries(props).forEach(([, value], idx) => {
            cy.log('prop: ', value);
            console.log('value', value);
            expect(response?.data?.jcr?.mutateNode?.[`mutate_${idx}`]?.setValue).to.be.true;
        });
    });
    publishAndWaitJobEnding(`/sites/${siteKey}`, [language]);
    cy.logout();
}

export function assertLoginStepContentMatches({
    emailLabel,
    passwordLabel,
    belowPasswordFieldHtml,
    submitButtonLabel,
    additionalActionHtml
}: {
    emailLabel: string;
    passwordLabel: string;
    belowPasswordFieldHtml: string;
    submitButtonLabel: string;
    additionalActionHtml: string;
}) {
    cy.get('form label[for="username"]').should('have.text', emailLabel);
    cy.get('form label[for="password"]').should('have.text', passwordLabel);
    cy.get('.belowPasswordField').should('have.html', belowPasswordFieldHtml);
    cy.get('form button[type="submit"]').should('have.text', submitButtonLabel);
    cy.get('.additionalAction').should('have.html', additionalActionHtml);
}

export function assertEmailCodeVerificationStepContentMatches({
    verificationCodeLabel,
    submitButtonLabel,
    additionalActionHtml
}: {
    verificationCodeLabel: string;
    submitButtonLabel: string;
    additionalActionHtml: string
}) {
    cy.get('form label[for="verificationCode"]').should('have.text', verificationCodeLabel);
    cy.get('form button[type="submit"]').should('have.text', submitButtonLabel);
    cy.get('.additionalAction').should('have.html', additionalActionHtml);
}

