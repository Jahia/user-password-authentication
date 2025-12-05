/**
 * Installs a configuration for the MFA module.
 * @param configFilename name of the configuration YAML file located in the `fixtures/mfa-configuration/` folder
 */
export const installMFAConfig = (configFilename: string) => {
    cy.runProvisioningScript({
        script: {fileName: `mfa-configuration/${configFilename}`, type: 'application/yaml'}
    });
};
