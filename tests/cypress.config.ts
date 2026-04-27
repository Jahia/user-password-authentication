import {defineConfig} from 'cypress';
import {allureCypress} from 'allure-cypress/reporter';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export default defineConfig({
    // DefaultCommandTimeout: 10000,
    // videoUploadOnPasses: false,
    reporter: 'cypress-multi-reporters',
    reporterOptions: {
        configFile: 'reporter-config.json'
    },
    screenshotsFolder: './results/screenshots',
    video: true, // In Cypress, videos are disabled by default
    videosFolder: './results/videos',
    viewportWidth: 1366,
    viewportHeight: 768,
    watchForFileChanges: false,
    e2e: {
        // We've imported your old cypress plugins here.
        // You may want to clean this up later by importing these.
        setupNodeEvents(on, config) {
            // Delete videos for tests that did not fail
            on(
                'after:spec',
                (spec: Cypress.Spec, results: CypressCommandLine.RunResult) => {
                    if (results && results.video) {
                        // Do we have failures for any retry attempts?
                        const failures = results.tests.some(test =>
                            test.attempts.some(attempt => attempt.state === 'failed')
                        );
                        if (!failures) {
                            // Delete the video if the spec passed and no tests retried
                            fs.unlinkSync(results.video);
                        }
                    }
                }
            );
            const resultsDir = 'allure-results';

            // Ensure directory exists
            if (!fs.existsSync(resultsDir)) {
                fs.mkdirSync(resultsDir, {recursive: true});
            }

            // Generate environment.properties file
            const envProperties = `os_platform=${os.platform()}
os_release=${os.release()}
environment=${process.env.TEST_ENV || 'local'}
browser=${config.browser?.name || 'electron'}}`;

            fs.writeFileSync(path.join(resultsDir, 'environment.properties'), envProperties);

            // Setup Allure
            allureCypress(on, config, {
                resultsDir: resultsDir
            });
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            return require('./cypress/plugins/index.js')(on, config);
        },
        excludeSpecPattern: '*.ignore.ts',
        baseUrl: 'http://localhost:8080'
    },
    env: {
        MAILPIT_URL: process.env.MAILPIT_URL || 'http://localhost:8025' // Fallback for local runs
    }
});
