import {addNode, createSite, deleteSite, publishAndWaitJobEnding} from '@jahia/cypress';

/**
 * Creates a new site with a login page. If a site matching this `siteKey` already exists, it is first deleted.
 * @param siteKey the site key to create
 * @param loginPageName name of the login page to create
 * @param loginFormNodeType node type of the MFA form to use on the login page
 */
export function createSiteWithLoginPage(siteKey:string, loginPageName: string, loginFormNodeType: string) {
    deleteSite(siteKey);
    createSite(siteKey, {
        locale: 'en',
        serverName: 'localhost',
        templateSet: 'jahia-multi-factor-authentication-test-module'
    });
    addNode({
        parentPathOrId: `/sites/${siteKey}`,
        name: loginPageName,
        primaryNodeType: 'jnt:page',
        properties: [
            {name: 'jcr:title', value: 'Login page', language: 'en'},
            {name: 'j:templateName', value: 'simple'}
        ],
        children: [
            {
                name: 'pagecontent',
                primaryNodeType: 'jnt:contentList',
                children: [
                    {
                        name: 'mfaForm',
                        primaryNodeType: loginFormNodeType
                    }
                ]
            }
        ]
    });
    publishAndWaitJobEnding(`/sites/${siteKey}`);
}
