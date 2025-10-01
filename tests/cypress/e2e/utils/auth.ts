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
 * Asserts the given user is logged by ensuring they can access the Jahia Dashboard
 * @param username
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
};
