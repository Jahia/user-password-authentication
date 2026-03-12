import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export class AllureCloudReporter {
    constructor(options = {}) {
        this.serverUrl = options.serverUrl || process.env.ALLURE_SERVER_URL || 'http://localhost:5050';
        this.projectId = options.projectId || process.env.ALLURE_PROJECT_ID || this.getProjectNameFromPackageJson();
        this.resultsDir = options.resultsDir || process.env.ALLURE_RESULTS_DIR || 'allure-results';
        this.username = options.username || process.env.ALLURE_USERNAME || 'admin';
        this.password = options.password || process.env.ALLURE_PASSWORD || 'admin123';
    }

    getProjectNameFromPackageJson() {
        try {
            const packageJsonPath = path.join(process.cwd(), 'package.json');
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            return packageJson.name?.replace(/-cypress$/, '') || 'default';
        } catch (error) {
            return 'default';
        }
    }

    getAuthHeader() {
        const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64');
        return `Basic ${credentials}`;
    }

    async sendResults() {
        const files = fs.readdirSync(this.resultsDir);

        if (files.length === 0) {
            console.log('No results to send');
            return;
        }

        const formData = new FormData();

        for (const file of files) {
            const filePath = path.join(this.resultsDir, file);
            if (fs.statSync(filePath).isFile()) {
                formData.append('files[]', fs.createReadStream(filePath), file);
            }
        }

        try {
            const response = await axios.post(
                `${this.serverUrl}/allure-docker-service/send-results?project_id=${this.projectId}`,
                formData,
                {
                    headers: {
                        ...formData.getHeaders(),
                        Authorization: this.getAuthHeader()
                    },
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity
                }
            );
            console.log(`✓ Results sent for project: ${this.projectId}`);
            return response.data;
        } catch (error) {
            console.error(`✗ Failed to send results: ${error.message}`);
            throw error;
        }
    }

    async generateReport() {
        try {
            const response = await axios.get(
                `${this.serverUrl}/allure-docker-service/generate-report?project_id=${this.projectId}`,
                {
                    headers: {
                        Authorization: this.getAuthHeader()
                    }
                }
            );

            const reportUrl = `${this.serverUrl}/allure-docker-service/projects/${this.projectId}/reports/latest`;
            console.log(`✓ Report generated: ${reportUrl}`);
            return reportUrl;
        } catch (error) {
            console.error(`✗ Failed to generate report: ${error.message}`);
            throw error;
        }
    }

    async uploadAndGenerate() {
        await this.sendResults();
        const reportUrl = await this.generateReport();
        return reportUrl;
    }
}

// ============================================
// CLI Runner - Executes when called directly
// ============================================
async function main() {
    console.log('🚀 Allure Cloud Reporter');
    console.log('========================');

    const reporter = new AllureCloudReporter();

    console.log(`Server:  ${reporter.serverUrl}`);
    console.log(`Project: ${reporter.projectId}`);
    console.log(`Results Dir: ${reporter.resultsDir}`);
    console.log('');

    try {
        const reportUrl = await reporter.uploadAndGenerate();
        console.log('');
        console.log('✓ Success!');
        console.log(`✓ Report: ${reportUrl}`);
        console.log('✓ UI: http://localhost:5252');
    } catch (error) {
        console.error('');
        console.error('✗ Failed:', error.message);
        process.exit(1);
    }
}

// Run main() when this file is executed directly
main();
