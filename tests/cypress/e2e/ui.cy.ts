import {deleteSite, deleteUser} from '@jahia/cypress';
import {faker} from '@faker-js/faker';
import {EmailFactorStep, LoginStep} from './pages';
import {
    assertIsLoggedIn,
    createSiteWithLoginPage,
    createUserForMFA,
    deleteAllEmails,
    getVerificationCode,
    installMFAConfig
} from './utils';

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
});
