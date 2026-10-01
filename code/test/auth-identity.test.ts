import { expect, test } from 'bun:test';
import { createAuth, getSession } from '../src/lib/auth';
import { adminCookies, authTestSecret } from './helpers/auth';

const env = { AUTH_SECRET: authTestSecret, ADMIN_EMAILS: 'admin@example.com', AUTH_GOOGLE_ID: 'test-google-client', AUTH_GOOGLE_SECRET: 'test-google-secret' };
const preview = 'https://feat-better-auth-preview-eonmun-astro.ncrmro.workers.dev';

test('preview sends Google to production and rejects external callback origins', async () => {
	const request = new Request(`${preview}/api/auth/sign-in/social`, { method: 'POST', headers: { origin: preview, 'content-type': 'application/json' }, body: JSON.stringify({ provider: 'google', callbackURL: `${preview}/admin` }) });
	const response = await createAuth(env, request).handler(request);
	expect(response.status).toBe(200);
	const url = new URL((await response.json()).url);
	expect(url.hostname).toBe('accounts.google.com');
	expect(url.searchParams.get('redirect_uri')).toBe('https://eonmun.com/api/auth/callback/google');
	expect(url.searchParams.get('state')).toBeTruthy();
	const badRequest = new Request(request.url, { method: 'POST', headers: { origin: preview, 'content-type': 'application/json' }, body: JSON.stringify({ provider: 'google', callbackURL: 'https://evil.example/admin' }) });
	expect((await createAuth(env, badRequest).handler(badRequest)).status).toBe(403);
});

test('encrypted sessions preserve Google identity and enforce verified admin access on every read', async () => {
	for (const email of ['admin@example.com', 'outsider@example.com']) {
		const cookies = await adminCookies('http://localhost:4321', email);
		const request = new Request('http://localhost:4321/admin', { headers: { cookie: cookies.map(c => `${c.name}=${c.value}`).join('; ') } });
		const session = await getSession(request, env);
		if (email === 'admin@example.com') expect(session?.user.id).toBe('google-test-admin');
		else expect(session).toBeNull();
	}
});

test.each([
	{ email: 'admin@example.com', verified: true, allowed: true },
	{ email: 'outsider@example.com', verified: true, allowed: false },
	{ email: 'admin@example.com', verified: false, allowed: false },
])('proxy callback enforces admin access: %j', async ({ email, verified, allowed }) => {
	const start = new Request(`${preview}/api/auth/sign-in/social`, { method: 'POST', headers: { origin: preview, 'content-type': 'application/json' }, body: JSON.stringify({ provider: 'google', callbackURL: `${preview}/admin` }) });
	const initiated = await createAuth(env, start).handler(start);
	const google = new URL((await initiated.json()).url);
	const stateCookies = initiated.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
	const originalFetch = globalThis.fetch;
	globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
		const url = input instanceof Request ? input.url : String(input);
		if (url === 'https://oauth2.googleapis.com/token') {
			const profile = { sub: 'google-proxy-admin', email, email_verified: verified, name: 'Admin', aud: 'test-google-client', iss: 'https://accounts.google.com', exp: Math.floor(Date.now() / 1000) + 3600 };
			const idToken = `${Buffer.from('{"alg":"RS256"}').toString('base64url')}.${Buffer.from(JSON.stringify(profile)).toString('base64url')}.test`;
			return Response.json({ access_token: 'test-access-token', token_type: 'Bearer', expires_in: 3600, id_token: idToken });
		}
		return originalFetch(input, init);
	}) as typeof fetch;
	try {
		const callback = new URL('https://eonmun.com/api/auth/callback/google');
		callback.searchParams.set('state', google.searchParams.get('state')!);
		callback.searchParams.set('code', 'test-code');
		const prodRequest = new Request(callback);
		const production = await createAuth(env, prodRequest).handler(prodRequest);
		expect(production.status).toBe(302);
		const returnURL = new URL(production.headers.get('location')!);
		expect(returnURL.origin).toBe(preview);
		expect(returnURL.pathname).toBe('/api/auth/callback/google/oauth-proxy');
		const previewRequest = new Request(returnURL, { headers: { cookie: stateCookies } });
		const completed = await createAuth(env, previewRequest).handler(previewRequest);
		if (allowed) expect(completed.headers.get('location')).toBe(`${preview}/admin`);
		else expect(completed.headers.get('location')).toContain('error=admin_access_denied');
		const cookie = completed.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
		const sessionRequest = new Request(`${preview}/admin`, { headers: { cookie } });
		const session = await getSession(sessionRequest, env);
		if (allowed) expect(session?.user.id).toBe('google-proxy-admin');
		else expect(session).toBeNull();
	} finally {
		globalThis.fetch = originalFetch;
	}
});
