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

const TEST_USER: { [key: string]: string } = {username: 'test_mfa_user', password: 'password', email: 'email@example.com'};
const TEST_USER_NO_EMAIL: { [key: string]: string } = {username: 'test_mfa_user_without_email', password: 'password', email: ''};
const SPECIAL_USERS: Array<{ [key: string]: string }> = [
    {username: 'user_test', password: 'Maçif42', email: 'email1@example.com'},
    {username: 'رانيا', password: 'password', email: 'email2@example.com'},
    {username: 'エルヴィン', password: 'たいちょう', email: 'email3@example.com'},
    {username: 'étienne', password: 'たmYP@sswrd', email: 'email4@example.com'}
];

describe('Tests for the GraphQL APIs related to the EmailCodeFactorProvider', () => {
    before(() => {
        [TEST_USER, TEST_USER_NO_EMAIL, ...SPECIAL_USERS].forEach(user => createUserForMFA(user.username, user.password, user.email));
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
        [TEST_USER, TEST_USER_NO_EMAIL, ...SPECIAL_USERS].forEach(user => deleteUser(user.username));
        installMFAConfig('disabled.yml');
    });

    /**
     * Validates that a user can be authenticated using the email factor when correct credentials and code are provided
     * @param user The user object containing username, password and email
     * @note For readability sake, this function covers only happy-path steps without any negative assertions.
     *       Negative scenarios are covered inline in separate test cases below.
     */
    const validatePositiveMFAFlow = user => {
        // STEP 1: Initiate the MFA process
        cy.log('1- initiate');
        initiate(user.username, user.password);

        // STEP 2: Prepare the email factor
        cy.log('2- prepare');
        prepare('email_code');

        // STEP 3: Verify the email code factor
        cy.log('3- verification using the code received by email');
        getVerificationCode(user.email).then(code => {
            cy.log('Verification code received by email: ' + code);
            verifyEmailCodeFactor(code);
            assertIsLoggedIn(user.username);
        });
    };

    describe('Should be authenticated when correct credentials and code are provided', () => {
        // Test with the normal test user
        it(`Test with username: ${TEST_USER.username}`, () => {
            validatePositiveMFAFlow(TEST_USER);
        });

        // Tests with users having special characters in username and/or password
        // These ones are applicable only since Jahia 8.2.3.0 (https://github.com/Jahia/jahia-private/issues/3513) and that's why they are grouped here.
        // it() should be replaced with it.since() or similar once the support for it.since() is added in jahia-cypress, e.g.:
        // it.since('8.2.3.0', `Test with username: ${user.username}`, () => {
        // @see https://github.com/Jahia/jahia-cypress/issues/158 for implementation of it.since()
        SPECIAL_USERS.forEach(user => {
            it(`Test with username: ${user.username}`, () => {
                validatePositiveMFAFlow(user);
            });
        });
    });

    it('Should throw an error when the wrong verification code is entered', () => {
        cy.log('1- initiate');
        initiate(TEST_USER.username, TEST_USER.password);

        cy.log('2- prepare');
        prepare('email_code');

        cy.log('3- verification using a wrong code');
        getVerificationCode(TEST_USER.email).then(code => {
            const wrongCode = generateWrongCode(code);
            verifyEmailCodeFactor(wrongCode, 'Invalid verification code');
        });
    });

    it('Should throw an error when no verification code is entered', () => {
        cy.log('1- initiate');
        initiate(TEST_USER.username, TEST_USER.password);

        cy.log('2- prepare');
        prepare('email_code');

        cy.log('3- verification without a code');
        verifyEmailCodeFactor('', 'Verification failed: Verification code is required');
    });

    it('Should throw an error when the user does not have an email', () => {
        cy.log('1- initiate');
        initiate(TEST_USER_NO_EMAIL.username, TEST_USER_NO_EMAIL.password);

        cy.log('2- prepare');
        prepare('email_code', 'User does not have an email address configured');
    });

    it('Should throw an error when preparing without initiating the factor', () => {
        cy.log('2- prepare');
        prepare('email_code', 'Failed to prepare factor: No active MFA session found');
    });
});
