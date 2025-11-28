import {deleteSite, deleteUser} from '@jahia/cypress';
import {faker} from '@faker-js/faker';
import {EmailFactorStep, LoginStep} from './pages';
import {
    assertIsLoggedIn,
    AuthenticationProps,
    createSiteWithLoginPage,
    createUserForMFA,
    deleteAllEmails,
    generateWrongCode,
    getLoginPageURL,
    getVerificationCode,
    I18N,
    installMFAConfig,
    updateSiteLoginPageProps
} from './utils';

const SITE_KEY = 'sample-ui';
const I18N_LOCALES = I18N.locales[I18N.defaultLanguage];
const FACTOR_TYPE = 'email_code';
const CODE_LENGTH = 6;
const INCOMPLETE_CODE_LENGTH = CODE_LENGTH - 2;
const MAX_INVALID_ATTEMPTS = 3;
const TIME_BEFORE_NEXT_CODE_MS = 3000;
const SUSPENSION_TIME_MS = 5000;
const VALID_REDIRECT_URLS = [
    `/sites/${SITE_KEY}/otherPage.html`, // Absolute URL, same site, no parameter
    `/sites/${SITE_KEY}/otherPage.html?param=test`, // Absolute URL, same site, with parameter
    '/sites/otherSite/otherPage.html?param=test', // Absolute URL, different site, with parameter
    '/my/other/page?param=test', // Absolute URL, not a site, with parameter
    'otherPage.html?param=test', // Relative URL, no parameter
    Cypress.env('JAHIA_URL') + '/sample.html' // Same domain (with protocol)
];
const PROHIBITED_REDIRECT_URLS = [
    `//sites/${SITE_KEY}/otherPage.html`, // Starting with '//'
    // eslint-disable-next-line no-script-url
    'javascript:alert(\'XSS attack\')', // XSS attack using the 'javascript:' protocol
    'javascript%3Aalert%28%27XSS%20attack%27%29', // XSS attack using the 'javascript:' protocol (URL encoded)
    'data:text/html,<script>alert(\'XSS\')</script>', // XSS attack using the 'data:' protocol
    'http://otherdomain.com/fake.html', // External site (http)
    'https://otherdomain.com/fake.html' // External site (https)
];

