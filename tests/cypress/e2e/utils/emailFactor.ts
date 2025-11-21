const VERIFICATION_CODE_SUBJECT = {
    en: 'Authentication Code',
    fr: 'Code d\'authentification'
};

/**
 * Deletes all emails from the mail inbox using Mailpit.
 */
export function deleteAllEmails() {
    cy.mailpitDeleteAllEmails();
}

/**
 * Retrieves the 6-digit verification code sent to the specified email address.
 * Waits for the email to arrive, then extracts the code from the HTML email body.
 * @param email the recipient email address to search for the verification code.
 * @param locale the locale to determine the email subject. Defaults to 'en'.
 * @returns a Cypress chainable that yields the 6-digit verification code as a string.
 * @throws Error if no 6-digit code is found in the email body.
 */
export function getVerificationCode(email: string, locale = 'en'): Cypress.Chainable<string> {
    const subject = VERIFICATION_CODE_SUBJECT[locale];
    const searchQuery = `Subject:${subject} to:${email}`;

    return cy.mailpitHasEmailsBySearch(searchQuery, undefined, undefined, {
        timeout: 5000,
        interval: 500
    })
        .should('satisfy', result => {
            return result && result.total > 0 && result.messages && result.messages.length > 0;
        })
        .then(result => {
            expect(result).to.have.property('total').and.to.be.greaterThan(0);
            expect(result).to.have.property('messages').and.to.be.an('array').and.to.have.length(1);
            return result.messages[0];
        })
        .mailpitGetMailHTMlBody()
        .then(htmlBody => {
        // Check that the HTML body contains the correct locale-specific title
            const titleMatch = htmlBody.match(/<h1 class="title">([^<]+)<\/h1>/);
            if (!titleMatch || titleMatch[1] !== subject) {
                throw new Error(`HTML body title does not match expected locale subject. Expected: "${subject}", Found: "${titleMatch ? titleMatch[1] : 'No title found'}"`);
            }

            const match = htmlBody.match(/<p class="code">(\d{6})<\/p>/);
            if (!match || match.length <= 1) {
                throw new Error('No 6-digit verification code found in email HTML body');
            }

            return cy.log(`Verification code received by email: ${match[1]}`).then(() => match[1]);
        });
}

/**
 * Retrieves the HTML body content for a specific email.
 * @param email the recipient email address to search for.
 * @param subject the email subject to search for.
 * @param locale the locale to determine the email subject. Defaults to 'en'.
 * @returns a Cypress chainable that yields the HTML body content as a string.
 */
export function getEmailBody(email: string, subject?: string, locale = 'en'): Cypress.Chainable<string> {
    const searchSubject = subject || VERIFICATION_CODE_SUBJECT[locale];

    return cy.mailpitHasEmailsBySearch(`Subject:${searchSubject} to:${email}`, undefined, undefined, {
        timeout: 5000,
        interval: 500
    })
        .should(result => {
            expect(result).to.have.property('total').and.to.be.greaterThan(0);
            expect(result).to.have.property('messages').and.to.be.an('array').and.to.have.length.greaterThan(0);
        })
        .then(result => result.messages[0])
        .mailpitGetMailHTMlBody();
}

/**
 * Prepares an MFA factor and asserts the response is successful.
 *
 */
export function prepareEmailCodeFactor() {
    cy.log('Preparing email code factor and asserting success...');
    cy.apollo({
        queryFile: 'emailCode/prepare.graphql',
        variables: {
            factorType: 'email_code'
        }
    }).then(response => {
        cy.log('Response for prepareEmailCodeFactor():', JSON.stringify(response, null, 2));
        expect(response?.data?.mfa?.factors?.emailCode?.prepare?.session?.factorState?.prepared).to.be.true;
        expect(response?.data?.mfa?.factors?.emailCode?.prepare?.session?.requiredFactors).to.be.a('array').and.have.length(1);
        expect(response?.data?.mfa?.factors?.emailCode?.prepare?.session?.requiredFactors[0]).to.eq('email_code');
        expect(response?.data?.mfa?.factors?.emailCode?.prepare?.session?.error).to.be.null;
    });
}

/**
 * Prepares the email code factor and asserts that the operation fails with the specified error code.
 *
 * @param {string} errorCode - The expected error code to verify in the operation response.
 * @param {Object.<string, function>} [argumentAssertions] - Optional assertions for error arguments, where the key is the argument name and the value is a function to validate the argument's value.
 */
export function prepareEmailCodeFactorAndExpectFactorError(
    errorCode: string,
    argumentAssertions?: { [key: string]: (value: string) => void }
) {
    cy.log('Preparing email code factor and asserting failure...');
    cy.apollo({
        queryFile: 'emailCode/prepare.graphql'
    }).then(response => {
        cy.log('Response for prepareEmailCodeFactorAndExpectError():', JSON.stringify(response, null, 2));
        expect(response?.data?.mfa?.factors?.emailCode?.prepare?.session?.factorState?.error?.code).eq(errorCode);

        // Assert on error arguments if provided
        if (argumentAssertions) {
            const errorArguments = response?.data?.mfa?.factors?.emailCode?.prepare?.session?.factorState?.error?.arguments;
            expect(errorArguments).to.be.a('array');

            Object.entries(argumentAssertions).forEach(([argName, assertion]) => {
                const argument = errorArguments.find(arg => arg.name === argName);
                expect(argument).to.exist;
                assertion(argument.value);
            });
        } else {
            expect(response?.data?.mfa?.factors?.emailCode?.prepare?.session?.factorState?.error?.arguments).to.be.empty;
        }
    });
}

