import {addUserToGroup, createUser, deleteUser, getUserPath} from '@jahia/cypress';

/**
 * Creates a user for the needs of the MFA. It first deletes the user matching this username that may already exist.
 * @param userName the username to create
 * @param password the password associated to this username to create
 * @param email (optional) the user's email address
 */
export const createUserForMFA = (userName: string, password: string, email:string = undefined): void => {
    // Delete the user that may already exist
    getUserPath(userName).then(response => {
        if (response?.data?.admin?.userAdmin?.user) {
            cy.log('Deleting user ' + userName + ' before creating it...');
            deleteUser(userName);
        }
    });
    const properties = [
        {name: 'preferredLanguage', value: 'en'},
        {name: 'j:firstName', value: ''},
        {name: 'j:lastName', value: ''}
    ];
    if (email) {
        properties.push({name: 'j:email', value: email});
    }

    createUser(userName, password, properties);
    addUserToGroup(userName, 'privileged'); // Needed to access jahia/dashboard
    cy.log('User ' + userName + ' created');
};

/**
 * Asserts the current user is not logged in by ensuring the user gets redirected to the login page when accessing the Dashboard
 */
export const assertIsNotLoggedIn = () => {
    // TODO find a more efficient way
    cy.visit('/jahia/dashboard', {failOnStatusCode: false});
    // Should match the configuration in fake.yml
    // Ensure the user gets redirected when visiting a page that requires authentication
    cy.url().should('contain', '/sites/fake/fakePage.html');
};

/**
 * Asserts the given user is logged by ensuring they can access the Jahia Dashboard
 * @param username
 */
export const assertIsLoggedIn = (username: string) => {
    // TODO find a more efficient way
    cy.visit('/jahia/dashboard');
    cy.contains('p', `Welcome ${username} to Jahia 8`);
};
