import {addNode, createSite, deleteSite, publishAndWaitJobEnding} from '@jahia/cypress';
import {JContent} from '@jahia/jcontent-cypress/dist/page-object/jcontent';
import 'cypress-iframe';

/**
 * Creates a new site with a login page. If a site matching this `siteKey` already exists, it is first deleted.
 * @param siteKey the site key to create
 * @param loginPageName name of the login page to create
 */
export function createSiteWithLoginPage(siteKey:string, loginPageName: string) {
    deleteSite(siteKey);
    createSite(siteKey, {
        locale: 'en',
        serverName: 'localhost',
        templateSet: 'jahia-multi-factor-authentication-ui'
    });
    addNode({
        parentPathOrId: `/sites/${siteKey}`,
        name: loginPageName,
        primaryNodeType: 'jnt:page',
        properties: [
            {name: 'jcr:title', value: 'Login page', language: 'en'},
            {name: 'j:templateName', value: 'mfa-authentication-page'}
        ]
    });

    // Workaround: open JContent to trigger area creations
    // then wait for the "mfaui:authentication" area to be created
    cy.login();
    JContent.visit(siteKey, 'en', `pages/${loginPageName}`);
    cy.iframe('#page-builder-frame-1').within(() => {
        cy.get('div[type="area"][areaType="mfaui:authentication"]').should('be.visible');
    });

    publishAndWaitJobEnding(`/sites/${siteKey}`);
}
