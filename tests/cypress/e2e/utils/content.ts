import {addNode, createSite, deleteSite, publishAndWaitJobEnding} from '@jahia/cypress';

/**
 * Creates a new site with a login page. If a site matching this `siteKey` already exists, it is first deleted.
 * @param siteKey the site key to create
 * @param pageName the
 */
export function createSiteWithLoginPage(siteKey:string, pageName: string) {
    deleteSite(siteKey);
    createSite(siteKey, {
        locale: 'en',
        serverName: 'localhost',
        templateSet: 'jahia-multi-factor-authentication-test-module'
    });
    addNode({
        parentPathOrId: `/sites/${siteKey}`,
        name: pageName,
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
                        primaryNodeType: 'jnt:mfaForm'
                    }
                ]
            }
        ]
    });
    publishAndWaitJobEnding(`/sites/${siteKey}`);
}
