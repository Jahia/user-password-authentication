// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
import 'cypress-wait-until';
import 'cypress-mailpit';

// Logs all cookies in a detailed format
Cypress.Commands.add('logAllCookies', () => {
    cy.getCookies().then(cookies => {
        if (cookies.length === 0) {
            cy.log('No cookies found');
            cy.log('No cookies found');
            return;
        }

        cy.log('\n' + '='.repeat(60));
        cy.log(`COOKIES REPORT - Total: ${cookies.length}`);
        cy.log('='.repeat(60));

        const sessionCookies = cookies.filter(c => !c.expiry);
        const persistentCookies = cookies.filter(c => c.expiry);

        cy.log(`📊 Session Cookies: ${sessionCookies.length}`);
        cy.log(`📊 Persistent Cookies: ${persistentCookies.length}`);

        cookies.forEach((cookie, index) => {
            const cookieType = cookie.expiry ? '🔒 Persistent' : '⏱️  Session';
            const expiryDate = cookie.expiry ? new Date(cookie.expiry * 1000).toISOString() : 'Session only';
            const daysUntilExpiry = cookie.expiry ? Math.round(((cookie.expiry * 1000) - Date.now()) / 1000 / 60 / 60 / 24) : null;

            cy.log('\n' + '-'.repeat(60));
            cy.log(`Cookie #${index + 1}: ${cookie.name}`);
            cy.log('-'.repeat(60));
            cy.log(`Type:       ${cookieType}`);
            cy.log(`Value:      ${cookie.value}`);
            cy.log(`Domain:     ${cookie.domain}`);
            cy.log(`Path:       ${cookie.path}`);
            cy.log(`Secure:     ${cookie.secure ? '✅ Yes' : '❌ No'}`);
            cy.log(`HttpOnly:   ${cookie.httpOnly ? '✅ Yes' : '❌ No'}`);
            cy.log(`SameSite:   ${cookie.sameSite || '(not set)'}`);

            if (cookie.expiry) {
                cy.log(`Expires:    ${expiryDate}`);
                cy.log(`Days left:  ${daysUntilExpiry} days`);
                cy.log(`Unix time:  ${cookie.expiry}`);
            } else {
                cy.log('Expires:    When browser closes (session cookie)');
            }
        });
    });
});

// Log specific cookie
Cypress.Commands.add('logCookie', cookieName => {
    cy.getCookie(cookieName).then(cookie => {
        if (!cookie) {
            cy.log(`Cookie "${cookieName}" not found`);
            cy.log(`Cookie "${cookieName}" not found`);
            return;
        }

        const cookieType = cookie.expiry ? '🔒 Persistent' : '⏱️  Session';
        const expiryDate = cookie.expiry ? new Date(cookie.expiry * 1000).toISOString() : 'Session only';
        const daysUntilExpiry = cookie.expiry ? Math.round(((cookie.expiry * 1000) - Date.now()) / 1000 / 60 / 60 / 24) : null;

        cy.log('\n' + '-'.repeat(60));
        cy.log(`Cookie: ${cookie.name}`);
        cy.log('-'.repeat(60));
        cy.log(`Type:       ${cookieType}`);
        cy.log(`Value:      ${cookie.value}`);
        cy.log(`Domain:     ${cookie.domain}`);
        cy.log(`Path:       ${cookie.path}`);
        cy.log(`Secure:     ${cookie.secure ? '✅ Yes' : '❌ No'}`);
        cy.log(`HttpOnly:   ${cookie.httpOnly ? '✅ Yes' : '❌ No'}`);
        cy.log(`SameSite:   ${cookie.sameSite || '(not set)'}`);

        if (cookie.expiry) {
            cy.log(`Expires:    ${expiryDate}`);
            cy.log(`Days left:  ${daysUntilExpiry} days`);
            cy.log(`Unix time:  ${cookie.expiry}`);
        } else {
            cy.log('Expires:    When browser closes (session cookie)');
        }
    });
});

Cypress.Commands.add('clearCookiesByType', (type = 'session') => {

    cy.getCookies().then(cookies => {
        let cookiesToClear = cookies.filter(cookie => type === 'session' ? !cookie.expiry : cookie.expiry);

        cy.log(`\n🗑️  Clearing ${cookiesToClear.length} ${type} cookie(s):`);
        cookiesToClear.forEach(cookie => {
            const info = cookie.expiry ? `expires ${new Date(cookie.expiry * 1000).toISOString()}` : 'session only';
            cy.log(`  - ${cookie.name} (${info})`);
            cy.clearCookie(cookie.name);
        });

        cy.log(`Cleared ${cookiesToClear.length} ${type} cookie(s)`);
    });
});

// Helper to simulate full browser close
Cypress.Commands.add('simulateBrowserClose', () => {
    cy.log('Simulating browser close...');

    // Clear all storage
    cy.clearLocalStorage();
    cy.clearAllSessionStorage();

    // Clear session cookies only
    cy.clearCookiesByType('session');

    cy.log('Browser close simulated (storage + session cookies cleared)');
});
