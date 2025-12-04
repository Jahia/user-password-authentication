import {addNode, deleteSite, deleteUser, publishAndWaitJobEnding, revokeRoles} from '@jahia/cypress';
import {faker} from '@faker-js/faker';
import {
    createSiteWithLoginPage,
    createUserForMFA,
    deleteAllEmails,
    installMFAConfig
} from '../e2e.disabled/utils';

const SITE_KEY = 'sample-browsing';
const PAGE_NAME = 'protected';

describe('Browsing Tests', () => {
    let username: string;
    let password: string;
    let email: string;

    before(() => {
        createSiteWithLoginPage(SITE_KEY);
    });

    beforeEach(() => {
        installMFAConfig('sample-ui.yml'); // Tests might change the MFA config
        username = faker.internet.username();
        password = faker.internet.password();
        email = faker.internet.email();
        createUserForMFA(username, password, email);
        deleteAllEmails(); // Sanity cleanup
    });

    afterEach(() => {
        deleteUser(username);
        deleteAllEmails();
    });

    after(() => {
        deleteSite(SITE_KEY);
    });

    it('Should return a 404 on page when MFA is deployed', () => {
        const properties = [
            {name: 'jcr:title', value: 'Protected page (EN)', language: 'en'},
            {name: 'j:templateName', value: 'simple', language: 'en'}
        ];

        // Create and publish the protected page
        addNode({
            parentPathOrId: `/sites/${SITE_KEY}`,
            name: PAGE_NAME,
            primaryNodeType: 'jnt:page',
            properties: properties
        });
        publishAndWaitJobEnding(`/sites/${SITE_KEY}`, ['en']);

        const pageUrl = `/sites/${SITE_KEY}/${PAGE_NAME}.html`;

        // Verify page is accessible (200) before revoking permissions
        cy.logout();
        cy.request(pageUrl).then(response => {
            expect(response.status).to.eq(200);
            expect(response.headers['content-type']).to.include('text/html');
        });

        // Revoke guest access and republish
        revokeRoles(`/sites/${SITE_KEY}/${PAGE_NAME}`, ['reader'], 'guest', 'USER');
        publishAndWaitJobEnding(`/sites/${SITE_KEY}`, ['en']);

        // Verify page returns 404 after permissions revoked
        cy.logout();
        cy.request({
            url: pageUrl,
            failOnStatusCode: false
        }).then(response => {
            expect(response.status).to.eq(404);
            expect(response.body).to.not.include('Protected page');
        });
    });
});
