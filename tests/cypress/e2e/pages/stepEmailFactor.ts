/**
 * Page Object for MFA Email Factor verification page
 * Contains all DOM selectors and page interaction methods
 */

import {BasePage} from './basePage';
import {I18N} from '../utils';

export class EmailFactorStep extends BasePage {
    // Page element selectors
    private static readonly selectors = {
        // Page title
        pageTitle: 'main>jsm-island>div>h2',
        // Verification code label and input field
        labelVerificationCode: 'form label[for="verificationCode"]',
        inputVerificationCode: '[data-testid="verification-code"]',
        // Submit button
        buttonSubmit: '[data-testid="verification-submit"]',
        // Additional action
        additionalAction: 'div.additionalAction>div',
        // Resend code link
        linkResendCode: 'div.additionalAction>a',

        // Messages and notifications
        verificationSentMessage: 'main>jsm-island>div>div',
        verificationRedirectURL: '[data-testid="success-message"]>div>div:nth-child(1)',
        verificationRedirectCountdown: '[data-testid="success-message"]>div>div:nth-child(2)',
        verificationRedirectButton: '[data-testid="success-message"]>div>button',

        // General page elements
        mainContent: 'main>jsm-island>div>div'
    };

    /**
     * Submits verification code
     * @param code - The 6-digit verification code
     */
    static submitVerificationCode(code: string): void {
        cy.log(`Submitting verification code: "${code}"`);
        cy.get(this.selectors.inputVerificationCode).clear();
        cy.get(this.selectors.inputVerificationCode).type(code);
        cy.get(this.selectors.buttonSubmit).click();
    }

    /**
     * Click the resend code link
     */
    static resendCode(): void {
        cy.get(this.selectors.linkResendCode).click();
    }

    /**
     * Assert that the MFA Code Verification page content matches the expected values
     * @param {Object} params - The expected content parameters
     * @param {string} params.verificationCodeLabel - Expected label for the verification code field
     * @param {string} params.submitButtonLabel - Expected label for the submit button
     * @param {string} params.additionalActionHtml - Expected content for the additional action section
     * @param {string} params.resendCodeLink - Expected label for the resend code link
     */
    static assertContentMatches({
        verificationCodeLabel,
        submitButtonLabel,
        additionalActionHtml,
        resendCodeLink
    }: {
        verificationCodeLabel?: string;
        submitButtonLabel?: string;
        additionalActionHtml?: string;
        resendCodeLink?: string;
    } = {}) {
        // Use default i18n values if specific values are not provided
        const content = {
            verificationCodeLabel: verificationCodeLabel ?? I18N.labels[I18N.defaultLanguage].emailCodeVerificationLabel,
            submitButtonLabel: submitButtonLabel ?? I18N.labels[I18N.defaultLanguage].emailCodeVerificationSubmitButtonLabel,
            additionalActionHtml: additionalActionHtml ?? I18N.labels[I18N.defaultLanguage].emailCodeVerificationAdditionalActionHTML,
            resendCodeLink: resendCodeLink ?? I18N.labels[I18N.defaultLanguage].emailCodeVerificationAdditionalActionResendLabel
        };

        cy.get(this.selectors.labelVerificationCode).should('have.text', content.verificationCodeLabel);
        cy.get(this.selectors.buttonSubmit).should('have.text', content.submitButtonLabel);
        cy.get(this.selectors.additionalAction).should('have.html', content.additionalActionHtml);
        cy.get(this.selectors.linkResendCode).should('have.text', content.resendCodeLink);
    }

    /**
     * Assert that the MFA Code Verification page title matches the expected value
     * @param {string} pageTitle - The expected page title (default: from i18n)
     */
    static assertHeaderTitleMatches(pageTitle: string = I18N.locales[I18N.defaultLanguage]['header.title']): void {
        cy.get(this.selectors.pageTitle).should('have.text', pageTitle);
    }

    /**
     * Assert that the verification code sent message is displayed
     * @param {string} email - The email address to verify in the message
     */
    static assertVerificationCodeSentMessage(email: string): void {
        cy.get(this.selectors.verificationSentMessage)
            .should('contain.text', I18N.locales[I18N.defaultLanguage]['factor.email_code.verification_code_has_been_sent'].replace('{{maskedEmail}}', this.maskEmail(email)));
    }

    /**
     * Assert that the redirect URL message is displayed
     * @param {string} redirectUrl - The expected redirect URL
     */
    static assertRedirectUrlMessage(redirectUrl: string): void {
        cy.get(this.selectors.verificationRedirectURL)
            .should('contain.html', I18N.locales[I18N.defaultLanguage]['complete.redirect_url'].replace('{{redirectUrl}}', redirectUrl));
    }

    /**
     * Assert that the countdown message is displayed
     * @param {integer} countdownSeconds - The countdown seconds
     */
    static assertCountdownMessage(countdownSeconds: number): void {
        cy.get(this.selectors.verificationRedirectCountdown)
            .should('contain.text', I18N.locales[I18N.defaultLanguage]['complete.redirecting_countdown'].replace('{{countdown}}', countdownSeconds.toString()));
    }

    /**
     * Clicks the "Go now" redirect button
     */
    static clickRedirectNowButton(): void {
        cy.log(`Clicking the "${I18N.locales[I18N.defaultLanguage]['complete.redirecting_go_label']}" redirect button`);
        cy.get(this.selectors.verificationRedirectButton).should('have.text', I18N.locales[I18N.defaultLanguage]['complete.redirecting_go_label']);
        cy.get(this.selectors.verificationRedirectButton).click();
    }

    /**
     * Masks the username part of an email address.
     * @param {string} email - The email address to mask.
     * @returns {string} - The masked email address.
     */
    private static maskEmail = (email: string) => {
        const [username, domain] = email.split('@');

        return username[0] + '***' + username[username.length - 1] + '@' + domain;
    };
}
