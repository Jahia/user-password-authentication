import 'cypress-mailpit';
import {createUserForMFA, initiate, installConfig, prepare} from './utils';
import {deleteUser} from '@jahia/cypress';

const userName = 'test_mfa_user';
const password = 'password';
const email = 'testmfauser@example.com';

describe('Error scenarios common to all factors', () => {
    before(() => {
        createUserForMFA(userName, password, email);
        installConfig('cfg/org.jahia.modules.mfa.cfg');
    });
    after(() => {
        deleteUser(userName);
    });

    it('Should throw an error when invalid credential is provided', () => {
        initiate('unknownUser', 'myPassword', 'Invalid username or password');
    });

    it('Should throw an error when an unregistered factor gets prepared', () => {
        cy.log('1- initiate');
        initiate(userName, password);

        cy.log('2- prepare');
        prepare('unknown_factor', 'Factor type not supported: unknown_factor');
    });
});
