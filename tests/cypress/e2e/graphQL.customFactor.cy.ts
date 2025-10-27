import {deleteSite, deleteUser} from '@jahia/cypress';
import {
    createSiteWithLoginPage,
    createUserForMFA,
    deleteAllEmails,
    initiate,
    installMFAConfig,
    SessionState
} from './utils';
import {faker} from '@faker-js/faker';

describe('Tests for the GraphQL APIs related to the CustomFactorProvider', () => {
    let siteKey: string;
    let username: string;
    let password: string;
    let email: string;

    before(() => {
        siteKey = 'custom-factor-' + faker.lorem.slug();
        createSiteWithLoginPage(siteKey);
    });

    beforeEach(() => {
        installMFAConfig('custom-factor.yml');
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
        deleteSite(siteKey);
    });

    it('Should be able to authenticate with a custom factor', () => {
        initiate(username, password, siteKey);
        const offset = 123;
        prepareCustomFactor(offset);
        const expectedNumber = 123579; // 123456 + offset = 123579
        verifyCustomFactor(expectedNumber);
    });
});

function prepareCustomFactor(offset: number) {
    cy.log('Preparing custom factor and asserting success...');
    cy.apollo({
        queryFile: 'custom/prepare.graphql',
        context: {
            headers: {
                'X-offset': String(offset)
            }
        }
    }).then(response => {
        cy.log('Response for prepareCustomFactor():', JSON.stringify(response, null, 2));
        expect(response?.data?.mfa?.factors?.custom?.prepare?.session?.state).to.eq(SessionState.PREPARED);
        expect(response?.data?.mfa?.factors?.custom?.prepare?.session?.requiredFactors).to.be.a('array').and.have.length(1);
        expect(response?.data?.mfa?.factors?.custom?.prepare?.session?.requiredFactors[0]).to.eq('custom');
        expect(response?.data?.mfa?.factors?.custom?.prepare?.error).to.be.null;
    });
}

function verifyCustomFactor(number: number) {
    cy.log('Verifying custom factor and asserting success...');
    cy.apollo({
        queryFile: 'custom/verify.graphql',
        variables: {
            number: number
        }
    }).then(response => {
        cy.log('Response for verifyCustomFactor():', JSON.stringify(response, null, 2));
        expect(response?.data?.mfa?.factors?.custom?.verify?.session?.state).to.eq(SessionState.COMPLETED);
        expect(response?.data?.mfa?.factors?.custom?.verify?.session?.requiredFactors).to.be.a('array').and.have.length(1);
        expect(response?.data?.mfa?.factors?.custom?.verify?.session?.requiredFactors[0]).to.eq('custom');
        expect(response?.data?.mfa?.factors?.custom?.verify?.error).to.be.null;
    });
}
