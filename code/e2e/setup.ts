import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, renameSync, writeFileSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';

const marker = '# EONMUN Playwright fixture environment';
const varsPath = resolve('.dev.vars');
const backupPath = resolve('.dev.vars.e2e-backup');

export default async function setup(databaseUrl: string) {
	if (existsSync(varsPath) && !readFileSync(varsPath, 'utf8').startsWith(marker)) {
		if (existsSync(backupPath)) throw new Error('Restore code/.dev.vars.e2e-backup before running Playwright');
		renameSync(varsPath, backupPath);
	}
	const env = { ...process.env, DATABASE_URL: databaseUrl };
	delete env.TURSO_DATABASE_URL;
	delete env.TURSO_AUTH_TOKEN;
	execFileSync('bun', ['run', 'db:migrate'], { env, stdio: 'inherit' });
	execFileSync('bun', ['run', 'db:seed'], { env, stdio: 'inherit' });
	writeFileSync(varsPath, `${marker}\nTURSO_DATABASE_URL="${databaseUrl}"\nAUTH_SECRET="eonmun-playwright-only-secret-at-least-32"\nAUTH_GOOGLE_ID="playwright-google-client"\nAUTH_GOOGLE_SECRET="playwright-google-secret"\nSTRIPE_SECRET_KEY="sk_test_playwright"\n`);
	return () => {
		if (existsSync(varsPath) && readFileSync(varsPath, 'utf8').startsWith(marker)) unlinkSync(varsPath);
		if (existsSync(backupPath)) renameSync(backupPath, varsPath);
	};
}
