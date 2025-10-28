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
     * Assert that a success message is visible
     * @param message - Optional specific message to check for
     */
    static assertSuccessMessage(message?: string): void {
        cy.get(this.baseSelectors.successMessage).should('be.visible');
        if (message) {
            cy.get(this.baseSelectors.successMessage).should('contain.text', message);
        }
    }

    /**
     * Assert that an error message is visible
     * @param message - Optional specific message to check for
     */
    static assertErrorMessage(message?: string): void {
        cy.get(this.baseSelectors.errorMessage).should('be.visible');
        if (message) {
            cy.get(this.baseSelectors.errorMessage).should('contain.text', message);
        }
    }

    /**
     * Assert that no error message is present on the page
     */
    static assertErrorsAbsense(): void {
        cy.get(this.baseSelectors.errorMessage).should('not.exist');
    }
}
