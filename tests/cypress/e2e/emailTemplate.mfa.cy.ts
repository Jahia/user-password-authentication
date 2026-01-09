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
        createSiteWithLoginPage(siteKey);

        // WHEN: Initiating the MFA process
        initiate(username, password, siteKey);
        prepareEmailCodeFactor();

        // THEN: The email body should be as expected
        getEmailBody(email).then(body => {
            // Make sure the i18n properties are replaced
            expect(body).to.contain('<title>Authentication Code</title>');
            expect(body).to.contain('<p data-testid="email-message">Hello,<br/>Use the following code to complete your authentication:</p>');
            expect(body).to.contain('<p data-testid="validity">This code is valid for <strong>15 minutes</strong>.</p>');
            expect(body).to.contain('<p data-testid="footer-title">Didn\'t request this code?</p>');
            expect(body).to.contain('<p data-testid="footer-text">If you didn\'t request this code, secure your account immediately by <a href="https://support.jahia.com/">changing your password</a>.<br/>If you need assistance, <a href="https://support.jahia.com/">reach out to support</a><br/><br/>Regards,<br/>The Jahia Team</p>');
            // Make sure the placeholder for the code is replaced
            expect(body).to.match(/<span data-testid="code">(\d{6})<\/span>/, 'the placeholder should be replaced by a code');
        });

        // Cleanup
        deleteSite(siteKey);
    });

    it('Should allow email code template to be overwritten when authenticating against a specific site', () => {
        // GIVEN: A site with a server name and a module with a custom email template enabled
        const siteKey = faker.lorem.slug();
        const serverName = faker.internet.domainName();
        createSiteWithLoginPage(siteKey, [I18N.defaultLanguage], serverName);
        enableModule('user-password-authentication-mfa-custom-mail-code-template-test-module', siteKey);

        // WHEN: Initiating the MFA process
        initiate(username, password, siteKey);
        prepareEmailCodeFactor();

        // THEN: The email body should contain the correct server name in the URL attributes
        getEmailBody(email).then(body => {
            expect(body).to.contain('<h2>This is a custom mail code template</h2>');
            expect(body).to.match(/<span data-testid="code">(\d{6})<\/span>/, 'the placeholder should be replaced by a code');
            expect(body).to.contain(`<img src="http://${serverName}:8080/modules/user-password-authentication-mfa-custom-mail-code-template-test-module/img/poweredByJahia.png" alt="Powered by Jahia">`);
        });

        // Cleanup
        deleteSite(siteKey);
    });
});

