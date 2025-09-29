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

const USERNAME = 'test_mfa_sample-ui';
const PASSWORD = 'password';
const EMAIL = 'testmfasampleuiuser@example.com';
const SITE_KEY = 'sample-ui';
const LOGIN_FORM_NODE_TYPE = 'sampleui:sampleMfaForm';

describe('Tests for the Sample UI module', () => {
    before(() => {
        createSiteWithLoginPage(SITE_KEY, 'myLoginPage', LOGIN_FORM_NODE_TYPE); // Should match what's configured in mfa-configuration/sample-ui.yml
        createUserForMFA(USERNAME, PASSWORD, EMAIL);
        installMFAConfig('sample-ui.yml');
    });

    beforeEach(() => {
        deleteAllEmails(); // Sanity cleanup
        cy.logout(); // Ensure to start with an unauthenticated session
    });

    afterEach(() => {
        deleteAllEmails();
    });

    after(() => {
        deleteUser(USERNAME);
        deleteSite(SITE_KEY);
    });

    it('Should be authenticated when following all the MFA steps', () => {
        triggerRedirectToLoginPage();
        enterCredential(USERNAME, PASSWORD);
        selectEmailFactor();
        getVerificationCode(EMAIL).then(code => {
            cy.log('Verification code received by email: ' + code);
            enterVerificationCode(code);
            assertIsLoggedIn(USERNAME);
        });
    });

    it('Should display an error when an invalid password is entered', () => {
        triggerRedirectToLoginPage();
        enterCredential(USERNAME, 'invalidPassword');
        cy.get('[data-testid="error-message"]').should('contain', 'Invalid username or password');
    });

    it('Should display an error when an invalid verification code is entered', () => {
        triggerRedirectToLoginPage();
        enterCredential(USERNAME, PASSWORD);
        selectEmailFactor();
        cy.log('Entering an invalid verification code');
        getVerificationCode(EMAIL).then(code => {
            const wrongCode = generateWrongCode(code);
            enterVerificationCode(wrongCode);
            cy.get('[data-testid="error-message"]').should('contain', 'Invalid verification code');
        });
    });
});
const triggerRedirectToLoginPage = () => {
    cy.visit('/jahia/dashboard', {failOnStatusCode: false});
    cy.url().should('contain', `/sites/${SITE_KEY}/myLoginPage.html`);
};

const enterCredential = (username:string, password:string) => {
    cy.log(String('Entering credentials: ' + username + ' / ' + password));
    cy.get('[data-testid="login-username"]').type(username);
    cy.get('[data-testid="login-password"]').type(password);
    cy.get('[data-testid="login-submit"]').click();
};

const selectEmailFactor = () => {
    cy.log('Selecting the email factor');
    cy.get('[data-testid="available-factors"]').should('be.visible');
    cy.get('[data-testid="email_code-select-factor-button"]').click();
};

const enterVerificationCode = (code: string) => {
    cy.get('[data-testid="verification-code"]').type(code);
    cy.get('[data-testid="verification-submit"]').click();
};
