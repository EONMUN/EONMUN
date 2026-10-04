import { expect, test } from 'bun:test';
import { createAuth, getSession } from '../src/lib/auth';
import { GOOGLE_MERCHANT_SCOPE } from '../src/lib/google-merchant';
import { adminCookies, authTestSecret } from './helpers/auth';

const origin = 'https://eonmun.com';
const env = { AUTH_SECRET: authTestSecret, ADMIN_EMAILS: 'admin@example.com,other@example.com', AUTH_GOOGLE_ID: 'test-google-client', AUTH_GOOGLE_SECRET: 'test-google-secret' };
const setupBody = { provider: 'google', additionalData: { googleMerchantSetup: true } };
async function cookie() {
	return (await adminCookies(origin, 'admin@example.com')).map(c => `__Secure-${c.name}=${c.value}`).join('; ');
}

test('Merchant setup requires a same-origin production admin session', async () => {
	for (const [url, headers] of [
		[origin, { origin }],
		[origin, { origin: 'https://evil.example', cookie: await cookie() }],
		['https://preview-eonmun-astro.ncrmro.workers.dev', { origin: 'https://preview-eonmun-astro.ncrmro.workers.dev', cookie: await cookie() }],
	] as const) {
		const request = new Request(`${url}/api/auth/sign-in/social`, { method: 'POST', headers: { ...headers, 'content-type': 'application/json' }, body: JSON.stringify(setupBody) });
		expect([401, 403]).toContain((await createAuth(env, request).handler(request)).status);
	}
});

test.each([
	{ setup: true, email: 'admin@example.com', sub: 'google-test-admin', verified: true, scope: true, connects: true },
	{ setup: true, email: 'other@example.com', sub: 'other-admin', verified: true, scope: true, connects: false },
	{ setup: true, email: 'admin@example.com', sub: 'google-test-admin', verified: false, scope: true, connects: false },
	{ setup: true, email: 'admin@example.com', sub: 'google-test-admin', verified: true, scope: false, connects: false },
	{ setup: false, email: 'admin@example.com', sub: 'google-test-admin', verified: true, scope: true, connects: false },
])('Merchant consent uses the bound admin and never runs during ordinary login: %j', async (scenario) => {
	const keys = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
	const privateKey = Buffer.from(await crypto.subtle.exportKey('pkcs8', keys.privateKey)).toString('base64');
	const config = { ...env, GOOGLE_MERCHANT_ACCOUNT_ID: '123', GOOGLE_MERCHANT_DATA_SOURCE_ID: '456', GOOGLE_MERCHANT_SERVICE_ACCOUNT_JSON: JSON.stringify({ client_email: 'sync@project.iam.gserviceaccount.com', private_key: `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----` }) };
	const body = scenario.setup ? setupBody : { provider: 'google', callbackURL: `${origin}/admin`, additionalData: { serverContext: { googleMerchantAdminId: 'google-test-admin' } } };
	const start = new Request(`${origin}/api/auth/sign-in/social`, { method: 'POST', headers: { origin, cookie: await cookie(), 'content-type': 'application/json' }, body: JSON.stringify(body) });
	const initiated = await createAuth(config, start).handler(start);
	expect(initiated.status).toBe(200);
	const google = new URL((await initiated.json()).url);
	expect(google.searchParams.get('scope')?.includes(GOOGLE_MERCHANT_SCOPE)).toBe(scenario.setup);
	expect(google.searchParams.has('include_granted_scopes')).toBe(false);
	const stateCookie = initiated.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');
	const originalFetch = globalThis.fetch;
	let registrations = 0;
	let userAccessChecks = 0;
	globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = String(input);
		if (url === 'https://oauth2.googleapis.com/token') {
			if (String(init?.body).includes('jwt-bearer')) return Response.json({ access_token: 'service-token' });
			const profile = { sub: scenario.sub, email: scenario.email, email_verified: scenario.verified, name: 'Admin', aud: 'test-google-client', iss: 'https://accounts.google.com', exp: Math.floor(Date.now() / 1000) + 3600 };
			const idToken = `${Buffer.from('{"alg":"RS256"}').toString('base64url')}.${Buffer.from(JSON.stringify(profile)).toString('base64url')}.test`;
			return Response.json({ access_token: 'human-token', token_type: 'Bearer', expires_in: 3600, id_token: idToken, scope: scenario.scope ? `openid email profile ${GOOGLE_MERCHANT_SCOPE}` : 'openid email profile' });
		}
		if (url.endsWith(':registerGcp')) {
			registrations++;
			expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer human-token');
			return Response.json({});
		}
		if (url.includes('/users/')) {
			userAccessChecks++;
			expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer human-token');
			return Response.json({ accessRights: ['STANDARD'] });
		}
		if (url.includes('/dataSources/')) return Response.json({});
		throw new Error(`Unexpected request: ${url}`);
	}) as typeof fetch;
	try {
		const callback = new URL(`${origin}/api/auth/callback/google`);
		callback.searchParams.set('state', google.searchParams.get('state')!);
		callback.searchParams.set('code', 'test-code');
		const request = new Request(callback, { headers: { cookie: stateCookie } });
		const response = await createAuth(config, request).handler(request);
		expect(registrations).toBe(scenario.connects ? 1 : 0);
		expect(userAccessChecks).toBe(scenario.connects ? 1 : 0);
		const destination = response.headers.get('location')!;
		if (scenario.connects) {
			expect(destination).toBe(`${origin}/admin/google`);
			const cookies = response.headers.getSetCookie();
			expect(cookies.some(c => c.includes('account_data'))).toBe(false);
			const session = await getSession(new Request(`${origin}/admin`, { headers: { cookie: cookies.map(c => c.split(';')[0]).join('; ') } }), config);
			expect(session?.user.id).toBe('google-test-admin');
		} else if (scenario.setup) expect(destination).toContain('error=');
		else expect(destination).toBe(`${origin}/admin`);
	} finally { globalThis.fetch = originalFetch; }
});
