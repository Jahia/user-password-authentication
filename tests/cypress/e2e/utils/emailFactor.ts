const VERIFICATION_CODE_SUBJECT = 'Validation code';

/**
 * Deletes all emails from the mail inbox using Mailpit.
 */
export function deleteAllEmails() {
    cy.mailpitDeleteAllEmails();
}

/**
 * Retrieves the 6-digit verification code sent to the specified email address.
 * Waits for the email to arrive, then extracts the code from the email body.
 * @param email the recipient email address to search for the verification code.
 * @returns a Cypress chainable that yields the 6-digit verification code as a string.
 * @throws Error if no 6-digit code is found in the email body.
 */
export function getVerificationCode(email: string) {
    return cy.mailpitHasEmailsBySearch('Subject:' + VERIFICATION_CODE_SUBJECT + ' to:' + email, undefined, undefined, {
        timeout: 5000,
        interval: 500
    })
        .should(result => {
            expect(result).to.have.property('total').and.to.be.greaterThan(0);
            expect(result).to.have.property('messages').and.to.be.an('array').and.to.have.length(1);
        })
        .then(result => result.messages[0])
        .mailpitGetMailTextBody()
        .then(body => {
            const match = body.match(/\d{6}/);
            if (match && match.length > 0) {
                return match[0];
            }

            throw new Error('No 6-digit verification code found in email body');
        });
}

/**
 * Verifies the email code factor with a provided email code.
 * Asserts the response based on whether an expected error is provided.
 * @param code The 6-digit verification code to verify.
 * @param expectedError Optional expected error message for negative test cases. If not provided, assumes it's a success
 */
export function verifyEmailCodeFactor(code: string, expectedError: string = undefined) {
    cy.apollo({
        queryFile: 'verifyEmailCodeFactor.graphql',
        variables: {
            code: code
        }
    }).then(response => {
        if (expectedError) {
            expect(response?.data?.mfa?.factors?.verifyEmailCodeFactor?.success).false;
            expect(response?.data?.mfa?.factors?.verifyEmailCodeFactor?.error).eq(expectedError);
            expect(response?.data?.mfa?.factors?.verifyEmailCodeFactor?.sessionState).eq('in_progress');
            expect(response?.data?.mfa?.factors?.verifyEmailCodeFactor?.completedFactors).to.be.a('array').and.be.empty;
        } else {
            expect(response?.data?.mfa?.factors?.verifyEmailCodeFactor?.success).true;
            expect(response?.data?.mfa?.factors?.verifyEmailCodeFactor?.sessionState).eq('completed');
            expect(response?.data?.mfa?.factors?.verifyEmailCodeFactor?.completedFactors).to.be.a('array').and.have.length(1);
            expect(response?.data?.mfa?.factors?.verifyEmailCodeFactor?.completedFactors[0]).eq('email_code');
        }

        expect(response?.data?.mfa?.factors?.verifyEmailCodeFactor?.requiredFactors).a('array').and.have.length(1);
        expect(response?.data?.mfa?.factors?.verifyEmailCodeFactor?.requiredFactors[0]).eq('email_code');
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
