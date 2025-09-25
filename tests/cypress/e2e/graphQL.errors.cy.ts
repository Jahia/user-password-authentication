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
        prepare('unknown_factor', 'email_code', 'Factor type not supported: unknown_factor');
    });

    it('Should throw an error when a factor is requested twice, then should pass after the timeout', () => {
        cy.log('1- initiate');
        initiate(usr, pwd);

        cy.log('2- prepare');
        prepare('email_code');

        cy.log('3- prepare again');
        prepare('email_code', 'email_code', `The factor email_code already generated for user ${usr}`);

        cy.log('4- wait for end of timeout');
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(3000);
        cy.log('5- prepare after timeout should pass');
        prepare('email_code');
    });
});
