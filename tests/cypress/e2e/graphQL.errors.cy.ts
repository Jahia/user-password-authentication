import 'cypress-mailpit';
import {
    createUserForMFA,
    initiate, initiateAndExpectError,
    installMFAConfig,
    prepareEmailCodeFactor,
    prepareEmailCodeFactorAndExpectError
} from './utils';
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
            initiateAndExpectError(username, password, 'authentication_failed');
        });
    });

    it('Should throw an error when a factor is requested twice, then should pass after the timeout', () => {
        cy.log('1- initiate');
        initiate(usr, pwd);

        cy.log('2- prepare');
        prepareEmailCodeFactor();

        cy.log('3- prepare again');
        prepareEmailCodeFactorAndExpectError('prepare.rate_limit_exceeded', {
            nextRetryInSeconds: value => expect(parseInt(value, 10)).to.be.greaterThan(0),
            factorType: value => expect(value).to.eq('email_code'),
            user: value => expect(value).to.eq('test_mfa_user')
        });

        cy.log('4- wait for end of timeout');
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(3000);
        cy.log('5- prepare after timeout should pass');
        prepareEmailCodeFactor();
    });
});
