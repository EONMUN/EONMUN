import { expect, test } from 'bun:test';
import { getAuthConfig } from '../src/lib/auth';

test('uses the same Google account ID across logins and exposes it in an allowed session', async () => {
	const callbacks = getAuthConfig({ AUTH_SECRET: 'test-secret', ADMIN_EMAILS: 'admin@example.com' }).callbacks!;
	for (const initialId of ['random-first-login', 'random-second-login']) {
		const token = await callbacks.jwt!({ token: { sub: initialId }, account: { provider: 'google', providerAccountId: 'google-123' } } as any);
		const session = await callbacks.session!({ token, session: { user: { email: 'admin@example.com' } } } as any);
		expect(session?.user?.id).toBe('google-123');
		expect(await callbacks.jwt!({ token, account: null } as any)).toEqual(token);
	}
	expect(await callbacks.session!({ token: { sub: 'other-id' }, session: { user: { email: 'outsider@example.com' } } } as any)).toBeNull();
});
