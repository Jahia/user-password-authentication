import {addNode, createSite, deleteSite, publishAndWaitJobEnding} from '@jahia/cypress';
import {JContent} from '@jahia/jcontent-cypress/dist/page-object/jcontent';

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

    // Workaround: open JContent to trigger area creations (in particular the "authentication" one (of type "mfaui:authentication")
    // the switchToPageBuilder() gives enough time to the area creation to complete
    cy.login();
    JContent.visit(siteKey, 'en', `pages/${loginPageName}`).switchToPageBuilder();

    publishAndWaitJobEnding(`/sites/${siteKey}`);
}
