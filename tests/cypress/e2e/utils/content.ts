import {addNode, createSite, deleteSite, enableModule, publishAndWaitJobEnding} from '@jahia/cypress';
import 'cypress-iframe';
import gql from 'graphql-tag';
import {LoginStep} from '../pages';
import {I18N} from './i18n';

/**
 * Returns the URL of the login page for the given site and language.
 * Example: `/sites/dummy/myLoginPage.html` or, if `language` is specified, `/en/sites/dummy/myLoginPage.html`
 * @param siteKey the site key
 * @param language the language
 */
export function getLoginPageURL(siteKey: string, language: string = undefined) {
    return `${language ? '/' + language : ''}/sites/${siteKey}/${LoginStep.PAGE_NAME}.html`;
}

/**
 * Creates a new site with a login page. If a site matching this `siteKey` already exists, it is first deleted.
 * @param siteKey the site key to create
 * @param languages the languages to create for the site, the first one is the default one
 * @param serverName the server name to use for the site
 */
export function createSiteWithLoginPage(siteKey: string, languages = [I18N.defaultLanguage], serverName = 'localhost') {
    deleteSite(siteKey);
    const siteLanguage = languages[0];
    const languagesAsString = languages.join(',');
    createSite(siteKey, {
        locale: siteLanguage,
        languages: languagesAsString,
        serverName: serverName,
        templateSet: 'user-password-authentication-template-set-test-module'
    });
    enableModule('user-password-authentication-ui', siteKey);
    const titleProps = languages.map(language => ({name: 'jcr:title', value: `Login page (${language})`, language: language}));
    const properties = [...titleProps, {name: 'j:templateName', value: 'simple'}];
    addNode({
        parentPathOrId: `/sites/${siteKey}`,
        name: LoginStep.PAGE_NAME,
        primaryNodeType: 'jnt:page',
        properties: properties
    });
    // Add login component to the page
    // Area
    addNode({
        parentPathOrId: `/sites/${siteKey}/${LoginStep.PAGE_NAME}`,
        name: 'pagecontent',
        primaryNodeType: 'jnt:contentList',
        properties: []
    });
    // Login component
    addNode({
        parentPathOrId: `/sites/${siteKey}/${LoginStep.PAGE_NAME}/pagecontent`,
        name: 'authentication',
        primaryNodeType: 'upaui:authentication',
        properties: []
    });

    publishAndWaitJobEnding(`/sites/${siteKey}`, [siteLanguage]);
}

/**
 * JCR properties of the UPA Authentication Component.
 *
 * @see "upaui:authentication" view (`ui/src/components/Authentication/default.server.tsx`)
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
                mutateNode(pathOrId: "/sites/${siteKey}/${LoginStep.PAGE_NAME}/pagecontent/authentication") {
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
