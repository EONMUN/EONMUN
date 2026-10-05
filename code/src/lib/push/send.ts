import type { VapidConfig } from "./config";
import { base64UrlDecode, base64UrlEncode, utf8, type Bytes } from "./encoding";
import { encryptPushPayload, MAX_PLAINTEXT_BYTES } from "./encrypt";
import { parsePushEndpoint } from "./subscription-input";
import { vapidAuthorization } from "./vapid";

export const PUSH_TIMEOUT_MS = 10_000;
// Stale sale alerts are not useful; the push service drops undelivered messages after a day.
export const PUSH_TTL_SECONDS = 24 * 60 * 60;

export interface PushPayload {
	title: string;
	body: string;
	url: string;
	tag: string;
}

export interface PushTarget {
	endpoint: string;
	p256dh: string;
	auth: string;
}

export type PushOutcome =
	| { kind: "sent"; status: number }
	| { kind: "gone"; status: number }
	| { kind: "retry"; status: number | null; error: string; retryAfterMs: number | null }
	| { kind: "failed"; status: number | null; error: string };

export async function pushTopic(value: string) {
	const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", utf8(value)));
	// RFC 8030 topics are at most 32 base64url characters.
	return base64UrlEncode(digest.slice(0, 24));
}

function retryAfter(header: string | null, now: number) {
	if (!header) return null;
	const seconds = Number(header);
	if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
	const date = Date.parse(header);
	return Number.isFinite(date) ? Math.max(0, date - now) : null;
}

export async function sendPush(
	config: VapidConfig,
	target: PushTarget,
	payload: PushPayload,
	options: { fetchImpl?: typeof fetch; now?: number; topic?: string } = {},
): Promise<PushOutcome> {
	const now = options.now ?? Date.now();
	let endpoint: URL;
	let body: Bytes;
	let authorization: string;
	try {
		// Stored rows are re-validated so a changed allowlist or edited row cannot widen egress.
		endpoint = parsePushEndpoint(target.endpoint);
		const plaintext = utf8(JSON.stringify(payload));
		if (plaintext.length > MAX_PLAINTEXT_BYTES) return { kind: "failed", status: null, error: "Payload too large" };
		body = await encryptPushPayload(plaintext, base64UrlDecode(target.p256dh) ?? new Uint8Array(), base64UrlDecode(target.auth) ?? new Uint8Array());
		authorization = await vapidAuthorization(config, endpoint, now);
	} catch {
		return { kind: "failed", status: null, error: "Invalid subscription" };
	}
	const headers: Record<string, string> = {
		authorization,
		"content-encoding": "aes128gcm",
		"content-type": "application/octet-stream",
		ttl: String(PUSH_TTL_SECONDS),
		urgency: "high",
	};
	if (options.topic) headers.topic = options.topic;
	let response: Response;
	try {
		response = await (options.fetchImpl ?? fetch)(endpoint.href, {
			method: "POST",
			headers,
			body,
			// SECURITY: a redirect would carry the signed request to an unvalidated host.
			redirect: "manual",
			signal: AbortSignal.timeout(PUSH_TIMEOUT_MS),
		});
	} catch (error) {
		const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
		return { kind: "retry", status: null, error: timedOut ? "Timed out" : "Network error", retryAfterMs: null };
	}
	// Push service bodies are not needed and may echo request details; discard them.
	await response.body?.cancel().catch(() => undefined);
	const status = response.status;
	if (status >= 200 && status < 300) return { kind: "sent", status };
	if (status === 404 || status === 410) return { kind: "gone", status };
	if (status === 408 || status === 429 || status >= 500) {
		return { kind: "retry", status, error: `HTTP ${status}`, retryAfterMs: retryAfter(response.headers.get("retry-after"), now) };
	}
	return { kind: "failed", status, error: status >= 300 && status < 400 ? `Unexpected redirect (HTTP ${status})` : `HTTP ${status}` };
}
