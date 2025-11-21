import 'cypress-mailpit';
import {
    createUserForMFA,
    deleteAllEmails,
    generateWrongCode,
    getVerificationCode,
    initiate,
    initiateAndExpectGlobalError, initiateAndExpectSuspended,
    installMFAConfig,
    prepareEmailCodeFactor,
    prepareEmailCodeFactorAndExpectFactorError, prepareEmailCodeFactorAndExpectSuspended,
    verifyEmailCodeFactorAndExpectFactorError, verifyEmailCodeFactorAndExpectSuspended
} from './utils';
import {deleteUser} from '@jahia/cypress';
import {faker} from '@faker-js/faker';

describe('Error scenarios common to all factors', () => {
    let usr;
    let pwd;
    let email;

    beforeEach(() => {
        installMFAConfig('fake.yml'); // Tests might change the MFA config
        usr = faker.internet.username();
        pwd = faker.internet.password();
        email = faker.internet.email();
        createUserForMFA(usr, pwd, email);
        deleteAllEmails(); // Sanity cleanup
        cy.logout(); // Ensure to start with an unauthenticated session
    });

    afterEach(() => {
        deleteUser(usr);
        deleteAllEmails();
    });

    it('Should throw an error when an invalid username is provided', () => {
        initiateAndExpectGlobalError('unknownUser', pwd, 'authentication_failed');
    });

    it('Should throw an error when an invalid password is provided', () => {
        initiateAndExpectGlobalError(usr, 'myPassword', 'authentication_failed');
    });

    it('Should throw an error when an empty username is provided', () => {
        initiateAndExpectGlobalError('', pwd, 'authentication_failed');
    });

    it('Should throw an error when an empty password is provided', () => {
        initiateAndExpectGlobalError(usr, '', 'authentication_failed');
    });

    it('Should throw an error when a factor is requested twice, then should pass after the timeout', () => {
        cy.log('1- initiate');
        initiate(usr, pwd);

        cy.log('2- prepare');
        prepareEmailCodeFactor();

        cy.log('3- prepare again');
        prepareEmailCodeFactorAndExpectFactorError('prepare.rate_limit_exceeded', {
            nextRetryInSeconds: value => expect(parseInt(value, 10)).to.be.greaterThan(0),
            factorType: value => expect(value).to.eq('email_code'),
            user: value => expect(value).to.eq(usr)
        });

        cy.log('4- wait for end of timeout');
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(3000);
        cy.log('5- prepare after timeout should pass');
        prepareEmailCodeFactor();
    });

    it('Should throw an error when a suspended user tries to initiate the MFA flow', () => {
        suspendUser(usr, pwd, email);

        const suspensionDurationInHours = 1; // 6 seconds rounded up to 1 hour
        initiateAndExpectSuspended(usr, pwd, suspensionDurationInHours);
    });

    it('Should throw an error when a suspended user tries to prepare a factor', () => {
        suspendUser(usr, pwd, email);

        const suspensionDurationInHours = 1; // 6 seconds rounded up to 1 hour
        prepareEmailCodeFactorAndExpectSuspended(suspensionDurationInHours);
    });

    /**
     * Suspends a user by entering wrong verification codes 3 times in a row
     * @param username the username of the user to suspend
     * @param password the password of the user to suspend
     * @param userEmail the email of the user to suspend
     */
    const suspendUser = (username: string, password: string, userEmail: string) => {
        cy.log(`Suspending user: ${username}`);

        // Use quick-locking config to suspend after fewer attempts
        installMFAConfig('quick-locking.yml');

        initiate(username, password);
        prepareEmailCodeFactor();

        getVerificationCode(userEmail).then(code => {
            // Make 3 failed verification attempts to trigger suspension
            let wrongCode = generateWrongCode(code);
            verifyEmailCodeFactorAndExpectFactorError(wrongCode, 'verify.verification_failed', {
                factorType: value => expect(value).to.eq('email_code')
            });

            wrongCode = generateWrongCode(wrongCode);
            verifyEmailCodeFactorAndExpectFactorError(wrongCode, 'verify.verification_failed', {
                factorType: value => expect(value).to.eq('email_code')
            });

            wrongCode = generateWrongCode(wrongCode);
            verifyEmailCodeFactorAndExpectFactorError(wrongCode, 'verify.verification_failed', {
                factorType: value => expect(value).to.eq('email_code')
            });

            // Final attempt should trigger suspension
            wrongCode = generateWrongCode(wrongCode);
            const expectedSuspensionDurationInHours = 1; // 6 seconds rounded up to 1 hour
            verifyEmailCodeFactorAndExpectSuspended(wrongCode, expectedSuspensionDurationInHours);
        });
    };
});
