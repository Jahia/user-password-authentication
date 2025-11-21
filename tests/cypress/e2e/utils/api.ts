export interface Error {
    code: string;
    arguments?: Array<{ name: string; value: string }>;
}

export enum SessionState {
    INITIATED = 'INITIATED',
    PREPARED = 'PREPARED',
    COMPLETED = 'COMPLETED'
}

/**
 * Initiates the MFA process for a given user and asserts the expected outcome.
 *
 * @param username - The username to authenticate.
 * @param password - The password for the user.
 * @param site  Optional. The site to authenticate against. The authentication is global if not specified.
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
        expect(response?.data?.mfa?.initiate?.session?.initiated).be.true;
    });
}

export function initiateAndExpectGlobalError(username: string, password: string, errorCode: string,
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
        expect(response?.data?.mfa?.initiate?.session?.error?.code).to.contain(errorCode);

        // Assert on error arguments if provided
        if (argumentAssertions) {
            const errorArguments = response?.data?.mfa?.initiate?.session?.error?.arguments;
            expect(errorArguments).to.be.a('array');

            Object.entries(argumentAssertions).forEach(([argName, assertion]) => {
                const argument = errorArguments.find(arg => arg.name === argName);
                expect(argument).to.exist;
                assertion(argument.value);
            });
        } else {
            expect(response?.data?.mfa?.initiate?.session?.error?.arguments).to.be.empty;
        }
    });
}

export function initiateAndExpectSuspended(username: string, password: string, suspensionDurationInSeconds: number) {
    cy.log('Initiating MFA process for user ' + username + ' and asserting user is suspended...');
    cy.apollo({
        queryFile: 'initiate.graphql',
        variables: {
            username: username,
            password: password
        }
    }).then(response => {
        cy.log('Response for initiateAndExpectSuspended():', JSON.stringify(response, null, 2));
        expect(response?.data?.mfa?.initiate?.session?.suspensionDurationInSeconds).eq(suspensionDurationInSeconds);
    });
}

// TODO review if needed
export function initiateAndExpectSpecificError(username: string, password: string, errorCode: string,
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

