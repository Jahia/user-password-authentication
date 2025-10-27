import {addNode, createSite, deleteSite, enableModule, publishAndWaitJobEnding} from '@jahia/cypress';
import 'cypress-iframe';
import gql from 'graphql-tag';
import {LoginStep} from '../pages/stepLogin';
import {I18N} from './i18n';

/**
 * Creates a new site with a login page. If a site matching this `siteKey` already exists, it is first deleted.
 * @param siteKey the site key to create
 * @param language site language
 * @param serverName the server name to use for the site
 */
export function createSiteWithLoginPage(siteKey: string, language = I18N.defaultLanguage, serverName = 'localhost') {
    deleteSite(siteKey);
    createSite(siteKey, {
        locale: language,
        serverName: serverName,
        templateSet: 'jahia-multi-factor-authentication-test-module'
    });
    enableModule('jahia-multi-factor-authentication-ui', siteKey);
    addNode({
        parentPathOrId: `/sites/${siteKey}`,
        name: LoginStep.PAGE_NAME,
        primaryNodeType: 'jnt:page',
        properties: [
            {name: 'jcr:title', value: 'Login page', language: language},
            {name: 'j:templateName', value: 'mfa-authentication-page'}
        ]
    });

    // Workaround: open JContent edit iframe to trigger area creation
    cy.login();
    cy.visit(`/cms/editframe/default/${language}/sites/${siteKey}/${LoginStep.PAGE_NAME}.html?redirect=false`);
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
 * @param {string} [language=I18N.defaultLanguage] - The language in which the properties should be updated. Defaults to a predefined default language.
 * @return {void} This function does not return a value but performs actions such as updating the site properties and validating the updates.
 */
export function updateSiteLoginPageProps(siteKey: string, props: AuthenticationProps, language: string = I18N.defaultLanguage): void {
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
                mutateNode(pathOrId: "/sites/${siteKey}/${LoginStep.PAGE_NAME}/authentication") {
                    ${propertyMutations}
                }
            }
        }
    `;

    cy.apollo({
        mutation: query
    }).then(response => {
        // For each property, check that the value has been updated
        Object.entries(props).forEach((_, idx) => {
            expect(response?.data?.jcr?.mutateNode?.[`mutate_${idx}`]?.setValue).to.be.true;
        });
    });
    publishAndWaitJobEnding(`/sites/${siteKey}`, [language]);
    cy.logout();
}
