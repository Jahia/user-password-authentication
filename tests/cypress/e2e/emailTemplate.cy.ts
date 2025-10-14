import {deleteSite, deleteUser} from '@jahia/cypress';
import {
    createSiteWithLoginPage,
    createUserForMFA, DEFAULT_LANGUAGE,
    deleteAllEmails,
    getEmailBody,
    installMFAConfig,
    LOGIN_PAGE_NAME
} from './utils';
import {faker} from '@faker-js/faker';

const SITE_KEY = 'email-template';

describe('Tests for the email template', () => {
    let username: string;
    let password: string;
    let email: string;
    let serverName: string;
    before(() => {
        serverName = URL.parse(Cypress.env('JAHIA_URL')).hostname;
        createSiteWithLoginPage(SITE_KEY, DEFAULT_LANGUAGE, serverName);
    });

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

    after(() => {
        deleteSite(SITE_KEY);
    });

    it('Should resolve URLs attributes with server name', () => {
        cy.visit(`/sites/${SITE_KEY}/${LOGIN_PAGE_NAME}.html`);
        enterCredential(username, password);
        getEmailBody(email).then(body => {
            expect(body).to.contain(`<img src="${Cypress.env('JAHIA_URL')}/modules/jahia-multi-factor-authentication-api/img/poweredByJahia.png" alt="Powered by Jahia">`);
        });
    });
});

const enterCredential = (username: string, password: string) => {
    cy.log(String('Entering credentials: ' + username + ' / ' + password));
    cy.get('[data-testid="login-username"]').type(username);
    cy.get('[data-testid="login-password"]').type(password);
    cy.get('[data-testid="login-submit"]').click();
};

