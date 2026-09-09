import {deleteSite, deleteUser, jfaker} from '@jahia/cypress';
import {EmailFactorStep, LoginStep} from './pages';
import {
    createSiteWithLoginPage,
    createUserForMFA,
    deleteAllEmails,
    getLoginPageURL,
    installMFAConfig,
    updateSiteLoginPageProps
} from './utils';

const SITE_KEY = 'sample-richtext';

/**
 * Rich text as the Content Editor can store it in the authentication component: the formatting
 * these fields are meant to carry, plus tags and attributes outside that set. Attribute values are
 * single-quoted because the value travels through a GraphQL string literal.
 */
const AUTHORED_HTML = '<p class=\'hint\'>Need <strong>help</strong>?</p>' +
    '<a href=\'https://www.jahia.com/\' target=\'_blank\'>Contact us</a>' +
    '<img src=\'x\' onerror=\'globalThis.upaRichtextMarker = true\'>' +
    '<iframe src=\'https://www.jahia.com/\'></iframe>';

/**
 * Asserts that the element renders the formatting the fields support, and nothing else.
 * The first three assertions are what makes the last three meaningful: they establish that the
 * authored value did reach the page.
 */
const assertRendersSupportedFormatting = (selector: string): void => {
    cy.get(selector).find('strong').should('have.text', 'help');
    cy.get(selector).find('a').should('have.attr', 'href', 'https://www.jahia.com/');
    cy.get(selector).find('a').should('have.attr', 'target', '_blank');
    cy.get(selector).find('img').should('not.have.attr', 'onerror');
    cy.get(selector).find('iframe').should('not.exist');
    cy.window().should(window => {
        expect(window).to.not.have.property('upaRichtextMarker');
    });
};

describe('Rich text properties of the authentication component', () => {
    let username: string;
    let password: string;
    let email: string;

    before(() => {
        createSiteWithLoginPage(SITE_KEY);
        installMFAConfig(`${SITE_KEY}.yml`);
    });

    after(() => {
        deleteSite(SITE_KEY);
    });

    it('Should render the supported formatting on the login step, server-side and in the browser', () => {
        updateSiteLoginPageProps(SITE_KEY, {
            loginBelowPasswordFieldHtml: AUTHORED_HTML,
            loginAdditionalActionHtml: AUTHORED_HTML
        });

        // The page as an anonymous visitor receives it, before any script runs
        cy.logout();
        cy.request(getLoginPageURL(SITE_KEY)).then(response => {
            expect(response.status).to.eq(200);
            const belowPasswordField = /<div data-testid="below-password-field"[^>]*>([\S\s]*?)<\/div>/.exec(response.body as string);
            expect(belowPasswordField, 'the field must be server-rendered for the checks below to mean anything').to.not.eq(null);
            expect(belowPasswordField[1]).to.contain('<strong>help</strong>');
            expect(belowPasswordField[1]).to.not.contain('onerror');
            expect(belowPasswordField[1]).to.not.contain('<iframe');
        });

        cy.visit(getLoginPageURL(SITE_KEY));
        assertRendersSupportedFormatting('[data-testid="below-password-field"]');
        assertRendersSupportedFormatting('[data-testid="additional-action"]');
    });

    it('Should render the supported formatting on the email code step', () => {
        username = jfaker.internet.username();
        password = jfaker.internet.password();
        email = jfaker.internet.email();
        createUserForMFA(username, password, email);
        deleteAllEmails();

        updateSiteLoginPageProps(SITE_KEY, {
            emailCodeVerificationAdditionalActionHtml: AUTHORED_HTML
        });

        LoginStep.triggerRedirect(SITE_KEY);
        LoginStep.login(username, password);
        LoginStep.selectEmailCodeFactor();
        EmailFactorStep.assertHeaderTitleMatches();

        assertRendersSupportedFormatting('[data-testid="additional-action"]>div');

        deleteAllEmails();
        deleteUser(username);
    });
});
