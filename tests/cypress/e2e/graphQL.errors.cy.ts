import 'cypress-mailpit';
import {createUserForMFA, initiate, installMFAConfig, prepare} from './utils';
import {deleteUser} from '@jahia/cypress';

const usr = 'test_mfa_user';
const pwd = 'password';
const email = 'testmfauser@example.com';

describe('Error scenarios common to all factors', () => {
    before(() => {
        createUserForMFA(usr, pwd, email);
        installMFAConfig('fake.yml');
    });

    after(() => {
        deleteUser(usr);
        installMFAConfig('disabled.yml');
    });

    // Invalid cases for the test user to be checked
    const INVALID_CASES = [
        {
            description: 'invalid username',
            username: 'unknownUser',
            password: pwd
        },
        {
            description: 'invalid password',
            username: usr,
            password: 'myPassword'
        },
        {
            description: 'empty username',
            username: '',
            password: pwd
        },
        {
            description: 'empty password',
            username: usr,
            password: ''
        }
    ];

    INVALID_CASES.forEach(({description, username, password}) => {
        it(`Should throw an error when ${description} is provided`, () => {
            initiate(username, password, 'Invalid username or password');
        });
    });

    it('Should throw an error when an unregistered factor gets prepared', () => {
        cy.log('1- initiate');
        initiate(usr, pwd);

        cy.log('2- prepare');
        prepare('unknown_factor', 'Factor type not supported: unknown_factor');
    });
});
