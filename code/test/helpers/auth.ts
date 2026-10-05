import { makeSignature, symmetricEncodeJWT } from 'better-auth/crypto';

export const authTestSecret = 'eonmun-playwright-only-secret-at-least-32';

export async function adminCookies(url: string, email = 'ncrmro@gmail.com', googleId = 'google-test-admin') {
	const now = new Date();
	const user = { id: 'test-user', googleId, email, emailVerified: true, name: 'Test admin', createdAt: now, updatedAt: now };
	const session = { id: 'test-session', token: 'test-session-token', userId: user.id, createdAt: now, updatedAt: now, expiresAt: new Date(Date.now() + 3600_000) };
	const data = await symmetricEncodeJWT({ session, user, updatedAt: Date.now(), version: '1' }, authTestSecret, 'better-auth-session', 3600);
	const signature = await makeSignature(session.token, authTestSecret);
	return [
		{ name: 'better-auth.session_token', value: encodeURIComponent(`${session.token}.${signature}`), url },
		{ name: 'better-auth.session_data', value: data, url },
	];
}