export function prepareEmailCodeFactorAndExpectGlobalError(
    errorCode: string,
    argumentAssertions?: { [key: string]: (value: string) => void }
) {
    cy.log('Preparing email code factor and asserting global failure...');
    cy.apollo({
        queryFile: 'emailCode/prepare.graphql'
    }).then(response => {
        cy.log('Response for prepareEmailCodeFactorAndExpectGlobalError():', JSON.stringify(response, null, 2));
        expect(response?.data?.mfa?.factors?.emailCode?.prepare?.session?.error?.code).eq(errorCode);

        // Assert on error arguments if provided
        if (argumentAssertions) {
            const errorArguments = response?.data?.mfa?.factors?.emailCode?.prepare?.session?.error?.arguments;
            expect(errorArguments).to.be.a('array');

            Object.entries(argumentAssertions).forEach(([argName, assertion]) => {
                const argument = errorArguments.find(arg => arg.name === argName);
                expect(argument).to.exist;
                assertion(argument.value);
            });
        } else {
            expect(response?.data?.mfa?.factors?.emailCode?.prepare?.session?.error?.arguments).to.be.empty;
        }
    });
}

export function prepareEmailCodeFactorAndExpectSuspended(
    expectedSuspensionDurationInSeconds: number
) {
    cy.log('Preparing email code factor and asserting user is suspended...');
    cy.apollo({
        queryFile: 'emailCode/prepare.graphql'
    }).then(response => {
        cy.log('Response for prepareEmailCodeFactorAndExpectSuspended():', JSON.stringify(response, null, 2));
        expect(response?.data?.mfa?.factors?.emailCode?.prepare?.session?.suspensionDurationInSeconds).eq(expectedSuspensionDurationInSeconds);
    });
}

/**
 * Verifies the email code factor with a provided email code.
 * @param code The 6-digit verification code to verify.
 */
export function verifyEmailCodeFactor(code: string) {
    cy.log('Verifying email code factor and asserting success...');
    cy.apollo({
        queryFile: 'emailCode/verify.graphql',
        variables: {
            code: code
        }
    }).then(response => {
        cy.log('Response for verifyEmailCodeFactor():', JSON.stringify(response, null, 2));
        expect(response?.data?.mfa?.factors?.emailCode?.verify?.session?.factorState?.verified).to.be.true;
        expect(response?.data?.mfa?.factors?.emailCode?.verify?.session?.completedFactors).to.be.a('array').and.have.length(1);
        expect(response?.data?.mfa?.factors?.emailCode?.verify?.session?.completedFactors[0]).eq('email_code');
        expect(response?.data?.mfa?.factors?.emailCode?.verify?.session?.requiredFactors).a('array').and.have.length(1);
        expect(response?.data?.mfa?.factors?.emailCode?.verify?.session?.requiredFactors[0]).eq('email_code');
        expect(response?.data?.mfa?.factors?.emailCode?.verify?.session?.error).to.be.null;
    });
}

export function verifyEmailCodeFactorAndExpectFactorError(
    verificationCode: string,
    errorCode: string,
    argumentAssertions?: { [key: string]: (value: string) => void }
) {
    cy.log('Verifying email code factor and asserting failure...');
    cy.apollo({
        queryFile: 'emailCode/verify.graphql',
        variables: {
            code: verificationCode
        }
    }).then(response => {
        cy.log('Response for verifyEmailCodeFactorAndExpectError():', JSON.stringify(response, null, 2));
        expect(response?.data?.mfa?.factors?.emailCode?.verify?.session?.factorState?.error?.code).eq(errorCode);

        // Assert on error arguments if provided
        if (argumentAssertions) {
            const errorArguments = response?.data?.mfa?.factors?.emailCode?.verify?.session?.factorState?.error?.arguments;
            expect(errorArguments).to.be.a('array');

            Object.entries(argumentAssertions).forEach(([argName, assertion]) => {
                const argument = errorArguments.find(arg => arg.name === argName);
                expect(argument).to.exist;
                assertion(argument.value);
            });
        } else {
            expect(response?.data?.mfa?.factors?.emailCode?.verify?.session?.factorState?.error?.arguments).to.be.empty;
        }
    });
}

export function verifyEmailCodeFactorAndExpectSuspended(
    verificationCode: string,
    expectedSuspensionDurationInSeconds: number
) {
    cy.log('Verifying email code factor and asserting user is suspended...');
    cy.apollo({
        queryFile: 'emailCode/verify.graphql',
        variables: {
            code: verificationCode
        }
    }).then(response => {
        cy.log('Response for verifyEmailCodeFactorAndExpectSuspended():', JSON.stringify(response, null, 2));
        const actualDuration = response?.data?.mfa?.factors?.emailCode?.verify?.session?.suspensionDurationInSeconds;
        expect(actualDuration).to.not.be.null;
        expect(actualDuration).eq(expectedSuspensionDurationInSeconds);
    });
}

/**
 * Generates an invalid 6-digit code by incrementing the last digit of a given valid code.
 * @param validCode The valid 6-digit code as a string.
 * @returns A new 6-digit code string with the last digit incremented (modulo 10).
 * @throws Error if the input is not a 6-digit string.
 */
export const generateWrongCode = (validCode: string) => {
    // Sanity check:
    if (!/^\d{6}$/.test(validCode)) {
        throw new Error('Code must be a 6-digit string');
    }

    const lastDigit = parseInt(validCode[5], 10);
    const newLastDigit = (lastDigit + 1) % 10;
    return validCode.slice(0, 5) + newLastDigit.toString();
};

