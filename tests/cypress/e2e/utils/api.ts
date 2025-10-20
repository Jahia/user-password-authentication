export interface Error {
    code: string;
    arguments?: Array<{ name: string; value: string }>;
}

/**
 * Initiates the MFA process for a given user and asserts the expected outcome.
 *
 * @param username - The username to authenticate.
 * @param password - The password for the user.
 * @param site  Optional. The site to authenticate against. The authentication is global if not specified.
 * @param expectedError - Optional. If provided, asserts that the error matches this value. If not provided, assumes it's a success
 */
export function initiate(username: string, password: string, site: string = undefined) {
    cy.log('Initiating MFA process for user ' + username + ' and asserting success...');
    cy.apollo({
        queryFile: 'initiate.graphql',
        variables: {
            username: username,
            password: password,
            site: site
        }
    }).then(response => {
        cy.log('Response for initiate():', JSON.stringify(response, null, 2));
        expect(response?.data?.mfa?.initiate?.success).to.be.true;
    });
}

export function initiateAndExpectError(username: string, password: string, errorCode: string,
    argumentAssertions?: { [key: string]: (value: string) => void }) {
    cy.log('Initiating MFA process for user ' + username + ' and asserting failure...');
    cy.apollo({
        queryFile: 'initiate.graphql',
        variables: {
            username: username,
            password: password
        }
    }).then(response => {
        cy.log('Response for initiateAndExpectError():', JSON.stringify(response, null, 2));
        expect(response?.data?.mfa?.initiate?.success).to.be.false;
        expect(response?.data?.mfa?.initiate?.error?.code).to.contain(errorCode);

        // Assert on error arguments if provided
        if (argumentAssertions) {
            const errorArguments = response?.data?.mfa?.initiate?.error?.arguments;
            expect(errorArguments).to.be.a('array');

            Object.entries(argumentAssertions).forEach(([argName, assertion]) => {
                const argument = errorArguments.find(arg => arg.name === argName);
                expect(argument).to.exist;
                assertion(argument.value);
            });
        } else {
            expect(response?.data?.mfa?.initiate?.error?.arguments).to.be.empty;
        }
    });
}

/**
 * Prepares an MFA factor and asserts the response is successful.
 *
 */
export function prepareEmailCodeFactor() {
    cy.log('Preparing email code factor and asserting success...');
    cy.apollo({
        queryFile: 'prepareEmailCodeFactor.graphql'
    }).then(response => {
        cy.log('Response for prepareEmailCodeFactor():', JSON.stringify(response, null, 2));
        expect(response?.data?.mfa?.factors?.prepareEmailCodeFactor?.success).to.be.true;
        expect(response?.data?.mfa?.factors?.prepareEmailCodeFactor?.sessionState).to.eq('in_progress');
        expect(response?.data?.mfa?.factors?.prepareEmailCodeFactor?.requiredFactors).to.be.a('array').and.have.length(1);
        expect(response?.data?.mfa?.factors?.prepareEmailCodeFactor?.requiredFactors[0]).to.eq('email_code');
        expect(response?.data?.mfa?.factors?.prepareEmailCodeFactor?.error).to.be.null;
    });
}

/**
 * Prepares the email code factor and asserts that the operation fails with the specified error code.
 *
 * @param {string} errorCode - The expected error code to verify in the operation response.
 * @param {Object.<string, function>} [argumentAssertions] - Optional assertions for error arguments, where the key is the argument name and the value is a function to validate the argument's value.
 */
export function prepareEmailCodeFactorAndExpectError(
    errorCode: string,
    argumentAssertions?: { [key: string]: (value: string) => void }
) {
    cy.log('Preparing email code factor and asserting failure...');
    cy.apollo({
        queryFile: 'prepareEmailCodeFactor.graphql'
    }).then(response => {
        cy.log('Response for prepareEmailCodeFactorAndExpectError():', JSON.stringify(response, null, 2));
        expect(response?.data?.mfa?.factors?.prepareEmailCodeFactor?.success).to.be.false;
        expect(response?.data?.mfa?.factors?.prepareEmailCodeFactor?.sessionState).to.eq('failed');
        expect(response?.data?.mfa?.factors?.prepareEmailCodeFactor?.requiredFactors).to.be.a('array').and.have.length(1);
        expect(response?.data?.mfa?.factors?.prepareEmailCodeFactor?.requiredFactors[0]).to.eq('email_code');
        expect(response?.data?.mfa?.factors?.prepareEmailCodeFactor?.error?.code).to.contain(errorCode);

        // Assert on error arguments if provided
        if (argumentAssertions) {
            const errorArguments = response?.data?.mfa?.factors?.prepareEmailCodeFactor?.error?.arguments;
            expect(errorArguments).to.be.a('array');

            Object.entries(argumentAssertions).forEach(([argName, assertion]) => {
                const argument = errorArguments.find(arg => arg.name === argName);
                expect(argument).to.exist;
                assertion(argument.value);
            });
        } else {
            expect(response?.data?.mfa?.factors?.prepareEmailCodeFactor?.error?.arguments).to.be.empty;
        }
    });
}
