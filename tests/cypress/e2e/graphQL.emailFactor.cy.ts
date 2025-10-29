import {deleteSite, deleteUser, getJahiaVersion} from '@jahia/cypress';
import {compare} from 'compare-versions';
import {
    assertIsLoggedIn,
    assertIsNotLoggedIn,
    assertIsSuspended,
    createSiteWithLoginPage,
    createUserForMFA,
    deleteAllEmails,
    generateWrongCode,
    getVerificationCode,
    initiate,
    installMFAConfig,
    prepareEmailCodeFactor,
    prepareEmailCodeFactorAndExpectError,
    verifyEmailCodeFactor,
    verifyEmailCodeFactorAndExpectError
} from './utils';
import {faker} from '@faker-js/faker';

let globalUsername = '';

interface TestUser {
    username: () => string;
    password: string;
    email: string;
    preferredLanguage?: string;
}

const TEST_USER: TestUser = {username: () => globalUsername, password: 'password', email: 'email@example.com'};
const TEST_USER_NO_EMAIL: TestUser = {username: () => 'test_mfa_user_without_email', password: 'password', email: ''};
const TEST_USER_I18N: TestUser = {username: () => 'test_mfa_user_frenchy', password: 'password', email: 'frenchy@example.com', preferredLanguage: 'fr'};
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
        [TEST_USER_NO_EMAIL, TEST_USER_I18N, ...SPECIAL_USERS].forEach(user => createUserForMFA(user.username(), user.password, user.email, user.preferredLanguage));
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
     * @param site  Optional. The site to authenticate against. The authentication is global if not specified.
     * @note For readability sake, this function covers only happy-path steps without any negative assertions.
     *       Negative scenarios are covered inline in the separate test cases below.
     */
    const validatePositiveMFAFlow = (user:TestUser, site: string = undefined) => {
        // STEP 1: Initiate the MFA process
        cy.log('1- initiate');
        initiate(user.username(), user.password, site);

        // STEP 2: Prepare the email factor
        cy.log('2- prepare');
        prepareEmailCodeFactor();

        // STEP 3: Verify the email code factor
        cy.log('3- verification using the code received by email');
        getVerificationCode(user.email, user.preferredLanguage).then(code => {
            cy.log('Verification code received by email: ' + code);
            verifyEmailCodeFactor(code);
            assertIsLoggedIn(user.username());
        });
    };

    it(`Should be authenticated when correct credentials and code are provided: ${TEST_USER.username()}`, () => {
        validatePositiveMFAFlow(TEST_USER);
    });

    it(`Should be authenticated on a specific site when correct credentials and code are provided: ${TEST_USER.username()}`, () => {
        const siteKey = faker.lorem.slug();
        createSiteWithLoginPage(siteKey);
        validatePositiveMFAFlow(TEST_USER, siteKey);
        deleteSite(siteKey);
    });

    it(`Should receive i18n mail based on user preferred language: ${TEST_USER_I18N.username()}`, () => {
        validatePositiveMFAFlow(TEST_USER_I18N);
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
        prepareEmailCodeFactor();

        cy.log('3- verification using a wrong code');
        getVerificationCode(TEST_USER.email).then(code => {
            const wrongCode = generateWrongCode(code);
            verifyEmailCodeFactorAndExpectError(wrongCode, 'verify.verification_failed', {
                factorType: value => expect(value).to.eq('email_code')
            });
        });
    });

    it('Should throw an error when no verification code is entered', () => {
        cy.log('1- initiate');
        initiate(TEST_USER.username(), TEST_USER.password);

        cy.log('2- prepare');
        prepareEmailCodeFactor();

        cy.log('3- verification without a code');
        verifyEmailCodeFactorAndExpectError('', 'factor.email_code.verification_code_required');
    });

    it('Should throw an error when the user does not have an email', () => {
        cy.log('1- initiate');
        initiate(TEST_USER_NO_EMAIL.username(), TEST_USER_NO_EMAIL.password);

        cy.log('2- prepare');
        prepareEmailCodeFactorAndExpectError('factor.email_code.email_not_configured_for_user', {
            user: value => expect(value).to.eq(TEST_USER_NO_EMAIL.username())
        });
    });

    it('Should throw an error when preparing without initiating the factor', () => {
        cy.log('2- prepare');
        // Prepare('email_code', 'email_code', 'Failed to prepare factor: No active MFA session found');
        prepareEmailCodeFactorAndExpectError('no_active_session');
    });

    it('Should throw an error when verifying without preparing the factor', () => {
        initiate(TEST_USER.username(), TEST_USER.password);
        verifyEmailCodeFactorAndExpectError('123456', 'verify.factor_not_prepared', {
            factorType: value => expect(value).to.eq('email_code')
        });
    });

    it.only('Should be suspended when multiple wrong verification codes are entered in a row', () => {
        cy.log('0- installing the MFA configuration');
        // Config is:
        // maxAuthFailuresBeforeLock: 3
        // authFailuresWindowSeconds: 5
        // userTemporarySuspensionSeconds: 6
        installMFAConfig('quick-locking.yml');

        cy.log('1- initiate');
        initiate(TEST_USER.username(), TEST_USER.password);

        cy.log('2- prepare');
        prepareEmailCodeFactor();

        cy.log('3- verification using wrong codes');
        let wrongCode: string;
        getVerificationCode(TEST_USER.email).then(code => {
            wrongCode = generateWrongCode(code);
            cy.log('1st attempt: ' + wrongCode);
            verifyEmailCodeFactorAndExpectError(wrongCode, 'verify.verification_failed', {
                factorType: value => expect(value).to.eq('email_code')
            });
            wrongCode = generateWrongCode(wrongCode);
            cy.log('2nd attempt: ' + wrongCode);
            verifyEmailCodeFactorAndExpectError(wrongCode, 'verify.verification_failed', {
                factorType: value => expect(value).to.eq('email_code')
            });
            wrongCode = generateWrongCode(wrongCode);
            cy.log('3rd attempt: ' + wrongCode);
            verifyEmailCodeFactorAndExpectError(wrongCode, 'verify.verification_failed', {
                factorType: value => expect(value).to.eq('email_code')
            });
            wrongCode = generateWrongCode(wrongCode);
            cy.log('4th attempt: ' + wrongCode);
            verifyEmailCodeFactorAndExpectError(wrongCode, 'suspended_user');
            assertIsSuspended(TEST_USER.username());
            cy.log('Even the valid code is not accepted: ' + code);
            verifyEmailCodeFactorAndExpectError(wrongCode, 'suspended_user');
            // Wait until the suspension expires
            // eslint-disable-next-line cypress/no-unnecessary-waiting
            cy.wait(6000);
            // The (valid) code obtained before being suspended can't be used anymore
            verifyEmailCodeFactorAndExpectError(code, 'factor.email_code.missing_prepared_code');
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
        prepareEmailCodeFactor();

        cy.log('3- verification using wrong codes');
        let wrongCode: string;
        getVerificationCode(TEST_USER.email).then(code => {
            wrongCode = generateWrongCode(code);
            cy.log('1st attempt: ' + wrongCode);
            verifyEmailCodeFactorAndExpectError(wrongCode, 'verify.verification_failed', {
                factorType: value => expect(value).to.eq('email_code')
            });
            cy.log('wait 2 seconds to isolate the first attempt');
            // eslint-disable-next-line cypress/no-unnecessary-waiting
            cy.wait(2000);
            wrongCode = generateWrongCode(wrongCode);
            cy.log('2nd attempt: ' + wrongCode);
            verifyEmailCodeFactorAndExpectError(wrongCode, 'verify.verification_failed', {
                factorType: value => expect(value).to.eq('email_code')
            });
            wrongCode = generateWrongCode(wrongCode);
            cy.log('3rd attempt: ' + wrongCode);
            verifyEmailCodeFactorAndExpectError(wrongCode, 'verify.verification_failed', {
                factorType: value => expect(value).to.eq('email_code')
            });
            cy.log('wait until the first attempt is out of the authFailuresWindowSeconds');
            // eslint-disable-next-line cypress/no-unnecessary-waiting
            cy.wait(3000);
            wrongCode = generateWrongCode(wrongCode);
            cy.log('4th attempt: ' + wrongCode);
            // Should now be allowed to enter a new code
            verifyEmailCodeFactorAndExpectError(wrongCode, 'verify.verification_failed', {
                factorType: value => expect(value).to.eq('email_code')
            });
        });
    });

    it('Should be allowed to authenticate even after trying to resend the code too early', () => {
        // Setup:
        const username = faker.internet.username();
        const password = faker.internet.password();
        const email = faker.internet.email();
        createUserForMFA(username, password, email);

        // Start the MFA process
        initiate(username, password);
        prepareEmailCodeFactor();

        getVerificationCode(email).then(code => {
        // Request the code a second time without waiting for the rate limit to expire
            prepareEmailCodeFactorAndExpectError('prepare.rate_limit_exceeded', {
                nextRetryInSeconds: value => expect(parseInt(value, 10)).to.be.greaterThan(0),
                factorType: value => expect(value).to.eq('email_code'),
                user: value => expect(value).to.eq(username)
            });
            // But the session is still valid, the user can authenticate
            verifyEmailCodeFactor(code);
            assertIsLoggedIn(username);
        });

        // Cleanup
        deleteUser(username);
    });
});
