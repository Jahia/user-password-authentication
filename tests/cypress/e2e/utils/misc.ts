/**
 * Installs a module configuration.
 * @param configFilePath configuration file path relative to fixtures folder
 */
export const installConfig = (configFilePath: string) => {
    cy.runProvisioningScript({
        script: [{installConfiguration: configFilePath}],
        files: [{
            fileName: configFilePath,
            type: 'text/plain'
        }]
    });
};