describe('Tests for the UI module', () => {
    let username: string;
    let password: string;
    let email: string;

    /**
     * Tests a successful redirect to the given redirectParam after completing the MFA flow.
     * @param {string} redirectParam the redirect parameter to use in the login URL
     * @param {string} expectedRedirectUrl the expected redirect URL after successful authentication (if different from redirectParam)
     * @return {void}
     */
    const testSuccessfulRedirect = (redirectParam: string, expectedRedirectUrl: string): void => {
        cy.visit(`${getLoginPageURL(SITE_KEY)}?redirect=${redirectParam}`);
        LoginStep.login(username, password);
        LoginStep.selectEmailCodeFactor();
        getVerificationCode(email).then(code => {
            // Intercept the redirect to the expected page, to validate it actually happens
            cy.intercept('GET', expectedRedirectUrl).as('expectedRedirect');

            EmailFactorStep.submitVerificationCode(code);
            EmailFactorStep.assertSuccessfullyRedirected(SITE_KEY, I18N.defaultLanguage, expectedRedirectUrl);

            // Build expected response URL: handle the case when redirect URL is absolute or relative or full URL
            let responseURL: string;
            if (expectedRedirectUrl.startsWith('http://') || expectedRedirectUrl.startsWith('https://')) {
                responseURL = expectedRedirectUrl;
            } else {
                responseURL = `${Cypress.env('JAHIA_URL')}${expectedRedirectUrl[0] === '/' ? '' : '/'}${expectedRedirectUrl}`;
            }

            // Wait for the expected redirect to complete and validate the URL
            cy.wait('@expectedRedirect').its('response.url').should('eq', responseURL);
        });
    };

    before(() => {
        createSiteWithLoginPage(SITE_KEY);
    });

    beforeEach(() => {
        installMFAConfig('sample-ui.yml'); // Tests might change the MFA config
        username = faker.internet.username();
        password = faker.internet.password();
        email = faker.internet.email();
        createUserForMFA(username, password, email);
        deleteAllEmails(); // Sanity cleanup
    });

    afterEach(() => {
        deleteUser(username);
        deleteAllEmails();
    });

    after(() => {
        deleteSite(SITE_KEY);
    });

    it('Should be authenticated when following all the MFA steps and have the correct props (labels, HTMLs)', () => {
        LoginStep.triggerRedirect(SITE_KEY);

        // Validate UI content on the login step
        LoginStep.assertContentMatches();

        LoginStep.login(username, password);
        LoginStep.selectEmailCodeFactor();
        getVerificationCode(email).then(code => {
            // Validate UI content on the email factor step
            EmailFactorStep.assertHeaderTitleMatches();
            EmailFactorStep.assertContentMatches();

            // Proceed with verification
            EmailFactorStep.submitVerificationCode(code);
            EmailFactorStep.assertSuccessfullyRedirected(SITE_KEY);
            assertIsLoggedIn(username);
        });
    });

    it('Should have the correct props (labels, HTMLs) after a full update in English', () => {
        const siteKey = 'full-update-site';
        createSiteWithLoginPage(siteKey);
        installMFAConfig('full-update-site.yml');

        // Change all props:
        const newProps: AuthenticationProps = {
            loginEmailFieldLabel: 'Custom email label',
            loginPasswordFieldLabel: 'Custom pwd label',
            loginSubmitButtonLabel: 'Custom login label',
            loginBelowPasswordFieldHtml: '<i>Sample below password</i>',
            loginAdditionalActionHtml: '<b>login additional action</b>',
            emailCodeVerificationFieldLabel: 'Custom code label',
            emailCodeVerificationSubmitButtonLabel: 'Custom verify label',
            emailCodeVerificationAdditionalActionHtml: '<b>email code verification additional action</b>',
            emailCodeVerificationAdditionalActionResendLabel: 'Custom resend label'
        };
        updateSiteLoginPageProps(siteKey, newProps);

        // Login step:
        LoginStep.triggerRedirect(siteKey);
        LoginStep.assertContentMatches({
            emailLabel: newProps.loginEmailFieldLabel,
            passwordLabel: newProps.loginPasswordFieldLabel,
            belowPasswordFieldHtml: newProps.loginBelowPasswordFieldHtml,
            submitButtonLabel: newProps.loginSubmitButtonLabel,
            additionalActionHtml: newProps.loginAdditionalActionHtml
        });
        LoginStep.login(username, password);

        // Email factor step:
        EmailFactorStep.assertContentMatches({
            verificationCodeLabel: newProps.emailCodeVerificationFieldLabel,
            submitButtonLabel: newProps.emailCodeVerificationSubmitButtonLabel,
            additionalActionHtml: newProps.emailCodeVerificationAdditionalActionHtml,
            resendCodeLink: newProps.emailCodeVerificationAdditionalActionResendLabel
        });

        // Cleanup
        deleteSite(siteKey);
    });

    it('Should have the correct props (labels, HTMLs) after a partial update in English', () => {
        const siteKey = 'partial-update-site';
        createSiteWithLoginPage(siteKey);
        installMFAConfig('partial-update-site.yml');

        // Only change a few props:
        const newProps = {
            loginPasswordFieldLabel: 'Custom pwd label',
            loginAdditionalActionHtml: '<b>Sample HTML</b>',
            emailCodeVerificationSubmitButtonLabel: 'Verify code'
        };
        updateSiteLoginPageProps(siteKey, newProps);

        // Login step:
        LoginStep.triggerRedirect(siteKey);
        LoginStep.assertContentMatches({
            passwordLabel: newProps.loginPasswordFieldLabel,
            additionalActionHtml: newProps.loginAdditionalActionHtml
        });
        LoginStep.login(username, password);

        // Email factor step:
        EmailFactorStep.assertContentMatches({submitButtonLabel: newProps.emailCodeVerificationSubmitButtonLabel});

        // Cleanup
        deleteSite(siteKey);
    });

    // BLOCKED BY: https://github.com/Jahia/jahia-multi-factor-authentication/issues/72
    it.skip('Should have the props (labels, HTMLs) matching the locale in the MFA URLs with multi-language site', () => {
        const siteKey = 'multi-language-site';
        const siteLanguage = 'es'; // Spanish
        const additionalLanguage = 'cs'; // Czech
        createSiteWithLoginPage(siteKey, [siteLanguage, additionalLanguage]);

        // Only change a few props:
        const esProps = {
            loginPasswordFieldLabel: 'Password in spanish',
            loginAdditionalActionHtml: '<b>additional action in Spanish</b>',
            emailCodeVerificationSubmitButtonLabel: 'Verify code in Spanish'
        };
        updateSiteLoginPageProps(siteKey, esProps, siteLanguage);

        // ALL properties have to be set for additional languages (the default values are only used for the default language)
        const csProps = {
            loginSubmitButtonLabel: 'Custom login label cs',
            emailCodeVerificationSubmitButtonLabel: 'Verify code in Czech'
        };
        updateSiteLoginPageProps(siteKey, csProps, additionalLanguage);

        // ----------
        // test with default (Spanish) language
        // ----------

        installMFAConfig('multi-language-site-default.yml'); // URL is /sites/multi-language-site/myLoginPage.html
        LoginStep.triggerRedirect(siteKey);
        LoginStep.assertContentMatches({
            passwordLabel: esProps.loginPasswordFieldLabel,
            additionalActionHtml: esProps.loginAdditionalActionHtml
        });
        LoginStep.login(username, password);

        // Email factor step:
        EmailFactorStep.assertHeaderTitleMatches();
        EmailFactorStep.assertContentMatches({submitButtonLabel: esProps.emailCodeVerificationSubmitButtonLabel});
        EmailFactorStep.assertVerificationCodeSentMessage(email);

        // ----------
        // test with additional language (Czech)
        // ----------

        installMFAConfig('multi-language-site-czech.yml'); // URL is /cs/sites/multi-language-site/myLoginPage.html
        LoginStep.triggerRedirect(siteKey, additionalLanguage);

        LoginStep.assertContentMatches({submitButtonLabel: csProps.loginSubmitButtonLabel});
        LoginStep.login(username, password);

        // Email factor step:
        EmailFactorStep.assertHeaderTitleMatches();
        EmailFactorStep.assertContentMatches({submitButtonLabel: csProps.emailCodeVerificationSubmitButtonLabel});
        EmailFactorStep.assertVerificationCodeSentMessage(email);

        // Cleanup
        deleteSite(siteKey);
    });

    it('Should display an error when an invalid password is entered', () => {
        LoginStep.triggerRedirect(SITE_KEY);
        LoginStep.login(username, 'invalidPassword');
        LoginStep.assertErrorMessage(I18N_LOCALES.authentication_failed);
    });

    it('Should display an error when an invalid username is entered', () => {
        LoginStep.triggerRedirect(SITE_KEY);
        LoginStep.login('invalidUsername', password);
        LoginStep.assertErrorMessage(I18N_LOCALES.authentication_failed);
    });

    // BLOCKED BY: https://github.com/Jahia/jahia-multi-factor-authentication/issues/41
    it.skip('Should display an error when an INVALID verification code is entered and authenticate afterwards', () => {
        LoginStep.triggerRedirect(SITE_KEY);
        LoginStep.login(username, password);
        LoginStep.selectEmailCodeFactor();
        getVerificationCode(email).then(code => {
            const wrongCode = generateWrongCode(code);
            EmailFactorStep.submitVerificationCode(wrongCode);
            EmailFactorStep.assertErrorMessage(I18N_LOCALES['verify.verification_failed'].replace('{{factorType}}', FACTOR_TYPE));

            // Now enter the correct code
            EmailFactorStep.submitVerificationCode(code);
            EmailFactorStep.assertSuccessfullyRedirected(SITE_KEY);
            assertIsLoggedIn(username);
        });
    });

    it('Should be suspended when reaching the limit of INVALID attempts; when restarting the login flow, should remain suspended', () => {
        installMFAConfig('sample-ui-long-suspension.yml');
        LoginStep.triggerRedirect(SITE_KEY);
        LoginStep.login(username, password);
        LoginStep.selectEmailCodeFactor();
        getVerificationCode(email).then(code => {
            const wrongCode = generateWrongCode(code);

            // Make MAX_INVALID_ATTEMPTS failed verification attempts to trigger suspension
            for (let i = 0; i < MAX_INVALID_ATTEMPTS; i++) {
                EmailFactorStep.submitVerificationCode(wrongCode);
                EmailFactorStep.assertErrorMessage(I18N_LOCALES['verify.verification_failed'].replace('{{factorType}}', FACTOR_TYPE));
            }

            // Confirm the user is suspended
            EmailFactorStep.submitVerificationCode(wrongCode);
            EmailFactorStep.assertErrorMessage(I18N_LOCALES.suspended_user.replace('{{suspensionDurationInHours}}', '27')); // 97200 seconds = 27 hours

            // Restart the login flow
            EmailFactorStep.clickRestartLoginOnSuspension();

            // Should remain suspended
            LoginStep.login(username, password);
            EmailFactorStep.assertErrorMessage(I18N_LOCALES.suspended_user.replace('{{suspensionDurationInHours}}', '27')); // 97200 seconds = 27 hours
        });
    });

    it('Should be suspended when reaching the limit of INVALID attempts and blocked to re-initiate MFA; be able to authenticate when suspension is lifted and flow re-initiated', () => {
        LoginStep.triggerRedirect(SITE_KEY);
        LoginStep.login(username, password);
        LoginStep.selectEmailCodeFactor();
        getVerificationCode(email).then(code => {
            const wrongCode = generateWrongCode(code);

            // Make MAX_INVALID_ATTEMPTS failed verification attempts to trigger suspension
            for (let i = 0; i < MAX_INVALID_ATTEMPTS; i++) {
                EmailFactorStep.submitVerificationCode(wrongCode);
                EmailFactorStep.assertErrorMessage(I18N_LOCALES['verify.verification_failed'].replace('{{factorType}}', FACTOR_TYPE));
            }

            // One more attempt to confirm the user is suspended
            EmailFactorStep.submitVerificationCode(wrongCode);
            EmailFactorStep.assertErrorMessage(I18N_LOCALES.suspended_user.replace('{{suspensionDurationInHours}}', '1'));

            // Restart the login flow and expect suspension message
            EmailFactorStep.clickRestartLoginOnSuspension();
            LoginStep.login(username, password);
            EmailFactorStep.assertErrorMessage(I18N_LOCALES.suspended_user.replace('{{suspensionDurationInHours}}', '1'));

            // Wait for suspension to be lifted
            cy.wait(SUSPENSION_TIME_MS + 1000);
            deleteAllEmails();

            // Restart the login flow and receive a new code
            EmailFactorStep.clickRestartLoginOnSuspension();
            LoginStep.login(username, password);
            LoginStep.selectEmailCodeFactor();
            getVerificationCode(email).then(newCode => {
                // Make sure the two codes are different
                expect(newCode).to.not.equal(code);

                // Make sure no error is present
                EmailFactorStep.assertNoErrors();

                // First enter the old code to check it fails
                EmailFactorStep.submitVerificationCode(code);
                EmailFactorStep.assertErrorMessage(I18N_LOCALES['verify.verification_failed'].replace('{{factorType}}', FACTOR_TYPE));

                // Now enter the correct code and authenticate
                EmailFactorStep.submitVerificationCode(newCode);
                EmailFactorStep.assertSuccessfullyRedirected(SITE_KEY);
                assertIsLoggedIn(username);
            });
        });
    });

    it('Should be suspended when reaching the limit of INVALID attempts and the suspension duration be displayed', () => {
        installMFAConfig('sample-ui-long-suspension.yml');
        LoginStep.triggerRedirect(SITE_KEY);
        LoginStep.login(username, password);
        LoginStep.selectEmailCodeFactor();
        getVerificationCode(email).then(code => {
            const wrongCode = generateWrongCode(code);

            // Make MAX_INVALID_ATTEMPTS failed verification attempts to trigger suspension
            for (let i = 0; i < MAX_INVALID_ATTEMPTS; i++) {
                EmailFactorStep.submitVerificationCode(wrongCode);
                EmailFactorStep.assertErrorMessage(I18N_LOCALES['verify.verification_failed'].replace('{{factorType}}', FACTOR_TYPE));
            }

            EmailFactorStep.submitVerificationCode(wrongCode);
            EmailFactorStep.assertErrorMessage(I18N_LOCALES.suspended_user.replace('{{suspensionDurationInHours}}', '27')); // 97200 seconds = 27 hours
        });
    });

    // BLOCKED BY: https://github.com/Jahia/jahia-multi-factor-authentication/issues/41
    it.skip('Should display an error when an EMPTY verification code is submitted and authenticate afterwards', () => {
        LoginStep.triggerRedirect(SITE_KEY);
        LoginStep.login(username, password);
        LoginStep.selectEmailCodeFactor();
        getVerificationCode(email).then(code => {
            EmailFactorStep.submitVerificationCode('');
            EmailFactorStep.assertErrorMessage(I18N_LOCALES['verify.code_too_short'].replace('{{codeLength}}', CODE_LENGTH.toString()));

            // Now enter the correct code
            EmailFactorStep.submitVerificationCode(code);
            EmailFactorStep.assertSuccessfullyRedirected(SITE_KEY);
            assertIsLoggedIn(username);
        });
    });

    // BLOCKED BY: https://github.com/Jahia/jahia-multi-factor-authentication/issues/41
    it.skip('Should display an error when an INCOMPLETE (short) verification code is entered and authenticate afterwards', () => {
        LoginStep.triggerRedirect(SITE_KEY);
        LoginStep.login(username, password);
        LoginStep.selectEmailCodeFactor();
        getVerificationCode(email).then(code => {
            EmailFactorStep.submitVerificationCode(faker.string.numeric(INCOMPLETE_CODE_LENGTH));
            EmailFactorStep.assertErrorMessage(I18N_LOCALES['verify.code_too_short'].replace('{{codeLength}}', CODE_LENGTH.toString()));

            // Now enter the correct code
            EmailFactorStep.submitVerificationCode(code);
            EmailFactorStep.assertSuccessfullyRedirected(SITE_KEY);
            assertIsLoggedIn(username);
        });
    });

    it('Should display an error when re-sending code to early, and successfully authenticate afterwards', () => {
        LoginStep.triggerRedirect(SITE_KEY);
        LoginStep.login(username, password);
        LoginStep.selectEmailCodeFactor();
        getVerificationCode(email).then(code => {
            EmailFactorStep.assertVerificationCodeSentMessage(email);

            // Test the resend action: 'prepare.rate_limit_exceeded' error is expected
            EmailFactorStep.resendCode();
            // Build the expected time left string e.g. "[1,2,3]" to be used in Regexp
            // Note: time left can vary depending on execution speed, so we check only the pattern here
            const timeLeft = '[' + Array.from({length: (TIME_BEFORE_NEXT_CODE_MS / 1000)}, (_, i) => i + 1).join(',') + ']';
            EmailFactorStep.assertErrorMessage(new RegExp(
                I18N_LOCALES['prepare.rate_limit_exceeded']
                    .replace('{{factorType}}', FACTOR_TYPE)
                    .replace('{{user}}', username)
                    .replace('{{nextRetryInSeconds}}', timeLeft)
            ));

            // eslint-disable-next-line cypress/no-unnecessary-waiting
            cy.wait(1000);
            // Finally submit the initially received code
            EmailFactorStep.submitVerificationCode(code);
            EmailFactorStep.assertSuccessfullyRedirected(SITE_KEY);
            assertIsLoggedIn(username);
        });
    });

    it('Should authenticate when using new re-sent code', () => {
        LoginStep.triggerRedirect(SITE_KEY);
        LoginStep.login(username, password);
        LoginStep.selectEmailCodeFactor();

        getVerificationCode(email).then(firstCode => {
            // Wait for 3 second and ask for a new code
            // eslint-disable-next-line cypress/no-unnecessary-waiting
            cy.wait(3000);
            deleteAllEmails();
            EmailFactorStep.resendCode();
            EmailFactorStep.assertNoErrors();
            EmailFactorStep.assertVerificationCodeSentMessage(email);

            getVerificationCode(email).then(secondCode => {
                // Make sure the two codes are different
                expect(secondCode).to.not.equal(firstCode);

                // First enter the old code to check it fails
                EmailFactorStep.submitVerificationCode(firstCode);
                EmailFactorStep.assertErrorMessage(I18N_LOCALES['verify.verification_failed'].replace('{{factorType}}', FACTOR_TYPE));

                // Now enter the correct code
                EmailFactorStep.submitVerificationCode(secondCode);
                EmailFactorStep.assertSuccessfullyRedirected(SITE_KEY);
                assertIsLoggedIn(username);
            });
        });
    });

    it('Should authenticate with new session when the flow is restarted', () => {
        LoginStep.triggerRedirect(SITE_KEY);
        LoginStep.login(username, password);
        LoginStep.selectEmailCodeFactor();

        getVerificationCode(email).then(firstCode => {
            // eslint-disable-next-line cypress/no-unnecessary-waiting
            cy.wait(1000);
            deleteAllEmails();

            // Re-start the flow from the beginning
            LoginStep.triggerRedirect(SITE_KEY);
            LoginStep.login(username, password);
            LoginStep.selectEmailCodeFactor();

            // User is still rate-limited even when re-starting the flow
            // Note: time left can vary depending on execution speed, so we check only the pattern here
            //       deducting 1 second used for the wait above
            const timeLeft = '[' + Array.from({length: (TIME_BEFORE_NEXT_CODE_MS / 1000) - 1}, (_, i) => i + 1).join(',') + ']';
            EmailFactorStep.assertErrorMessage(new RegExp(
                I18N_LOCALES['prepare.rate_limit_exceeded']
                    .replace('{{factorType}}', FACTOR_TYPE)
                    .replace('{{user}}', username)
                    .replace('{{nextRetryInSeconds}}', timeLeft)
            ));

            // Wait for the rate-limit to expire
            // eslint-disable-next-line cypress/no-unnecessary-waiting
            cy.wait(2000);

            // Re-start the flow from the beginning
            LoginStep.triggerRedirect(SITE_KEY);
            LoginStep.login(username, password);
            LoginStep.selectEmailCodeFactor();
            getVerificationCode(email).then(secondCode => {
                // Make sure the two codes are different
                expect(secondCode).to.not.equal(firstCode);

                // Make sure no error is present
                EmailFactorStep.assertNoErrors();

                // First enter the old code to check it fails
                EmailFactorStep.submitVerificationCode(firstCode);
                EmailFactorStep.assertErrorMessage(I18N_LOCALES['verify.verification_failed'].replace('{{factorType}}', FACTOR_TYPE));

                // Now enter the correct code
                EmailFactorStep.submitVerificationCode(secondCode);
                EmailFactorStep.assertSuccessfullyRedirected(SITE_KEY);
                assertIsLoggedIn(username);
            });
        });
    });

    // Test both URL-encoded and non URL-encoded redirect parameters
    VALID_REDIRECT_URLS.forEach(redirectURL => {
        it(`Should be redirected to the provided URL-encoded redirect page (${redirectURL})`, () => {
            testSuccessfulRedirect(encodeURIComponent(redirectURL), redirectURL);
        });

        it(`Should be redirected to the provided (non URL-encoded) redirect page (${redirectURL})`, () => {
            testSuccessfulRedirect(redirectURL, redirectURL);
        });
    });

    // Test with prohibited redirect URLS: should always be redirected to root page '/'
    PROHIBITED_REDIRECT_URLS.forEach(redirectURL => {
        it(`Should be redirected to / when a prohibited redirect page is passed (${redirectURL})`, () => {
            testSuccessfulRedirect(encodeURIComponent(redirectURL), '/');
        });
    });

    it('Should ensure console errors and warnings absense');
});
