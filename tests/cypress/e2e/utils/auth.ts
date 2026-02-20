import {addUserToGroup, createUser, deleteUser, getUserPath} from '@jahia/cypress';

/**
 * Creates a user for the needs of the MFA. It first deletes the user matching this username that may already exist.
 * @param username the username to create
 * @param password the password associated with this username to create
 * @param email (optional) the user's email address
 * @param preferredLanguage (optional) the user's preferred language, defaults to 'en'
 */
export const createUserForMFA = (username: string, password: string, email:string = undefined, preferredLanguage = 'en'): void => {
    // Delete the user that may already exist
    getUserPath(username).then(response => {
        if (response?.data?.admin?.userAdmin?.user) {
            cy.log('Deleting user ' + username + ' before creating it...');
            deleteUser(username);
        }
    });
    const properties = [
        {name: 'preferredLanguage', value: preferredLanguage},
        {name: 'j:firstName', value: ''},
        {name: 'j:lastName', value: ''}
    ];
    if (email) {
        properties.push({name: 'j:email', value: email});
    }

    createUser(username, password, properties);
    addUserToGroup(username, 'privileged'); // Needed to access jahia/dashboard
    cy.log('User (username=' + username + ', password=' + password + ', email=' + email + ') created');
};

/**
 * Asserts the current user is not logged in by checking if the currentUser GraphQL query fails
 * @param redirectedUrl the expected redirect URL
 */
export const assertIsNotLoggedIn = (redirectedUrl: string) => {
    // TODO find a more efficient way
    cy.visit('/jahia/dashboard', {failOnStatusCode: false, timeout: 30000});
    // Ensure the user gets redirected when visiting a page that requires authentication
    cy.url().should('contain', redirectedUrl);
};

/**
 * Asserts the given user is logged by ensuring they can access the Jahia Dashboard and that they are not suspended.
 * @param username the username to check
 */
export const assertIsLoggedIn = (username: string) => {
    // TODO find better way to ensure the user is logged in
    // TODO: consider develop a custom apollo client able to reuse the current session cookie
    cy.visit('/jahia/dashboard');
    cy.waitUntil(() => {
        return cy.get('body').then($body => {
            return $body.text().includes(`${username}`);
        });
    }, {
        errorMsg: `Welcome message for ${username} not found`,
        timeout: 10000,
        interval: 1000
    });
    // Also ensure the user is not suspended
    assertIsNotSuspended(username);
};

/**
 * Asserts that the current cookies match the expected cookie names.
 * First verifies that all expected cookies are present, then checks that the total count matches exactly.
 * @param cookiesNames the array of expected cookie names
 */
export const assertCookiesMatch = (cookiesNames:string[]) => {
    cy.getCookies().should(cookies => {
        const cookieNames = cookies.map(cookie => cookie.name);
        expect(cookieNames, `Expected cookies: [${cookiesNames.join(', ')}], but found: [${cookieNames.join(', ')}]`).to.include.members(cookiesNames);
        expect(cookies, `Expected ${cookiesNames.length} cookie(s), but got ${cookies.length}: [${cookieNames.join(', ')}]`).to.have.length(cookiesNames.length);
    });
};

/**
 * Asserts the given user is suspended by ensuring the JCR 'upa:mfaSuspendedSince' property is set in their JCR user node
 * @param username the username to check
 */
export const assertIsSuspended = (username: string) => {
    cy.apollo({
        queryFile: 'suspendedUserDetails.graphql',
        variables: {
            username: username
        }
    }).then(response => {
        // Can't compare with actual JavaScript dates (or within a range) as the property is set in the backend and might differ by a few milliseconds
        // expect(suspendedSince).to.be.within(rangeBegin, rangeEnd);
        // so we just check that the property is defined
        expect(response?.data?.admin?.userAdmin?.user?.property).to.not.be.undefined;
        // And check the mixin is present
        expect(response?.data?.admin?.userAdmin?.user?.node?.mixinTypes).to.be.a('array').and.have.length(1);
        expect(response?.data?.admin?.userAdmin?.user?.node?.mixinTypes[0]?.name).to.eq('upa:mfaSuspendedUser');
    });
};

/**
 * Asserts the given user is not suspended by ensuring the JCR 'upa:mfaSuspendedSince' property is not set in their JCR user node
 * @param username the username to check
 */
const assertIsNotSuspended = (username: string) => {
    cy.apollo({
        queryFile: 'suspendedUserDetails.graphql',
        variables: {
            username: username
        }
    }).then(response => {
        expect(response?.data?.admin?.userAdmin?.user?.property, 'the upa:mfaSuspendedUser property should not be set').to.be.null;
        expect(response?.data?.admin?.userAdmin?.user?.node?.mixinTypes, 'the upa:mfaSuspendedUser mixin should not exist on the user node').to.be.empty;
    });
};
