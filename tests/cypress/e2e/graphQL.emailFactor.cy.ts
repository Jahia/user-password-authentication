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

const TEST_USERS: Array<{ [key: string]: string }> = [
    {username: 'test_mfa_user', password: 'password', email: 'email1@example.com', type: 'valid'},
    {username: 'user_test', password: 'Maçif42', email: 'email2@example.com', type: 'valid'},
    {username: 'رانيا', password: 'password', email: 'email3@example.com', type: 'valid'},
    {username: 'エルヴィン', password: 'たいちょう', email: 'email4@example.com', type: 'valid'},
    {username: 'étienne', password: 'たmYP@sswrd', email: 'email5@example.com', type: 'valid'},
    {username: 'test_mfa_user_without_email', password: 'password', email: '', type: 'no_email'}
];

describe('Tests for the GraphQL APIs related to the EmailCodeFactorProvider', () => {
    before(() => {
        TEST_USERS.forEach(user => createUserForMFA(user.username, user.password, user.email));
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
        TEST_USERS.forEach(user => deleteUser(user.username));
        installMFAConfig('disabled.yml');
    });

    describe('Should be authenticated when correct credentials and code are provided', () => {
        TEST_USERS.filter(user => user.type === 'valid').forEach(user => {
            it(`Test with username: ${user.username}`, () => {
                cy.log('1- initiate');
                initiate(user.username, user.password);

                cy.log('2- prepare');
                prepare('email_code');

                cy.log('3- verification using the code received by email');
                // eslint-disable-next-line max-nested-callbacks
                getVerificationCode(user.email).then(code => {
                    cy.log('Verification code received by email: ' + code);
                    verifyEmailCodeFactor(code);
                    assertIsLoggedIn(user.username);
                });
            });
        });
    });

    it('Should throw an error when the wrong verification code is entered', () => {
        cy.log('1- initiate');
        initiate(TEST_USERS[0].username, TEST_USERS[0].password);

        cy.log('2- prepare');
        prepare('email_code');

        cy.log('3- verification using a wrong code');
        getVerificationCode(TEST_USERS[0].email).then(code => {
            const wrongCode = generateWrongCode(code);
            verifyEmailCodeFactor(wrongCode, 'Invalid verification code');
        });
    });

    it('Should throw an error when no verification code is entered', () => {
        cy.log('1- initiate');
        const validUser = TEST_USERS.find(user => user.type === 'valid');
        initiate(validUser.username, validUser.password);

        cy.log('2- prepare');
        prepare('email_code');

        cy.log('3- verification without a code');
        verifyEmailCodeFactor('', 'Verification failed: Verification code is required');
    });

    it('Should throw an error when the user does not have an email', () => {
        cy.log('1- initiate');
        const userNoEmail = TEST_USERS.find(user => user.type === 'no_email');
        initiate(userNoEmail.username, userNoEmail.password);

        cy.log('2- prepare');
        prepare('email_code', 'User does not have an email address configured');
        deleteUser(userNoEmail.username);
    });

    it('Should throw an error when preparing without initiating the factor', () => {
        cy.log('2- prepare');
        prepare('email_code', 'Failed to prepare factor: No active MFA session found');
    });
});
