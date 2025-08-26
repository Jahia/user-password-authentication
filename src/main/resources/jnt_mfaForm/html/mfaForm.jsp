<%@ taglib prefix="jcr" uri="http://www.jahia.org/tags/jcr" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="utility" uri="http://www.jahia.org/tags/utilityLib" %>
<%@ taglib prefix="template" uri="http://www.jahia.org/tags/templateLib" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib prefix="functions" uri="http://www.jahia.org/tags/functions" %>
<%@ taglib prefix="search" uri="http://www.jahia.org/tags/search" %>
<%@ taglib prefix="uiComponents" uri="http://www.jahia.org/tags/uiComponentsLib" %>
<%--@elvariable id="currentNode" type="org.jahia.services.content.JCRNodeWrapper"--%>
<%--@elvariable id="propertyDefinition" type="org.jahia.services.content.nodetypes.ExtendedPropertyDefinition"--%>
<%--@elvariable id="type" type="org.jahia.services.content.nodetypes.ExtendedNodeType"--%>
<%--@elvariable id="out" type="java.io.PrintWriter"--%>
<%--@elvariable id="script" type="org.jahia.services.render.scripting.Script"--%>
<%--@elvariable id="scriptInfo" type="java.lang.String"--%>
<%--@elvariable id="workspace" type="java.lang.String"--%>
<%--@elvariable id="renderContext" type="org.jahia.services.render.RenderContext"--%>
<%--@elvariable id="currentResource" type="org.jahia.services.render.Resource"--%>
<%--@elvariable id="url" type="org.jahia.services.render.URLGenerator"--%>

<fmt:message key="jahia-mfa.form.title" var="formTitle"/>
<fmt:message key="jahia-mfa.form.username" var="usernameLabel"/>
<fmt:message key="jahia-mfa.form.password" var="passwordLabel"/>
<fmt:message key="jahia-mfa.form.login" var="loginButton"/>
<fmt:message key="jahia-mfa.form.selectFactor" var="selectFactorLabel"/>
<fmt:message key="jahia-mfa.form.emailCode" var="emailCodeLabel"/>
<fmt:message key="jahia-mfa.form.enterCode" var="enterCodeLabel"/>
<fmt:message key="jahia-mfa.form.verify" var="verifyButton"/>
<fmt:message key="jahia-mfa.form.processing" var="processingMessage"/>

<div id="mfa-container" class="mfa-form-container">
    <div class="mfa-header">
        <h2>${formTitle}</h2>
        <div id="error-message" class="error-message" style="display: none;"></div>
        <div id="success-message" class="success-message" style="display: none;"></div>
    </div>

    <!-- Step 1: Username/Password Login -->
    <div id="step-login" class="mfa-step active">
        <form id="login-form" class="mfa-form">
            <div class="form-group">
                <label for="username">${usernameLabel}:</label>
                <input type="text" id="username" name="username" required>
            </div>
            <div class="form-group">
                <label for="password">${passwordLabel}:</label>
                <input type="password" id="password" name="password" required>
            </div>
            <button type="submit" class="mfa-button primary">${loginButton}</button>
        </form>
    </div>

    <!-- Step 2: Factor Selection -->
    <div id="step-factors" class="mfa-step">
        <div class="factor-selection">
            <h3>${selectFactorLabel}</h3>
            <div id="available-factors" class="factors-list">
                <!-- Factors will be populated dynamically -->
            </div>
        </div>
    </div>

    <!-- Step 3: Email Code Verification -->
    <div id="step-email-code" class="mfa-step">
        <div class="email-code-verification">
            <h3>${emailCodeLabel}</h3>
            <p>Please check your email and enter the verification code below:</p>
            <form id="email-code-form" class="mfa-form">
                <div class="form-group">
                    <label for="email-code">${enterCodeLabel}:</label>
                    <input type="text" id="email-code" name="code" required maxlength="6" pattern="[0-9]{6}">
                </div>
                <button type="submit" class="mfa-button primary">${verifyButton}</button>
            </form>
        </div>
    </div>

    <!-- Loading indicator -->
    <div id="loading" class="loading" style="display: none;">
        <div class="spinner"></div>
        <p>${processingMessage}</p>
    </div>
