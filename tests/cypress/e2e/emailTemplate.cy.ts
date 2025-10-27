import {deleteSite, deleteUser, enableModule} from '@jahia/cypress';
import {
    createSiteWithLoginPage,
    createUserForMFA,
    deleteAllEmails,
    getEmailBody,
    initiate,
    installMFAConfig,
    prepareEmailCodeFactor,
    I18N
} from './utils';
import {faker} from '@faker-js/faker';

describe('Tests for the email template', () => {
    let username: string;
    let password: string;
    let email: string;

    beforeEach(() => {
        installMFAConfig('email-template.yml'); // Tests might change the MFA config
        username = faker.internet.username();
        password = faker.internet.password();
        email = faker.internet.email();
        createUserForMFA(username, password, email);
        deleteAllEmails(); // Sanity cleanup
        cy.logout(); // Ensure to start with an unauthenticated session
    });

    afterEach(() => {
        deleteUser(username);
        deleteAllEmails();
    });

    it('Should have the content defined in the default template', () => {
        // GIVEN: A site with a server name
        const siteKey = faker.lorem.slug();
        createSiteWithLoginPage(siteKey, I18N.defaultLanguage);

        // WHEN: Initiating the MFA process
        initiate(username, password, siteKey);
        prepareEmailCodeFactor();

        // THEN: The email body should be as expected
        getEmailBody(email).then(body => {
            expect(body).to.match(/<p class="code">(\d{6})<\/p>/, 'the placeholder should be replaced by a code');
            expect(body).to.contain('<img src="https://cdfoqfniea.cloudimg.io/https://www.jahia.com/modules/jahiacom-templates/images/jahia-3x.png" alt="Powered by Jahia">');
        });

        // Cleanup
        deleteSite(siteKey);
    });

    it('Should allow email code template to be overwritten when authenticating against a specific site', () => {
        // GIVEN: A site with a server name and a module with a custom email template enabled
        const siteKey = faker.lorem.slug();
        const serverName = faker.internet.domainName();
        createSiteWithLoginPage(siteKey, I18N.defaultLanguage, serverName);
        enableModule('jahia-multi-factor-authentication-test-module-custom-mail-code-template', siteKey);

        // WHEN: Initiating the MFA process
        initiate(username, password, siteKey);
        prepareEmailCodeFactor();

        // THEN: The email body should contain the correct server name in the URL attributes
        getEmailBody(email).then(body => {
            expect(body).to.contain('<h2>This is a custom mail code template</h2>');
            expect(body).to.match(/<span class="code">(\d{6})<\/span>/, 'the placeholder should be replaced by a code');
            expect(body).to.contain(`<img src="http://${serverName}:8080/modules/jahia-multi-factor-authentication-test-module-custom-mail-code-template/img/poweredByJahia.png" alt="Powered by Jahia">`);
        });

        // Cleanup
        deleteSite(siteKey);
    });
});

