import {deleteSite, deleteUser} from '@jahia/cypress';
import {faker} from '@faker-js/faker';
import {LoginStep, EmailFactorStep} from './pages';
import {
    assertIsLoggedIn,
    createSiteWithLoginPage,
    createUserForMFA,
    deleteAllEmails,
    generateWrongCode,
    getVerificationCode,
    installMFAConfig,
    AuthenticationProps,
    updateSiteLoginPageProps,
    I18N
} from './utils';

const SITE_KEY = 'sample-ui';
const I18N_LOCALES = I18N.locales[I18N.defaultLanguage];
const I18N_LABELS = I18N.labels[I18N.defaultLanguage];
const FACTOR_TYPE = 'email_code';
const CODE_LENGTH = 6;
const COUNTDOWN_TO_REDIRECT = 5;

describe('Tests for the UI module', () => {
    let username: string;
    let password: string;
    let email: string;
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
        LoginStep.triggerRedirect(SITE_KEY);
        LoginStep.login(username, password);
        LoginStep.selectEmailCodeFactor();
        getVerificationCode(email).then(code => {
            cy.log('Verification code received by email: ' + code);
            EmailFactorStep.submitVerificationCode(code);
            EmailFactorStep.assertSuccessMessage(I18N_LOCALES['complete.successful']);
            assertIsLoggedIn(username);
        });
    });

    it('Should have the correct default props (labels, HTMLs)', () => {
        // Login step:
        LoginStep.triggerRedirect(SITE_KEY);
        LoginStep.assertContentMatches({
            emailLabel: I18N_LABELS.loginEmailLabel,
            passwordLabel: I18N_LABELS.loginPasswordLabel,
            belowPasswordFieldHtml: I18N_LABELS.loginBelowPasswordFieldHTML,
            submitButtonLabel: I18N_LABELS.loginSubmitButtonLabel,
            additionalActionHtml: I18N_LABELS.loginAdditionalActionHTML
        });
        LoginStep.login(username, password);

        // Email factor step:
        EmailFactorStep.assertHeaderTitleMatches();
        EmailFactorStep.assertContentMatches({
            verificationCodeLabel: I18N_LABELS.emailCodeVerificationLabel,
            submitButtonLabel: I18N_LABELS.emailCodeVerificationSubmitButtonLabel,
            additionalActionHtml: `<div>${I18N_LABELS.emailCodeVerificationAdditionalActionHTML}</div><a href="#">${I18N_LABELS.emailCodeVerificationAdditionalActionResendLabel}</a>`
        });
    });

    it('Should have the correct props (labels, HTMLs) after a full update in English', () => {
        const siteKey = 'full-update-site';
        createSiteWithLoginPage(siteKey);
        installMFAConfig('full-update-site.yml');

        // Change all props:
        const newProps :AuthenticationProps = {
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
            additionalActionHtml: `<div>${newProps.emailCodeVerificationAdditionalActionHtml}</div><a href="#">${newProps.emailCodeVerificationAdditionalActionResendLabel}</a>`
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
            emailLabel: I18N_LABELS.loginEmailLabel,
            passwordLabel: newProps.loginPasswordFieldLabel,
            belowPasswordFieldHtml: I18N_LABELS.loginBelowPasswordFieldHTML,
            submitButtonLabel: I18N_LABELS.loginSubmitButtonLabel,
            additionalActionHtml: newProps.loginAdditionalActionHtml
        });
        LoginStep.login(username, password);

        // Email factor step:
        EmailFactorStep.assertContentMatches({
            verificationCodeLabel: I18N_LABELS.emailCodeVerificationLabel,
            submitButtonLabel: newProps.emailCodeVerificationSubmitButtonLabel,
            additionalActionHtml: `<div>${I18N_LABELS.emailCodeVerificationAdditionalActionHTML}</div><a href="#">${I18N_LABELS.emailCodeVerificationAdditionalActionResendLabel}</a>`
        });

        // Cleanup
        deleteSite(siteKey);
    });

    it('Should have the correct props (labels, HTMLs) after a partial update in lang not supported out of the box in Jahia (Spanish)', () => {
        const siteKey = 'multi-language-site';
        const language = 'es';
        createSiteWithLoginPage(siteKey, language);
        installMFAConfig('multi-language-site.yml');

        // Only change a few props:
        const newProps = {
            loginPasswordFieldLabel: 'Password in spanish',
            loginAdditionalActionHtml: '<b>additional action in Spanish</b>',
            emailCodeVerificationSubmitButtonLabel: 'Verify code in Spanish'
        };
        updateSiteLoginPageProps(siteKey, newProps, language);

        // Login step:
        LoginStep.triggerRedirect(siteKey);
        LoginStep.assertContentMatches({
            emailLabel: I18N_LABELS.loginEmailLabel,
            passwordLabel: newProps.loginPasswordFieldLabel,
            belowPasswordFieldHtml: I18N_LABELS.loginBelowPasswordFieldHTML,
            submitButtonLabel: I18N_LABELS.loginSubmitButtonLabel,
            additionalActionHtml: newProps.loginAdditionalActionHtml
        });
        LoginStep.login(username, password);

        // Email factor step:
        EmailFactorStep.assertHeaderTitleMatches();
        EmailFactorStep.assertContentMatches({
            verificationCodeLabel: I18N_LABELS.emailCodeVerificationLabel,
            submitButtonLabel: newProps.emailCodeVerificationSubmitButtonLabel,
            additionalActionHtml: `<div>${I18N_LABELS.emailCodeVerificationAdditionalActionHTML}</div><a href="#">${I18N_LABELS.emailCodeVerificationAdditionalActionResendLabel}</a>`
        });
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

    it('Should display an error when an invalid verification code is entered', () => {
        LoginStep.triggerRedirect(SITE_KEY);
        LoginStep.login(username, password);
        LoginStep.selectEmailCodeFactor();
        cy.log('Entering an invalid verification code');
        getVerificationCode(email).then(code => {
            const wrongCode = generateWrongCode(code);
            EmailFactorStep.submitVerificationCode(wrongCode);
            EmailFactorStep.assertErrorMessage(I18N_LOCALES['verify.verification_failed'].replace('{{factorType}}', FACTOR_TYPE));
        });
    });

    // Blocked by https://github.com/Jahia/jahia-multi-factor-authentication/issues/41
    it('Should display an error when an empty verification code is submitted and authenticate afterwards', () => {
        LoginStep.triggerRedirect(SITE_KEY);
        LoginStep.login(username, password);
        LoginStep.selectEmailCodeFactor();
        cy.log('Entering an empty verification code');
        getVerificationCode(email).then(code => {
            EmailFactorStep.submitVerificationCode('');
            EmailFactorStep.assertErrorMessage(I18N_LOCALES['verify.code_too_short'].replace('{{codeLength}}', CODE_LENGTH.toString()));

            // Now enter the correct code
            EmailFactorStep.submitVerificationCode(code);
            EmailFactorStep.assertSuccessMessage(I18N_LOCALES['complete.successful']);
            assertIsLoggedIn(username);
        });
    });

    // Blocked by https://github.com/Jahia/jahia-multi-factor-authentication/issues/41
    it('Should display an error when an incomplete (short) verification code is entered and authenticate afterwards', () => {
        LoginStep.triggerRedirect(SITE_KEY);
        LoginStep.login(username, password);
        LoginStep.selectEmailCodeFactor();
        cy.log('Entering an incomplete (short) verification code');
        getVerificationCode(email).then(code => {
            const shortCode = '1234'; // Short code
            EmailFactorStep.submitVerificationCode(shortCode);
            EmailFactorStep.assertErrorMessage(I18N_LOCALES['verify.code_too_short'].replace('{{codeLength}}', CODE_LENGTH.toString()));

            // Now enter the correct code
            EmailFactorStep.submitVerificationCode(code);
            EmailFactorStep.assertSuccessMessage(I18N_LOCALES['complete.successful']);
            assertIsLoggedIn(username);
        });
    });

    it('Should automatically redirect to the provided redirect page', () => {
        cy.visit(`/sites/${SITE_KEY}/${LoginStep.PAGE_NAME}.html?redirect=%2Fcms%2Frender%2Flive%2Fen%2Fsites%2F${SITE_KEY}%2Fhome.html%3Fparam%3Dtest`);
        LoginStep.login(username, password);
        LoginStep.selectEmailCodeFactor();
        getVerificationCode(email).then(code => {
            cy.log('Verification code received by email: ' + code);
            EmailFactorStep.submitVerificationCode(code);
            cy.url({timeout: 15000}).should('contain', `/cms/render/live/en/sites/${SITE_KEY}/home.html`);
            cy.url({timeout: 15000}).should('match', /\?param=test$/);
            cy.url({timeout: 15000}).should('not.contain', `${LoginStep.PAGE_NAME}.html`);
        });
    });

    it('Should be able to redirect to the provided redirect page using "Go now" button', () => {
        cy.visit(`/sites/${SITE_KEY}/${LoginStep.PAGE_NAME}.html?redirect=%2Fcms%2Frender%2Flive%2Fen%2Fsites%2F${SITE_KEY}%2Fhome.html%3Fparam%3Dtest`);
        LoginStep.login(username, password);
        LoginStep.selectEmailCodeFactor();
        getVerificationCode(email).then(code => {
            cy.log('Verification code received by email: ' + code);
            EmailFactorStep.submitVerificationCode(code);

            // BLOCKED by https://github.com/Jahia/jahia-multi-factor-authentication/pull/54
            EmailFactorStep.assertRedirectUrlMessage(`/cms/render/live/en/sites/${SITE_KEY}/home.html?param=test`);

            EmailFactorStep.assertCountdownMessage(COUNTDOWN_TO_REDIRECT);
            EmailFactorStep.clickRedirectNowButton();

            cy.url({timeout: 15000}).should('contain', `/cms/render/live/en/sites/${SITE_KEY}/home.html`);
            cy.url({timeout: 15000}).should('match', /\?param=test$/);
            cy.url({timeout: 15000}).should('not.contain', `${LoginStep.PAGE_NAME}.html`);
        });
    });

    it('Should display an error when re-sending code to early, and successfully authenticate afterwards', () => {
        LoginStep.triggerRedirect(SITE_KEY);
        LoginStep.login(username, password);
        LoginStep.selectEmailCodeFactor();
        getVerificationCode(email).then(code => {
            cy.log('Verification code received by email: ' + code);
            EmailFactorStep.assertVerificationCodeSentMessage(email);

            // // Test the resend action: 'prepare.rate_limit_exceeded' error is expected
            EmailFactorStep.resendCode();
            EmailFactorStep.assertErrorMessage(
                I18N_LOCALES['prepare.rate_limit_exceeded']
                    .replace('{{factorType}}', FACTOR_TYPE)
                    .replace('{{user}}', username)
                    .replace('{{nextRetryInSeconds}}', '3')
            );

            // Wait for 1 second and re-try once again: 'prepare.rate_limit_exceeded' error is expected
            // eslint-disable-next-line cypress/no-unnecessary-waiting
            cy.wait(1000);
            EmailFactorStep.resendCode();
            EmailFactorStep.assertErrorMessage(
                I18N_LOCALES['prepare.rate_limit_exceeded']
                    .replace('{{factorType}}', FACTOR_TYPE)
                    .replace('{{user}}', username)
                    .replace('{{nextRetryInSeconds}}', '2')
            );

            // eslint-disable-next-line cypress/no-unnecessary-waiting
            cy.wait(1000);
            // Finally submit the initially received code
            EmailFactorStep.submitVerificationCode(code);
            EmailFactorStep.assertSuccessMessage(I18N_LOCALES['complete.successful']);
            assertIsLoggedIn(username);
        });
    });

    it('Should authenticate when using new re-sent code', () => {
        LoginStep.triggerRedirect(SITE_KEY);
        LoginStep.login(username, password);
        LoginStep.selectEmailCodeFactor();

        getVerificationCode(email).then(firstCode => {
            cy.log('Verification code received by email: ' + firstCode);
            deleteAllEmails();

            // Wait for 3 second and ask for a new code
            // eslint-disable-next-line cypress/no-unnecessary-waiting
            cy.wait(3000);
            EmailFactorStep.resendCode();
            EmailFactorStep.assertVerificationCodeSentMessage(email);

            getVerificationCode(email).then(secondCode => {
                cy.log('New verification code received by email: ' + secondCode);
                expect(secondCode).to.not.equal(firstCode);

                // First enter the old code to check it fails
                EmailFactorStep.submitVerificationCode(firstCode);
                EmailFactorStep.assertErrorMessage(I18N_LOCALES['verify.verification_failed'].replace('{{factorType}}', FACTOR_TYPE));

                // Now enter the correct code
                EmailFactorStep.submitVerificationCode(secondCode);
                EmailFactorStep.assertSuccessMessage(I18N_LOCALES['complete.successful']);
                assertIsLoggedIn(username);
            });
        });
    });

    it('Should authenticate with new session when the flow is restarted', () => {
        LoginStep.triggerRedirect(SITE_KEY);
        LoginStep.login(username, password);
        LoginStep.selectEmailCodeFactor();

        getVerificationCode(email).then(firstCode => {
            cy.log('Verification code received by email: ' + firstCode);
            deleteAllEmails();

            // eslint-disable-next-line cypress/no-unnecessary-waiting
            cy.wait(1000);

            // Re-start the flow from the beginning
            LoginStep.triggerRedirect(SITE_KEY);
            LoginStep.login(username, password);
            LoginStep.selectEmailCodeFactor();

            // User is still rate-limited even when re-starting the flow
            EmailFactorStep.assertErrorMessage(
                I18N_LOCALES['prepare.rate_limit_exceeded']
                    .replace('{{factorType}}', FACTOR_TYPE)
                    .replace('{{user}}', username)
                    .replace('{{nextRetryInSeconds}}', '2')
            );

            // Wait for the rate-limit to expire
            // eslint-disable-next-line cypress/no-unnecessary-waiting
            cy.wait(2000);

            // Re-start the flow from the beginning
            LoginStep.triggerRedirect(SITE_KEY);
            LoginStep.login(username, password);
            LoginStep.selectEmailCodeFactor();
            getVerificationCode(email).then(secondCode => {
                cy.log('Verification code received by email: ' + secondCode);

                cy.log('New verification code received by email: ' + secondCode);
                expect(secondCode).to.not.equal(firstCode);

                // First enter the old code to check it fails
                EmailFactorStep.submitVerificationCode(firstCode);
                EmailFactorStep.assertErrorMessage(I18N_LOCALES['verify.verification_failed'].replace('{{factorType}}', FACTOR_TYPE));

                // Now enter the correct code
                EmailFactorStep.submitVerificationCode(secondCode);
                EmailFactorStep.assertSuccessMessage(I18N_LOCALES['complete.successful']);
                assertIsLoggedIn(username);
            });
        });
    });
});
