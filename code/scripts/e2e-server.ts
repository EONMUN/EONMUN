import { spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import setup from '../e2e/setup';

async function freePort() {
	const socket = createServer();
	await new Promise<void>((done) => socket.listen(0, '127.0.0.1', done));
	const address = socket.address();
	if (!address || typeof address === 'string') throw new Error('Could not allocate database port');
	const port = address.port;
	await new Promise<void>((done) => socket.close(() => done()));
	return port;
}

async function waitForDatabase(url: string, child?: ChildProcess) {
	for (let i = 0; i < 100; i++) {
		if (child?.exitCode !== null && child?.exitCode !== undefined) throw new Error('Local sqld exited');
		try { if ((await fetch(url)).status < 500) return; } catch { /* wait for socket */ }
		await new Promise((done) => setTimeout(done, 100));
	}
	throw new Error('Local sqld did not start');
}

let database: ChildProcess | undefined;
let databaseUrl = process.env.EONMUN_E2E_DATABASE_URL;
if (!databaseUrl) {
	const path = resolve('../.devenv/state/eonmun-e2e.sqld');
	mkdirSync(resolve('../.devenv/state'), { recursive: true });
	rmSync(path, { recursive: true, force: true });
	const port = await freePort();
	databaseUrl = `http://127.0.0.1:${port}`;
	database = spawn('sqld', ['--db-path', path, '--http-listen-addr', `127.0.0.1:${port}`, '--no-welcome'], { stdio: 'ignore' });
}
await waitForDatabase(databaseUrl, database);
const cleanup = await setup(databaseUrl);
const server = spawn('bun', ['run', 'dev', '--', '--port', process.argv[2]], { stdio: 'inherit' });
const stop = () => { server.kill('SIGTERM'); database?.kill('SIGTERM'); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
server.on('exit', (code) => { cleanup(); database?.kill('SIGTERM'); process.exit(code ?? 1); });
