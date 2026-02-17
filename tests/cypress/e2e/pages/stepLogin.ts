import {BasePage} from './basePage';
import {getLoginPageURL, I18N} from '../utils';

/**
 * Page Object for MFA Login page
 * Contains all DOM selectors and page interaction methods
 */
export class LoginStep extends BasePage {
    // Login page name - should match the MFA configuration!
    public static readonly PAGE_NAME = 'myLoginPage';
    private static readonly REDIRECT_TRIGGER = '/jahia';

    // Page element selectors
    private static readonly selectors = {
        // Username label and input field
        labelUsername: 'form label[for="username"]',
        inputUsername: '[data-testid="login-username"]',
        // Password label and input field
        labelPassword: 'form label[for="password"]',
        inputPassword: '[data-testid="login-password"]',
        // Password label and input field
        labelRememberMe: 'form label[for="rememberMe"]',
        inputRememberMe: '[data-testid="login-remember-me"]',
        // Additional text/action below the password field (e.g., "Forgot password?")
        belowPasswordField: '[data-testid="below-password-field"]',
        // Submit button on Login page
        buttonSubmit: '[data-testid="login-submit"]',
        // Additional action on Login page (e.g., "Don't have a Jahia Cloud account? Create an account")
        additionalAction: '[data-testid="additional-action"]'
    };

    /**
     * Triggers redirect to the login page of the specified site
     * @param {string} siteKey Site key where the login page is located
     * @param language Language code to use for the login page URL (optional)
     * @param rememberMeChecked whether the "remember me" is expected to be checked or not. `undefined` means no check is perform
     */
    static triggerRedirect(siteKey: string, language: string = undefined, rememberMeChecked: boolean = undefined): void {
        cy.logout(); // Ensure to start with an unauthenticated session
        cy.visit(this.REDIRECT_TRIGGER, {failOnStatusCode: false});
        LoginStep.assertOnLoginPage(siteKey, language, rememberMeChecked);
    }

    /**
     * Login with username and password
     * @param username - The username to login with
     * @param password - The password to login with
     * @param rememberMe - Whether to remember the user being logged in (optional, default: true)
     */
    static login(username: string, password: string, rememberMe: boolean = undefined): void {
        cy.log(String('Authenticating with credentials: ' + username + ' / ' + password));
        cy.get(this.selectors.inputUsername).should('be.visible');
        cy.get(this.selectors.inputUsername).type(username);
        cy.get(this.selectors.inputPassword).type(password);
        if (rememberMe === true) {
            cy.get(this.selectors.inputRememberMe).check();
        } else if (rememberMe === false) {
            cy.get(this.selectors.inputRememberMe).uncheck();
        }

        cy.get(this.selectors.buttonSubmit).click();
    }

    static waitForEmptyLoginForm(): void {
        cy.get(this.selectors.inputUsername).should('be.visible').and('have.value', '');
    }

    /**
     * Select email code factor (if multiple factors are available)
     */
    static selectEmailCodeFactor(): void {
        cy.log('Selecting the email factor');
        // Not supported yet, skipping for now
        // TODO once we add the support for selecting the email factor from the list of available factors
        //   cy.get('[data-testid="available-factors"]').should('be.visible');
        //   cy.get('[data-testid="email_code-select-factor-button"]').click();
    }

    /**
     * Assert that the login page content matches the expected values
     * @param {Object} params - The expected content parameters
     * @param {string} params.emailLabel - Expected label for the email/username field
     * @param {string} params.passwordLabel - Expected label for the password field
     * @param {string} params.belowPasswordFieldHtml - Expected content below the password field
     * @param {string} params.submitButtonLabel - Expected label for the submit button
     * @param {string} params.additionalActionHtml - Expected content for the additional action section
     */
    static assertContentMatches({
        emailLabel,
        passwordLabel,
        belowPasswordFieldHtml,
        submitButtonLabel,
        additionalActionHtml
    }: {
        emailLabel?: string;
        passwordLabel?: string;
        belowPasswordFieldHtml?: string;
        submitButtonLabel?: string;
        additionalActionHtml?: string;
    } = {}) {
        // Use default i18n values if specific values are not provided
        const content = {
            emailLabel: emailLabel ?? I18N.labels[I18N.defaultLanguage].loginEmailLabel,
            passwordLabel: passwordLabel ?? I18N.labels[I18N.defaultLanguage].loginPasswordLabel,
            belowPasswordFieldHtml: belowPasswordFieldHtml ?? I18N.labels[I18N.defaultLanguage].loginBelowPasswordFieldHTML,
            submitButtonLabel: submitButtonLabel ?? I18N.labels[I18N.defaultLanguage].loginSubmitButtonLabel,
            additionalActionHtml: additionalActionHtml ?? I18N.labels[I18N.defaultLanguage].loginAdditionalActionHTML
        };

        cy.get(this.selectors.labelUsername).should('have.text', content.emailLabel);
        cy.get(this.selectors.labelPassword).should('have.text', content.passwordLabel);
        cy.get(this.selectors.belowPasswordField).should('have.html', content.belowPasswordFieldHtml);
        cy.get(this.selectors.buttonSubmit).should('have.text', content.submitButtonLabel);
        cy.get(this.selectors.additionalAction).should('have.html', content.additionalActionHtml);
    }

    static assertOnLoginPage(siteKey: string, language: string = undefined, rememberMeChecked: boolean = undefined): void {
        cy.url().should('contain', getLoginPageURL(siteKey, language));
        cy.get(this.selectors.inputUsername).should('exist');
        cy.get(this.selectors.inputPassword).should('exist');
        if (rememberMeChecked === true) {
            cy.get(this.selectors.inputRememberMe).should('be.checked');
        } else if (rememberMeChecked === false) {
            cy.get(this.selectors.inputRememberMe).should('not.be.checked');
        }
    }
}
