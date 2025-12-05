/**
 * Translated i18n messages used in the UI tests (should match those defined in en.json for the MFA UI module)
 * @see https://github.com/Jahia/jahia-multi-factor-authentication/blob/main/ui/settings/locales/en.json
 */
/* eslint-disable quote-props */
export const I18N = {
    defaultLanguage: 'en',
    labels: {
        en: {
            loginEmailLabel: 'Email',
            loginPasswordLabel: 'Password',
            loginSubmitButtonLabel: 'Login',
            loginBelowPasswordFieldHTML: '<a target="_blank" href="https://id.jahia.com/lost-password">Forgot password ?</a>',
            loginAdditionalActionHTML: '<p>Don\'t have a Jahia Cloud account?</p><a target="_blank" href="https://id.jahia.com/home/registration.html">Create an account</a>',
            emailCodeVerificationLabel: 'Verification code',
            emailCodeVerificationSubmitButtonLabel: 'Verify',
            emailCodeVerificationAdditionalActionHTML: '<p>Didn\'t receive the code?</p>',
            emailCodeVerificationAdditionalActionResendLabel: 'Resend code'
        }
    },
    locales: {
        en: {
            'unexpected_error': 'An unexpected error occurred',
            'no_active_session': 'No active MFA session found',
            'authentication_failed': 'Invalid username or password',
            'verification_failed': 'Verification failed',
            'suspended_user': 'Your account is temporarily locked for {{suspensionDurationInHours}} hour(s).',
            'failed_to_check_if_user_suspended': 'Failed to check if the user is suspended',
            'failed_to_mark_user_as_suspended': 'Failed to mark user as suspended',
            'factor_type_not_supported': 'Factor {{factorType}} not supported',
            'user_not_found': 'User not found',
            'prepare.rate_limit_exceeded': 'The factor {{factorType}} already generated for user {{user}}, wait {{nextRetryInSeconds}} seconds before generating a new one',
            'verify.factor_not_prepared': 'Factor {{factorType}} not prepared',
            'verify.loading': 'Loading...',
            'verify.code_too_short': 'Please enter the {{codeLength}}-digit code.',
            'verify.verification_failed': 'Unable to verify the {{factorType}} factor',
            'factor.email_code.missing_prepared_code': 'No verification code found. Please request a new code.',
            'factor.email_code.preparation_failed': 'Failed to prepare email code factor for user: {{user}}',
            'factor.email_code.generating_email_content_failed': 'Error generating mail content for MFA mail code',
            'factor.email_code.email_not_configured_for_user': 'User \'{{user}}\' does not have an email address configured',
            'factor.email_code.verification_code_has_been_sent': 'A verification code has been sent to {{maskedEmail}}.',
            'factor.email_code.sending_validation_code_failed': 'Failed to send validation code to {{user}}'
        }
    }
};