</div>

<style>
.mfa-form-container {
    max-width: 400px;
    margin: 20px auto;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background-color: #f9f9f9;
    font-family: Arial, sans-serif;
}

.mfa-header h2 {
    text-align: center;
    margin-bottom: 20px;
    color: #333;
}

.mfa-step {
    display: none;
}

.mfa-step.active {
    display: block;
}

.mfa-form {
    margin-bottom: 20px;
}

.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
    color: #555;
}

.form-group input {
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box;
}

.form-group input:focus {
    outline: none;
    border-color: #007cba;
    box-shadow: 0 0 5px rgba(0, 124, 186, 0.3);
}

.mfa-button {
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
    transition: background-color 0.3s;
}

.mfa-button.primary {
    background-color: #007cba;
    color: white;
}

.mfa-button.primary:hover {
    background-color: #005a87;
}

.mfa-button.secondary {
    background-color: #6c757d;
    color: white;
    margin-bottom: 10px;
}

.mfa-button.secondary:hover {
    background-color: #545b62;
}

.factors-list {
    margin-top: 15px;
}

.factor-item {
    margin-bottom: 10px;
}

.error-message {
    padding: 10px;
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
    border-radius: 4px;
    margin-bottom: 15px;
}

.success-message {
    padding: 10px;
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
    border-radius: 4px;
    margin-bottom: 15px;
}

.loading {
    text-align: center;
    padding: 20px;
}

