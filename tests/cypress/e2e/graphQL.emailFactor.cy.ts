import {deleteUser} from '@jahia/cypress';
import {
    assertIsLoggedIn,
    assertIsNotLoggedIn,
    createUserForMFA,
    deleteAllEmails,
    generateWrongCode,
    getVerificationCode,
    initiate,
    installMFAConfig,
    prepare,
    verifyEmailCodeFactor
} from './utils';

const USERNAME = 'test_mfa_user';
const PASSWORD = 'password';
const EMAIL = 'testmfauser@example.com';

describe('Tests for the GraphQL APIs related to the EmailCodeFactorProvider', () => {
    before(() => {
        createUserForMFA(USERNAME, PASSWORD, EMAIL);
        installMFAConfig('fake.yml');
    });

    beforeEach(() => {
        deleteAllEmails(); // Sanity cleanup
        cy.logout(); // Ensure to start with an unauthenticated session
        assertIsNotLoggedIn(); // Sanity check
    });

    afterEach(() => {
        deleteAllEmails();
    });

    after(() => {
        deleteUser(USERNAME);
        installMFAConfig('disabled.yml');
    });

    it('Should be authenticated when correct credentials and code are provided', () => {
        cy.log('1- initiate');
        initiate(USERNAME, PASSWORD);

        cy.log('2- prepare');
        prepare('email_code');

        cy.log('3- verification using the code received by email');
        getVerificationCode(EMAIL).then(code => {
            cy.log('Verification code received by email: ' + code);
            verifyEmailCodeFactor(code);
            assertIsLoggedIn(USERNAME);
        });
    });

    it('Should throw an error when the user does not have an email', () => {
        const userNameWithoutEmail = 'test_mfa_user_without_email';
        const passwordWithoutEmail = 'password';
        createUserForMFA(userNameWithoutEmail, passwordWithoutEmail);

        cy.log('1- initiate');
        initiate(userNameWithoutEmail, passwordWithoutEmail);

        cy.log('2- prepare');
        prepare('email_code', 'User does not have an email address configured');
        deleteUser(userNameWithoutEmail);
    });

    it('Should throw an error when the wrong verification code is entered', () => {
        cy.log('1- initiate');
        initiate(USERNAME, PASSWORD);

        cy.log('2- prepare');
        prepare('email_code');

        cy.log('3- verification using a wrong code');
        getVerificationCode(EMAIL).then(code => {
            const wrongCode = generateWrongCode(code);
            verifyEmailCodeFactor(wrongCode, 'Invalid verification code');
        });
    });

    it('Should throw an error when no verification code is entered', () => {
        cy.log('1- initiate');
        initiate(USERNAME, PASSWORD);

        cy.log('2- prepare');
        prepare('email_code');

        cy.log('3- verification without a code');
        verifyEmailCodeFactor('', 'Verification failed: Verification code is required');
    });

    it('Should throw an error when preparing without initiating the factor', () => {
        cy.log('2- prepare');
        prepare('email_code', 'Failed to prepare factor: No active MFA session found');
    });
});
