import {deleteUser, getJahiaVersion} from '@jahia/cypress';
import {compare} from 'compare-versions';
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
import {faker} from '@faker-js/faker';

let globalUsername = '';

interface TestUser {
    username: () => string;
    password: string;
    email: string;
}

const TEST_USER: TestUser = {username: () => globalUsername, password: 'password', email: 'email@example.com'};
const TEST_USER_NO_EMAIL: TestUser = {username: () => 'test_mfa_user_without_email', password: 'password', email: ''};
const SPECIAL_USERS: Array<TestUser> = [
    {username: () => 'user_test', password: 'Maçif42', email: 'email1@example.com'},
    {username: () => 'رانيا', password: 'password', email: 'email2@example.com'},
    {username: () => 'エルヴィン', password: 'たいちょう', email: 'email3@example.com'},
    {username: () => 'étienne', password: 'たmYP@sswrd', email: 'email4@example.com'}
];
const VERSION_VAR = '_JAHIA_VERSION_';

describe('Tests for the GraphQL APIs related to the EmailCodeFactorProvider', () => {
    before(() => {
        // Create special users first as they are not needed for each test
        [TEST_USER_NO_EMAIL, ...SPECIAL_USERS].forEach(user => createUserForMFA(user.username(), user.password, user.email));
        installMFAConfig('fake.yml');

        // Store the Jahia version in an environment variable to be used in tests
        getJahiaVersion().then(jahiaVersion => {
            Cypress.env(VERSION_VAR, jahiaVersion.release.replace('-SNAPSHOT', ''));
        });
    });

    beforeEach(() => {
        // Generating a different username allows starting several MFA flows (without ending) in successive tests.
        globalUsername = faker.internet.username({firstName: 'emailFactorUser'});
        cy.log(`user for the test ${globalUsername}`);
        createUserForMFA(TEST_USER.username(), TEST_USER.password, TEST_USER.email); // Create for each test as the user might have been updated by a previous test (with mfa:suspendedUser mixin)
        deleteAllEmails(); // Sanity cleanup
        cy.logout(); // Ensure to start with an unauthenticated session
        assertIsNotLoggedIn(); // Sanity check
    });

    afterEach(() => {
        deleteAllEmails();
        deleteUser(TEST_USER.username());
    });

    after(() => {
        [TEST_USER_NO_EMAIL, ...SPECIAL_USERS].forEach(user => deleteUser(user.username()));
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
        initiate(user.username(), user.password);

        // STEP 2: Prepare the email factor
        cy.log('2- prepare');
        prepare('email_code');

        // STEP 3: Verify the email code factor
        cy.log('3- verification using the code received by email');
        getVerificationCode(user.email).then(code => {
            cy.log('Verification code received by email: ' + code);
            verifyEmailCodeFactor(code);
            assertIsLoggedIn(user.username());
        });
    };

    it(`Should be authenticated when correct credentials and code are provided: ${TEST_USER.username()}`, () => {
        validatePositiveMFAFlow(TEST_USER);
    });

    // Tests with users having special characters in username and/or password.
    // These are applicable only since Jahia 8.2.3.0 (https://github.com/Jahia/jahia-private/issues/3513) and that's why they are grouped here.
    // it() should be replaced with it.since() or similar once the support for it.since() is added in jahia-cypress, e.g.:
    // it.since('8.2.3.0', `Test with username: ${user.username}`, () => {
    // @see https://github.com/Jahia/jahia-cypress/issues/158 for implementation of it.since()
    SPECIAL_USERS.forEach(user => {
        it(`Should be authenticated when correct credentials and code are provided: ${user.username()}`, function () {
            if (compare(Cypress.env(VERSION_VAR), '8.2.3', '>=')) {
                validatePositiveMFAFlow(user);
            } else {
                this.skip();
            }
        });
    });

    it('Should throw an error when the wrong verification code is entered', () => {
        cy.log('1- initiate');
        initiate(TEST_USER.username(), TEST_USER.password);

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
        initiate(TEST_USER.username(), TEST_USER.password);

        cy.log('2- prepare');
        prepare('email_code');

        cy.log('3- verification without a code');
        verifyEmailCodeFactor('', 'Verification code is required');
    });

    it('Should throw an error when the user does not have an email', () => {
        cy.log('1- initiate');
        initiate(TEST_USER_NO_EMAIL.username(), TEST_USER_NO_EMAIL.password);

        cy.log('2- prepare');
        prepare('email_code', 'User does not have an email address configured');
    });

    it('Should throw an error when preparing without initiating the factor', () => {
        cy.log('2- prepare');
        prepare('email_code', 'Failed to prepare factor: No active MFA session found');
    });

    it('Should be locked when multiple wrong verification codes are entered in a row', () => {
        cy.log('0- installing the MFA configuration');
        // Config is:
        // maxAuthFailuresBeforeLock: 3
        // authFailuresWindowSeconds: 5
        // userTemporarySuspensionSeconds: 6
        installMFAConfig('quick-locking.yml');

        cy.log('1- initiate');
        initiate(TEST_USER.username(), TEST_USER.password);

        cy.log('2- prepare');
        prepare('email_code');

        cy.log('3- verification using wrong codes');
        let wrongCode: string;
        getVerificationCode(TEST_USER.email).then(code => {
            wrongCode = generateWrongCode(code);
            cy.log('1st attempt: ' + wrongCode);
            verifyEmailCodeFactor(wrongCode, 'Invalid verification code');
            wrongCode = generateWrongCode(wrongCode);
            cy.log('2nd attempt: ' + wrongCode);
            verifyEmailCodeFactor(wrongCode, 'Invalid verification code');
            wrongCode = generateWrongCode(wrongCode);
            cy.log('3rd attempt: ' + wrongCode);
            verifyEmailCodeFactor(wrongCode, 'Invalid verification code');
            wrongCode = generateWrongCode(wrongCode);
            cy.log('4th attempt: ' + wrongCode);
            verifyEmailCodeFactor(wrongCode, 'Too many failed authentication attempts');
            cy.log('Even the valid code is not accepted: ' + code);
            verifyEmailCodeFactor(code, 'Too many failed authentication attempts');
            // Wait until the suspension expires
            // eslint-disable-next-line cypress/no-unnecessary-waiting
            cy.wait(6000);
            verifyEmailCodeFactor(code);
            assertIsLoggedIn(TEST_USER.username());
        });
    });

    it('Should be allowed to enter new code when an attempt is out of the authFailuresWindowSeconds', () => {
        cy.log('0- installing the MFA configuration');
        // Config is:
        // maxAuthFailuresBeforeLock: 3
        // authFailuresWindowSeconds: 5
        // userTemporarySuspensionSeconds: 6
        installMFAConfig('quick-locking.yml');

        cy.log('1- initiate');
        initiate(TEST_USER.username(), TEST_USER.password);

        cy.log('2- prepare');
        prepare('email_code');

        cy.log('3- verification using wrong codes');
        let wrongCode: string;
        getVerificationCode(TEST_USER.email).then(code => {
            wrongCode = generateWrongCode(code);
            cy.log('1st attempt: ' + wrongCode);
            verifyEmailCodeFactor(wrongCode, 'Invalid verification code');
            cy.log('wait 2 seconds to isolate the first attempt');
            // eslint-disable-next-line cypress/no-unnecessary-waiting
            cy.wait(2000);
            wrongCode = generateWrongCode(wrongCode);
            cy.log('2nd attempt: ' + wrongCode);
            verifyEmailCodeFactor(wrongCode, 'Invalid verification code');
            wrongCode = generateWrongCode(wrongCode);
            cy.log('3rd attempt: ' + wrongCode);
            verifyEmailCodeFactor(wrongCode, 'Invalid verification code');
            cy.log('wait until the first attempt is out of the authFailuresWindowSeconds');
            // eslint-disable-next-line cypress/no-unnecessary-waiting
            cy.wait(3000);
            wrongCode = generateWrongCode(wrongCode);
            cy.log('4th attempt: ' + wrongCode);
            // Should now be allowed to enter a new code
            verifyEmailCodeFactor(wrongCode, 'Invalid verification code');
        });
    });
});
