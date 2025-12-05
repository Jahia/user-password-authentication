import {getLoginPageURL} from '../utils';

/**
 * BasePage class containing common methods and selectors for page interactions
 */
export class BasePage {
    private static readonly baseSelectors = {
        // Messages and notifications
        errorMessage: '[data-testid="error-message"]',
        successMessage: '[data-testid="success-message"]'
    };

    /**
     * Assert that the user is successfully redirected
     * @param siteKey - The site key of the site to check for
     * @param language - Optional the language of the site to check for
     * @param redirectUrl - Optional the expected redirect URL
     */
    static assertSuccessfullyRedirected(siteKey: string, language?: string, redirectUrl?: string): void {
        cy.url().should('not.include', getLoginPageURL(siteKey, language));
        if (redirectUrl) {
            cy.url().should('include', redirectUrl);
        }
    }

    /**
     * Assert that an error message is visible
     * @param {string | RegExp} message - Optional specific message to check for. Can be a string or a regular expression.
     */
    static assertErrorMessage(message?: string | RegExp): void {
        cy.get(this.baseSelectors.errorMessage).should('be.visible');
        if (typeof message === 'string') {
            cy.get(this.baseSelectors.errorMessage).should('contain.text', message);
        } else if (message instanceof RegExp) {
            cy.get(this.baseSelectors.errorMessage).invoke('text').should('match', message);
        }
    }

    /**
     * Assert that no error message is present on the page
     */
    static assertNoErrors(): void {
        cy.get(this.baseSelectors.errorMessage).should('not.exist');
    }
}
