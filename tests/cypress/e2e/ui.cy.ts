import {deleteSite, deleteUser} from '@jahia/cypress';
import {
    assertIsLoggedIn,
    createSiteWithLoginPage,
    createUserForMFA,
    deleteAllEmails,
    generateWrongCode,
    getVerificationCode,
    installMFAConfig
} from './utils';
import {faker} from '@faker-js/faker';

const SITE_KEY = 'sample-ui';

describe('Tests for the UI module', () => {
    let username: string;
    let password: string;
    let email: string;
    before(() => {
        createSiteWithLoginPage(SITE_KEY, 'myLoginPage'); // Should match what's configured in mfa-configuration/sample-ui.yml
        installMFAConfig('sample-ui.yml');
    });

    beforeEach(() => {
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

    it('Should be authenticated when following all the MFA steps', () => {
        triggerRedirectToLoginPage();
        enterCredential(username, password);
        selectEmailFactor();
        getVerificationCode(email).then(code => {
            cy.log('Verification code received by email: ' + code);
            enterVerificationCode(code);
            assertIsSuccessMessageDisplayed();
            assertIsLoggedIn(username);
        });
    });

    it('Should display an error when an invalid password is entered', () => {
        triggerRedirectToLoginPage();
        enterCredential(username, 'invalidPassword');
        cy.get('[data-testid="error-message"]').should(
            'contain',
            'Invalid username or password'
        );
    });

    it('Should display an error when an invalid verification code is entered', () => {
        triggerRedirectToLoginPage();
        enterCredential(username, password);
        selectEmailFactor();
        cy.log('Entering an invalid verification code');
        getVerificationCode(email).then(code => {
            const wrongCode = generateWrongCode(code);
            enterVerificationCode(wrongCode);
            cy.get('[data-testid="error-message"]').should(
                'contain',
                'Invalid verification code'
            );
        });
    });
});
const triggerRedirectToLoginPage = () => {
    cy.visit('/jahia', {failOnStatusCode: false});
    cy.url().should('contain', `/sites/${SITE_KEY}/myLoginPage.html`);
};

const enterCredential = (username: string, password: string) => {
    cy.log(String('Entering credentials: ' + username + ' / ' + password));
    cy.get('[data-testid="login-username"]').type(username);
    cy.get('[data-testid="login-password"]').type(password);
    cy.get('[data-testid="login-submit"]').click();
};

const selectEmailFactor = () => {
    cy.log('Selecting the email factor');
    // Not supported yet, skipping for now
    // TODO once we add the support for selecting the email factor from the list of available factors
    //   cy.get('[data-testid="available-factors"]').should('be.visible');
    //   cy.get('[data-testid="email_code-select-factor-button"]').click();
};

const enterVerificationCode = (code: string) => {
    cy.get('[data-testid="verification-code"]').type(code);
    cy.get('[data-testid="verification-submit"]').click();
};

const assertIsSuccessMessageDisplayed = () => {
    cy.get('[data-testid="success-message"]').should('be.visible');
};