.spinner {
    border: 4px solid #f3f3f3;
    border-top: 4px solid #007cba;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    animation: spin 1s linear infinite;
    margin: 0 auto 10px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>

<script>
class MfaForm {
    constructor() {
        console.log('MFA Form: Constructor called');
        this.currentStep = 'login';
        this.mfaSession = null;
        this.availableFactors = [];
        this.isProcessing = false;
        console.log('MFA Form: Initial state set', {
            currentStep: this.currentStep,
            isProcessing: this.isProcessing
        });
        this.init();
    }

    init() {
        console.log('MFA Form: Initializing...');
        this.bindEvents();
        console.log('MFA Form: Initialization complete');
    }

    bindEvents() {
        console.log('MFA Form: Binding events...');

        const loginForm = document.getElementById('login-form');
        const emailForm = document.getElementById('email-code-form');

        console.log('MFA Form: Found elements', {
            loginForm: !!loginForm,
            emailForm: !!emailForm
        });

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                console.log('MFA Form: Login form submitted');
                e.preventDefault();
                this.handleLogin();
            });
        }

        if (emailForm) {
            emailForm.addEventListener('submit', (e) => {
                console.log('MFA Form: Email code form submitted');
                e.preventDefault();
                this.handleEmailCodeVerification();
            });
        }

        console.log('MFA Form: Events bound successfully');
    }

    async makeGraphQLRequest(query, variables = {}) {
        console.log('MFA Form: Making GraphQL request', {
            query: query.split('\n')[1]?.trim() || 'Unknown query',
            variables
        });

        try {
            const response = await fetch('/modules/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: query,
                    variables: variables
                })
            });

            console.log('MFA Form: GraphQL response received', {
                status: response.status,
                ok: response.ok
            });

            const result = await response.json();
            console.log('MFA Form: GraphQL result parsed', {
                hasErrors: !!result.errors,
                hasData: !!result.data
            });

            if (result.errors) {
                console.error('MFA Form: GraphQL errors', result.errors);
                throw new Error(result.errors[0].message);
            }

            console.log('MFA Form: GraphQL request successful', result.data);
            return result.data;
        } catch (error) {
            console.error('MFA Form: GraphQL request failed', error);
            throw error;
        }
    }

    showStep(stepName) {
        console.log('MFA Form: Showing step', {
            from: this.currentStep,
            to: stepName
        });

        // Hide all steps
        document.querySelectorAll('.mfa-step').forEach(step => {
            step.classList.remove('active');
        });

        // Show target step
        const targetStep = document.getElementById('step-' + stepName);
        if (targetStep) {
            targetStep.classList.add('active');
            this.currentStep = stepName;
            console.log('MFA Form: Step transition complete', {
                currentStep: this.currentStep
            });
        } else {
            console.error('MFA Form: Target step not found', stepName);
        }
    }

    showLoading(show = true) {
        console.log('MFA Form: Setting loading state', { show });

        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        } else {
            console.warn('MFA Form: Loading element not found');
        }

        // Disable all buttons when loading
        this.setButtonsEnabled(!show);
        console.log('MFA Form: Loading state updated');
    }

    setButtonsEnabled(enabled) {
        console.log('MFA Form: Setting buttons enabled state', { enabled });

        const buttons = document.querySelectorAll('.mfa-button');
        console.log('MFA Form: Found buttons', { count: buttons.length });

        buttons.forEach(button => {
            button.disabled = !enabled;
            button.style.opacity = enabled ? '1' : '0.6';
            button.style.cursor = enabled ? 'pointer' : 'not-allowed';
        });
    }

    showError(message) {
        console.log('MFA Form: Showing error message', { message });
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        } else {
            console.warn('MFA Form: Error message element not found');
        }
        document.getElementById('success-message')?.style.setProperty('display', 'none');
    }

    showSuccess(message) {
        console.log('MFA Form: Showing success message', { message });
        const successDiv = document.getElementById('success-message');
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.style.display = 'block';
        } else {
            console.warn('MFA Form: Success message element not found');
        }
        document.getElementById('error-message')?.style.setProperty('display', 'none');
    }

    hideMessages() {
        console.log('MFA Form: Hiding all messages');
        document.getElementById('error-message')?.style.setProperty('display', 'none');
        document.getElementById('success-message')?.style.setProperty('display', 'none');
    }

    async handleLogin() {
        console.log('MFA Form: handleLogin called');

        // Prevent multiple simultaneous login attempts
        if (this.isProcessing) {
            console.warn('MFA Form: Login blocked - already processing');
            return;
        }

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        console.log('MFA Form: Login attempt', {
            username: username ? `${username.substring(0, 3)}***` : 'empty',
            passwordProvided: !!password
        });

        if (!username || !password) {
            console.warn('MFA Form: Missing credentials');
            this.showError('Please enter both username and password');
            return;
        }

        console.log('MFA Form: Starting login process...');
        this.isProcessing = true;
        this.showLoading(true);
        this.hideMessages();

        try {
            const query = `
                mutation MfaInitiate($username: String!, $password: String!) {
                    mfa {
                        initiate(username: $username, password: $password) {
                            success
                            error
                            sessionState
                            completedFactors
                            requiredFactors
                        }
                    }
                }
            `;

            console.log('MFA Form: Calling initiate mutation...');
            const data = await this.makeGraphQLRequest(query, { username, password });
            const response = data.mfa.initiate;

            console.log('MFA Form: Initiate response received', {
                success: response.success,
                sessionState: response.sessionState,
                hasError: !!response.error,
                requiredFactors: response.requiredFactors
            });

            if (!response.success) {
                console.error('MFA Form: Login failed', response.error);
                this.showError(response.error || 'Login failed');
                this.showLoading(false);
                this.isProcessing = false;
                return;
            }

            console.log('MFA Form: Login successful, updating session...');
            this.mfaSession = response;

            if (response.sessionState === 'completed') {
                console.log('MFA Form: Authentication complete, redirecting...');
                this.showSuccess('Authentication successful! Redirecting...');
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
                return;
            }

            // Show available factors
            console.log('MFA Form: Setting up factor selection...');
            this.availableFactors = response.requiredFactors || ['email_code'];
            console.log('MFA Form: Available factors', this.availableFactors);
            this.showFactorSelection();

        } catch (error) {
            console.error('MFA Form: Login error', error);
            this.showError('Login failed: ' + error.message);
            this.showLoading(false);
            this.isProcessing = false;
        }
    }

    showFactorSelection() {
        console.log('MFA Form: showFactorSelection called');
        console.log('MFA Form: Current state', {
            availableFactors: this.availableFactors,
            isProcessing: this.isProcessing
        });

        this.showLoading(false);
        this.isProcessing = false;

        const factorsContainer = document.getElementById('available-factors');
        if (!factorsContainer) {
            console.error('MFA Form: Factors container not found');
            return;
        }

        console.log('MFA Form: Clearing factors container...');
        factorsContainer.innerHTML = '';

        console.log('MFA Form: Creating factor buttons...');
        this.availableFactors.forEach((factor, index) => {
            console.log(`MFA Form: Creating button for factor ${index + 1}/${this.availableFactors.length}:`, factor);

            const factorDiv = document.createElement('div');
            factorDiv.className = 'factor-item';

            const button = document.createElement('button');
            button.className = 'mfa-button secondary';
            button.textContent = this.getFactorDisplayName(factor);

            // Add data attribute to track factor type
            button.setAttribute('data-factor', factor);

            // Use event delegation instead of direct onclick
            button.addEventListener('click', (e) => {
                console.log('MFA Form: Factor button clicked', { factor });
                e.preventDefault();
                const factorType = e.target.getAttribute('data-factor');
                this.selectFactor(factorType);
            });

            factorDiv.appendChild(button);
            factorsContainer.appendChild(factorDiv);
        });

        console.log('MFA Form: Factor buttons created, showing factors step...');
        this.showStep('factors');
    }

    getFactorDisplayName(factor) {
        console.log('MFA Form: Getting display name for factor', { factor });
        const displayNames = {
            'email_code': 'Email Verification Code',
            'sms_code': 'SMS Verification Code',
            'totp': 'Authenticator App'
        };
        const displayName = displayNames[factor] || factor;
        console.log('MFA Form: Display name resolved', { factor, displayName });
        return displayName;
    }

    async selectFactor(factorType) {
        console.log('MFA Form: selectFactor called', { factorType });

        // Prevent multiple simultaneous factor selection
        if (this.isProcessing) {
            console.warn('MFA Form: Factor selection blocked - already processing');
            return;
        }

        console.log('MFA Form: Starting factor preparation...');
        this.isProcessing = true;
        this.showLoading(true);
        this.hideMessages();

        try {
            const query = `
                mutation MfaPrepareFactor($factorType: String!) {
                    mfa {
                        prepareFactor(factorType: $factorType) {
                            success
                            error
                            sessionState
                            completedFactors
                            requiredFactors
                        }
                    }
                }
            `;

            console.log('MFA Form: Calling prepareFactor mutation...');
            const data = await this.makeGraphQLRequest(query, { factorType });
            const response = data.mfa.prepareFactor;

            console.log('MFA Form: PrepareFactor response received', {
                success: response.success,
                sessionState: response.sessionState,
                hasError: !!response.error,
                factorType
            });

            if (!response.success) {
                console.error('MFA Form: Factor preparation failed', response.error);
                this.showError(response.error || 'Failed to prepare factor');
                this.showLoading(false);
                this.isProcessing = false;
                return;
            }

            console.log('MFA Form: Factor preparation successful, updating session...');
            this.mfaSession = response;

            // For email_code, show the code input form
            if (factorType === 'email_code') {
                console.log('MFA Form: Email factor prepared, showing email code step...');
                this.showEmailCodeStep();
            } else {
                console.log('MFA Form: Other factor type prepared', { factorType });
                this.showLoading(false);
                this.isProcessing = false;
            }

        } catch (error) {
            console.error('MFA Form: Factor preparation error', error);
            this.showError('Failed to prepare factor: ' + error.message);
            this.showLoading(false);
            this.isProcessing = false;
        }
    }

    showEmailCodeStep() {
        console.log('MFA Form: showEmailCodeStep called');
        console.log('MFA Form: Current processing state', {
            isProcessing: this.isProcessing,
            currentStep: this.currentStep
        });

        this.showLoading(false);
        this.isProcessing = false;
        this.showStep('email-code');

        // Focus on the code input
        console.log('MFA Form: Setting focus on email code input...');
        setTimeout(() => {
            const emailCodeInput = document.getElementById('email-code');
            if (emailCodeInput) {
                emailCodeInput.focus();
                console.log('MFA Form: Email code input focused');
            } else {
                console.warn('MFA Form: Email code input not found');
            }
        }, 100);
    }

    async handleEmailCodeVerification() {
        console.log('MFA Form: handleEmailCodeVerification called');

        // Prevent multiple simultaneous verification attempts
        if (this.isProcessing) {
            console.warn('MFA Form: Email verification blocked - already processing');
            return;
        }

        const code = document.getElementById('email-code').value;

        console.log('MFA Form: Email verification attempt', {
            codeProvided: !!code,
            codeLength: code ? code.length : 0
        });

        if (!code || code.length !== 6) {
            console.warn('MFA Form: Invalid email code format');
            this.showError('Please enter a valid 6-digit code');
            return;
        }

        console.log('MFA Form: Starting email verification...');
        this.isProcessing = true;
        this.showLoading(true);
        this.hideMessages();

        try {
            const query = `
                mutation MfaVerifyEmailCode($code: String!) {
                    mfa {
                        factors {
                            verifyEmailCodeFactor(code: $code) {
                                success
                                error
                                sessionState
                                completedFactors
                                requiredFactors
                            }
                        }
                    }
                }
            `;

            console.log('MFA Form: Calling verifyEmailCodeFactor mutation...');
            const data = await this.makeGraphQLRequest(query, { code });
            const response = data.mfa.factors.verifyEmailCodeFactor;

            console.log('MFA Form: Email verification response received', {
                success: response.success,
                sessionState: response.sessionState,
                hasError: !!response.error,
                requiredFactors: response.requiredFactors
            });

            if (!response.success) {
                console.error('MFA Form: Email verification failed', response.error);
                this.showError(response.error || 'Invalid verification code');
                this.showLoading(false);
                this.isProcessing = false;
                // Clear the code input
                document.getElementById('email-code').value = '';
                return;
            }

            console.log('MFA Form: Email verification successful, updating session...');
            this.mfaSession = response;

            if (response.sessionState === 'completed') {
                console.log('MFA Form: Full authentication complete, redirecting...');
                this.showSuccess('Authentication successful! Redirecting...');
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                console.log('MFA Form: More factors required...');
                // More factors required
                this.availableFactors = response.requiredFactors || [];
                console.log('MFA Form: Additional factors needed', this.availableFactors);
                if (this.availableFactors.length > 0) {
                    this.showFactorSelection();
                } else {
                    console.error('MFA Form: No additional factors available but flow incomplete');
                    this.showError('Authentication flow incomplete');
                    this.showLoading(false);
                    this.isProcessing = false;
                }
            }

        } catch (error) {
            console.error('MFA Form: Email verification error', error);
            this.showError('Verification failed: ' + error.message);
            this.showLoading(false);
            this.isProcessing = false;
            document.getElementById('email-code').value = '';
        }
    }
}

// Initialize the MFA form when the page loads
document.addEventListener('DOMContentLoaded', function() {
    new MfaForm();
});
</script>
