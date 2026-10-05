import { base64UrlDecode } from "./encoding";

// SECURITY: subscription endpoints come from the browser and the Worker later POSTs
// a signed VAPID token to them. Limiting them to the browser push services stops a
// signed-in session from aiming the Worker at internal or arbitrary hosts (SSRF)
// and keeps tokens away from third parties. A new browser push service needs an
// entry here before its users can enable alerts.
const PUSH_SERVICE_HOSTS = ["fcm.googleapis.com"];
const PUSH_SERVICE_SUFFIXES = [".push.apple.com", ".push.services.mozilla.com", ".notify.windows.com"];
const MAX_ENDPOINT_LENGTH = 2048;
export const MAX_SUBSCRIPTION_BODY_BYTES = 4096;

export interface PushSubscriptionInput {
	endpoint: string;
	p256dh: string;
	auth: string;
}

export class PushInputError extends Error {}

export function parsePushEndpoint(value: unknown): URL {
	if (typeof value !== "string" || !value || value.length > MAX_ENDPOINT_LENGTH) throw new PushInputError("Invalid push endpoint");
	let url: URL;
	try {
		url = new URL(value);
	} catch {
		throw new PushInputError("Invalid push endpoint");
	}
	const host = url.hostname;
	const allowed = PUSH_SERVICE_HOSTS.includes(host) || PUSH_SERVICE_SUFFIXES.some((suffix) => host.endsWith(suffix) && host.length > suffix.length);
	if (url.protocol !== "https:" || url.username || url.password || url.port || url.hash || !allowed) {
		throw new PushInputError("Unsupported push service");
	}
	return url;
}

export async function parseSubscriptionInput(body: unknown): Promise<PushSubscriptionInput> {
	if (!body || typeof body !== "object") throw new PushInputError("Invalid subscription");
	const { endpoint, keys } = body as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
	const url = parsePushEndpoint(endpoint);
	const p256dh = typeof keys?.p256dh === "string" ? keys.p256dh : "";
	const auth = typeof keys?.auth === "string" ? keys.auth : "";
	const point = base64UrlDecode(p256dh);
	const secret = base64UrlDecode(auth);
	if (point?.length !== 65 || point[0] !== 4 || secret?.length !== 16) throw new PushInputError("Invalid subscription keys");
	try {
		// Import rejects points that are not on the P-256 curve.
		await crypto.subtle.importKey("raw", point, { name: "ECDH", namedCurve: "P-256" }, false, []);
	} catch {
		throw new PushInputError("Invalid subscription keys");
	}
	return { endpoint: url.href, p256dh: p256dh.replace(/=+$/, ""), auth: auth.replace(/=+$/, "") };
}

export function parseEndpointBody(body: unknown) {
	return parsePushEndpoint((body as { endpoint?: unknown } | null)?.endpoint).href;
}

export async function readJsonBody(request: Request, maxBytes = MAX_SUBSCRIPTION_BODY_BYTES): Promise<unknown> {
	if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
		throw new PushInputError("Expected JSON");
	}
	if (Number(request.headers.get("content-length") ?? 0) > maxBytes) throw new PushInputError("Request body is too large");
	const bytes = await request.arrayBuffer();
	if (bytes.byteLength > maxBytes) throw new PushInputError("Request body is too large");
	try {
		return JSON.parse(new TextDecoder().decode(bytes));
	} catch {
		throw new PushInputError("Invalid JSON");
	}
}

export function deviceLabel(userAgent: string | null) {
	if (!userAgent) return null;
	const device = /iPhone/.test(userAgent) ? "iPhone" : /iPad/.test(userAgent) ? "iPad" : /Android/.test(userAgent) ? "Android"
		: /Macintosh/.test(userAgent) ? "Mac" : /Windows/.test(userAgent) ? "Windows" : /Linux/.test(userAgent) ? "Linux" : "Device";
	const browser = /Edg\//.test(userAgent) ? "Edge" : /Firefox\//.test(userAgent) ? "Firefox"
		: /Chrome\//.test(userAgent) ? "Chrome" : /Safari\//.test(userAgent) ? "Safari" : "browser";
	return `${device} · ${browser}`;
}
