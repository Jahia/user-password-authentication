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
 */
export const assertIsNotLoggedIn = () => {
    // TODO find a more efficient way
    cy.visit('/jahia/dashboard', {failOnStatusCode: false, timeout: 30000});
    // Should match the configuration in fake.yml
    // Ensure the user gets redirected when visiting a page that requires authentication
    cy.url().should('contain', '/sites/fake/fakePage.html');
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
 * Asserts the given user is suspended by ensuring the JCR 'mfa:suspendedSince' property is set in their JCR user node
 * @param username the username to check
 */
export const assertIsSuspended = (username: string) => {
    cy.apollo({
        queryFile: 'userSuspendedSinceProperty.graphql',
        variables: {
            username: username
        }
    }).then(response => {
        // Can't compare with actual JavaScript dates (or within a range) as the property is set in the backend and might differ by a few milliseconds
        // expect(suspendedSince).to.be.within(rangeBegin, rangeEnd);
        // so we just check that the property is defined
        expect(response?.data?.admin?.userAdmin?.user?.property).to.not.be.undefined;
    });
};

/**
 * Asserts the given user is not suspended by ensuring the JCR 'mfa:suspendedSince' property is not set in their JCR user node
 * @param username the username to check
 */
const assertIsNotSuspended = (username: string) => {
    cy.apollo({
        queryFile: 'userSuspendedSinceProperty.graphql',
        variables: {
            username: username
        }
    }).then(response => {
        expect(response?.data?.admin?.userAdmin?.user?.property).to.be.null;
    });
};
