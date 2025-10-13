import {deleteSite, deleteUser} from '@jahia/cypress';
import {
    assertEmailCodeVerificationStepContentMatches,
    assertIsLoggedIn,
    assertLoginStepContentMatches,
    createSiteWithLoginPage,
    createUserForMFA,
    LOGIN_PAGE_NAME,
    deleteAllEmails,
    generateWrongCode,
    getVerificationCode,
    installMFAConfig,
    AuthenticationProps,
    updateSiteLoginPageProps,
    DEFAULT_LOGIN_EMAIL_FIELD_LABEL,
    DEFAULT_LOGIN_PASSWORD_FIELD_LABEL,
    DEFAULT_BELOW_PASSWORD_FIELD_HTML,
    DEFAULT_LOGIN_SUBMIT_BUTTON_LABEL,
    DEFAULT_LOGIN_ADDITIONAL_ACTION_HTML,
    DEFAULT_EMAIL_CODE_VERIFICATION_FIELD_LABEL,
    DEFAULT_EMAIL_CODE_VERIFICATION_SUBMIT_BUTTON_LABEL, DEFAULT_EMAIL_CODE_VERIFICATION_ADDITIONAL_ACTION_HTML,
    DEFAULT_EMAIL_CODE_VERIFICATION_ADDITIONAL_ACTION_RESEND_LABEL
} from './utils';
import {faker} from '@faker-js/faker';

const SITE_KEY = 'sample-ui';

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
        triggerRedirectToLoginPage(SITE_KEY);
        enterCredential(username, password);
        selectEmailFactor();
        getVerificationCode(email).then(code => {
            cy.log('Verification code received by email: ' + code);
            enterVerificationCode(code);
            assertIsSuccessMessageDisplayed();
            assertIsLoggedIn(username);
        });
    });

    it('Should have the correct default props (labels, HTMLs)', () => {
        // Login step:
        triggerRedirectToLoginPage(SITE_KEY);
        assertLoginStepContentMatches({emailLabel: DEFAULT_LOGIN_EMAIL_FIELD_LABEL, passwordLabel: DEFAULT_LOGIN_PASSWORD_FIELD_LABEL, belowPasswordFieldHtml: DEFAULT_BELOW_PASSWORD_FIELD_HTML, submitButtonLabel: DEFAULT_LOGIN_SUBMIT_BUTTON_LABEL, additionalActionHtml: DEFAULT_LOGIN_ADDITIONAL_ACTION_HTML});
        enterCredential(username, password);

        // Email factor step:
        assertEmailCodeVerificationStepContentMatches({verificationCodeLabel: DEFAULT_EMAIL_CODE_VERIFICATION_FIELD_LABEL, submitButtonLabel: DEFAULT_EMAIL_CODE_VERIFICATION_SUBMIT_BUTTON_LABEL,
            additionalActionHtml: `<div>${DEFAULT_EMAIL_CODE_VERIFICATION_ADDITIONAL_ACTION_HTML}</div><a href="#">${DEFAULT_EMAIL_CODE_VERIFICATION_ADDITIONAL_ACTION_RESEND_LABEL}</a>`});
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
        triggerRedirectToLoginPage(siteKey);
        assertLoginStepContentMatches({emailLabel: newProps.loginEmailFieldLabel, passwordLabel: newProps.loginPasswordFieldLabel, belowPasswordFieldHtml: newProps.loginBelowPasswordFieldHtml, submitButtonLabel: newProps.loginSubmitButtonLabel, additionalActionHtml: newProps.loginAdditionalActionHtml});
        enterCredential(username, password);

        // Email factor step:
        const completeHtml = `<div>${newProps.emailCodeVerificationAdditionalActionHtml}</div><a href="#">${newProps.emailCodeVerificationAdditionalActionResendLabel}</a>`;
        assertEmailCodeVerificationStepContentMatches({verificationCodeLabel: newProps.emailCodeVerificationFieldLabel, submitButtonLabel: newProps.emailCodeVerificationSubmitButtonLabel, additionalActionHtml: completeHtml});
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
        triggerRedirectToLoginPage(siteKey);
        assertLoginStepContentMatches({emailLabel: DEFAULT_LOGIN_EMAIL_FIELD_LABEL, passwordLabel: newProps.loginPasswordFieldLabel, belowPasswordFieldHtml: DEFAULT_BELOW_PASSWORD_FIELD_HTML, submitButtonLabel: DEFAULT_LOGIN_SUBMIT_BUTTON_LABEL, additionalActionHtml: newProps.loginAdditionalActionHtml});
        enterCredential(username, password);

        // Email factor step:
        assertEmailCodeVerificationStepContentMatches({verificationCodeLabel: DEFAULT_EMAIL_CODE_VERIFICATION_FIELD_LABEL, submitButtonLabel: newProps.emailCodeVerificationSubmitButtonLabel, additionalActionHtml: `<div>${DEFAULT_EMAIL_CODE_VERIFICATION_ADDITIONAL_ACTION_HTML}</div><a href="#">${DEFAULT_EMAIL_CODE_VERIFICATION_ADDITIONAL_ACTION_RESEND_LABEL}</a>`});

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
        triggerRedirectToLoginPage(siteKey);
        assertLoginStepContentMatches({emailLabel: DEFAULT_LOGIN_EMAIL_FIELD_LABEL, passwordLabel: newProps.loginPasswordFieldLabel, belowPasswordFieldHtml: DEFAULT_BELOW_PASSWORD_FIELD_HTML, submitButtonLabel: DEFAULT_LOGIN_SUBMIT_BUTTON_LABEL, additionalActionHtml: newProps.loginAdditionalActionHtml});
        enterCredential(username, password);

        // Email factor step:
        assertEmailCodeVerificationStepContentMatches({verificationCodeLabel: DEFAULT_EMAIL_CODE_VERIFICATION_FIELD_LABEL, submitButtonLabel: newProps.emailCodeVerificationSubmitButtonLabel, additionalActionHtml: `<div>${DEFAULT_EMAIL_CODE_VERIFICATION_ADDITIONAL_ACTION_HTML}</div><a href="#">${DEFAULT_EMAIL_CODE_VERIFICATION_ADDITIONAL_ACTION_RESEND_LABEL}</a>`});

        deleteSite(siteKey);
    });

    it('Should display an error when an invalid password is entered', () => {
        triggerRedirectToLoginPage(SITE_KEY);
        enterCredential(username, 'invalidPassword');
        cy.get('[data-testid="error-message"]').should(
            'contain',
            'Invalid username or password'
        );
    });

    it('Should display an error when an invalid verification code is entered', () => {
        triggerRedirectToLoginPage(SITE_KEY);
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
const triggerRedirectToLoginPage = (siteKey: string) => {
    cy.visit('/jahia', {failOnStatusCode: false});
    cy.url().should('contain', `/sites/${siteKey}/${LOGIN_PAGE_NAME}.html`);
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
