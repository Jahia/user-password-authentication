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
export function getVerificationCode(email: string, locale = 'en'): Cypress.Chainable<JQuery<string>> {
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

            // Log and return the extracted code
            cy.log(`Verification code received by email: ${match[1]}`);
            return cy.wrap(match[1].toString(), {log: false});
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
 * Verifies the email code factor with a provided email code.
 * @param code The 6-digit verification code to verify.
 */
export function verifyEmailCodeFactor(code: string) {
    cy.log('Verifying email code factor and asserting success...');
    cy.apollo({
        queryFile: 'verifyEmailCodeFactor.graphql',
        variables: {
            code: code
        }
    }).then(response => {
        cy.log('Response for verifyEmailCodeFactor():', JSON.stringify(response, null, 2));
        expect(response?.data?.mfa?.factors?.verifyEmailCodeFactor?.success).true;
        expect(response?.data?.mfa?.factors?.verifyEmailCodeFactor?.sessionState).eq('completed');
        expect(response?.data?.mfa?.factors?.verifyEmailCodeFactor?.completedFactors).to.be.a('array').and.have.length(1);
        expect(response?.data?.mfa?.factors?.verifyEmailCodeFactor?.completedFactors[0]).eq('email_code');
        expect(response?.data?.mfa?.factors?.verifyEmailCodeFactor?.requiredFactors).a('array').and.have.length(1);
        expect(response?.data?.mfa?.factors?.verifyEmailCodeFactor?.requiredFactors[0]).eq('email_code');
        expect(response?.data?.mfa?.factors?.verifyEmailCodeFactor?.error).to.be.null;
    });
}

export function verifyEmailCodeFactorAndExpectError(
    verificationCode: string,
    errorCode: string,
    argumentAssertions?: { [key: string]: (value: string) => void }
) {
    cy.log('Verifying email code factor and asserting failure...');
    cy.apollo({
        queryFile: 'verifyEmailCodeFactor.graphql',
        variables: {
            code: verificationCode
        }
    }).then(response => {
        cy.log('Response for verifyEmailCodeFactorAndExpectError():', JSON.stringify(response, null, 2));
        expect(response?.data?.mfa?.factors?.verifyEmailCodeFactor?.success).false;
        expect(response?.data?.mfa?.factors?.verifyEmailCodeFactor?.sessionState).eq('failed');
        expect(response?.data?.mfa?.factors?.verifyEmailCodeFactor?.requiredFactors).a('array').and.have.length(1);
        expect(response?.data?.mfa?.factors?.verifyEmailCodeFactor?.requiredFactors[0]).eq('email_code');
        expect(response?.data?.mfa?.factors?.verifyEmailCodeFactor?.error?.code).eq(errorCode);

        // Assert on error arguments if provided
        if (argumentAssertions) {
            const errorArguments = response?.data?.mfa?.factors?.verifyEmailCodeFactor?.error?.arguments;
            expect(errorArguments).to.be.a('array');

            Object.entries(argumentAssertions).forEach(([argName, assertion]) => {
                const argument = errorArguments.find(arg => arg.name === argName);
                expect(argument).to.exist;
                assertion(argument.value);
            });
        } else {
            expect(response?.data?.mfa?.factors?.verifyEmailCodeFactor?.error?.arguments).to.be.empty;
        }
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
