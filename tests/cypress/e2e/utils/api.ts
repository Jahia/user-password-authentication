/**
 * Initiates the MFA process for a given user and asserts the expected outcome.
 *
 * @param username - The username to authenticate.
 * @param password - The password for the user.
 * @param expectedError - Optional. If provided, asserts that the error matches this value. If not provided, assumes it's a success
 */
export function initiate(username: string, password: string, expectedError:string = undefined) {
    cy.apollo({
        queryFile: 'initiate.graphql',
        variables: {
            username: username,
            password: password
        }
    }).then(response => {
        if (expectedError) {
            expect(response?.data?.mfa?.initiate?.error).to.eq(expectedError);
        } else {
            expect(response?.data?.mfa?.initiate?.success).to.be.true;
        }
    });
}

/**
 * Prepares an MFA factor and asserts the expected outcome.
 *
 * @param factorType - The type of MFA factor to prepare.
 * @param expectedRequiredFactor - The expected required factor type.
 * @param expectedError - Optional. If provided, asserts that the error matches this value. If not provided, assumes it's a success
 */
export function prepare(factorType: string, expectedRequiredFactor: string = factorType, expectedError: string = undefined) {
    cy.apollo({
        queryFile: 'prepareFactor.graphql',
        variables: {
            factorType: factorType
        }
    }).then(response => {
        if (expectedError) {
            expect(response?.data?.mfa?.prepareFactor?.success).to.be.false;
            expect(response?.data?.mfa?.prepareFactor?.error).to.contain(expectedError);
            expect(response?.data?.mfa?.prepareFactor?.sessionState).to.eq('failed');
        } else {
            expect(response?.data?.mfa?.prepareFactor?.success).to.be.true;
            expect(response?.data?.mfa?.prepareFactor?.sessionState).to.eq('in_progress');
        }

        expect(response?.data?.mfa?.prepareFactor?.requiredFactors).to.be.a('array').and.have.length(1);
        expect(response?.data?.mfa?.prepareFactor?.requiredFactors[0]).to.eq(expectedRequiredFactor);
    });
}

