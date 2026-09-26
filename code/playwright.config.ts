import { defineConfig, devices } from '@playwright/test';
import { execFileSync } from 'node:child_process';

const port = Number(process.env.EONMUN_E2E_PORT ?? execFileSync('./scripts/dev-port', ['4600', './e2e'], { encoding: 'utf8' }).trim());
process.env.EONMUN_E2E_PORT = String(port);

export default defineConfig({
	testDir: './e2e',
	fullyParallel: false,
	workers: 1,
	retries: process.env.CI ? 1 : 0,
	use: { baseURL: `http://127.0.0.1:${port}`, trace: 'retain-on-failure' },
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'],
		...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } } : {}) } }],
	webServer: process.env.EONMUN_E2E_EXTERNAL_SERVER ? undefined : {
		command: `bun run scripts/e2e-server.ts ${port}`, url: `http://127.0.0.1:${port}/artworks`,
		reuseExistingServer: false, timeout: 120_000,
	},
});
