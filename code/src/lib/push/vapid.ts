import type { VapidConfig } from "./config";
import { base64UrlEncode, utf8 } from "./encoding";

const TOKEN_LIFETIME_MS = 12 * 60 * 60 * 1000;
// Apple asks senders not to refresh a VAPID token more than once an hour.
const MIN_REMAINING_MS = 60 * 60 * 1000;
const tokens = new Map<string, { token: string; expiresAt: number }>();

export async function createVapidToken(config: VapidConfig, audience: string, now = Date.now()) {
	const expiresAt = Math.floor((now + TOKEN_LIFETIME_MS) / 1000);
	const header = base64UrlEncode(utf8(JSON.stringify({ typ: "JWT", alg: "ES256" })));
	const claims = base64UrlEncode(utf8(JSON.stringify({ aud: audience, exp: expiresAt, sub: config.subject })));
	const unsigned = `${header}.${claims}`;
	// Web Crypto emits the raw r||s form that JWS ES256 requires.
	const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, config.signingKey, utf8(unsigned));
	return { token: `${unsigned}.${base64UrlEncode(signature)}`, expiresAt: expiresAt * 1000 };
}

export async function vapidAuthorization(config: VapidConfig, endpoint: URL, now = Date.now()) {
	const audience = endpoint.origin;
	// Isolate-level token memo keyed by signer and push service; holds no request state.
	const key = `${config.publicKey}|${config.subject}|${audience}`;
	let entry = tokens.get(key);
	if (!entry || entry.expiresAt - now < MIN_REMAINING_MS) {
		entry = await createVapidToken(config, audience, now);
		tokens.set(key, entry);
	}
	return `vapid t=${entry.token}, k=${config.publicKey}`;
}
