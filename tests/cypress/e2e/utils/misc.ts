/**
 * Installs a configuration for the MFA module.
 * @param configFilename name of the configuration YAML file located in the `fixtures/mfa-configuration/` folder
 */
export const installMFAConfig = (configFilename: string) => {
    cy.runProvisioningScript({
        script: {fileName: `mfa-configuration/${configFilename}`, type: 'application/yaml'}
    });
};

/**
 * Asserts that two arrays contain exactly the same elements (in any order, including duplicates).
 * Throws an error if they do not match.
 * @param actual - The actual array to check.
 * @param expected - The array of expected items.
 */
export function expectArrayToContainExactly<T>(actual: T[], expected: T[]) {
    if (!Array.isArray(actual) || !Array.isArray(expected)) {
        console.error('type of "actual":', typeof actual, 'type of "expected":', typeof expected);
        throw new TypeError('Both actual and expected must be arrays');
    }

    if (actual.length !== expected.length) {
        throw new Error(`Expected array of length ${expected.length}, but got ${actual.length}`);
    }

    // Create frequency maps
    const actualMap = new Map<T, number>();

    for (const item of actual) {
        actualMap.set(item, (actualMap.get(item) || 0) + 1);
    }

    const expectedMap = new Map<T, number>();

    for (const item of expected) {
        expectedMap.set(item, (expectedMap.get(item) || 0) + 1);
    }

    // Use Array.from to allow iteration in all TS targets
    Array.from(expectedMap.entries()).forEach(([item, count]) => {
        if (actualMap.get(item) !== count) {
            throw new Error(`Expected item '${item}' to appear ${count} times, but found ${actualMap.get(item) || 0}`);
        }
    });
}
