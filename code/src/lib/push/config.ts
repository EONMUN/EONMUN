import { base64UrlDecode, base64UrlEncode, utf8 } from "./encoding";

export type PushEnv = {
	VAPID_PUBLIC_KEY?: string;
	VAPID_PRIVATE_KEY?: string;
	VAPID_SUBJECT?: string;
	ADMIN_EMAILS?: string;
};

export interface VapidConfig {
	publicKey: string;
	subject: string;
	signingKey: CryptoKey;
}

const DEFAULT_SUBJECT = "https://eonmun.com";

function stringValue(value: unknown) {
	return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function getVapidPublicKey(env: PushEnv) {
	const publicKey = stringValue(env.VAPID_PUBLIC_KEY);
	const bytes = publicKey ? base64UrlDecode(publicKey) : null;
	return bytes?.length === 65 && bytes[0] === 4 && stringValue(env.VAPID_PRIVATE_KEY) ? publicKey : null;
}

export function isPushConfigured(env: PushEnv) {
	return getVapidPublicKey(env) !== null;
}

function validSubject(subject: string) {
	if (subject.startsWith("mailto:")) return subject.length > 7;
	try {
		return new URL(subject).protocol === "https:";
	} catch {
		return false;
	}
}

let cached: { publicKey: string; privateKey: string; subject: string; config: Promise<VapidConfig> } | null = null;

async function importVapidConfig(publicKey: string, privateKey: string, subject: string): Promise<VapidConfig> {
	const point = base64UrlDecode(publicKey)!;
	const d = base64UrlDecode(privateKey);
	if (d?.length !== 32) throw new Error("VAPID_PRIVATE_KEY must be a base64url P-256 private key");
	if (!validSubject(subject)) throw new Error("VAPID_SUBJECT must be a mailto: address or https URL");
	const signingKey = await crypto.subtle.importKey("jwk", {
		kty: "EC", crv: "P-256", ext: false,
		x: base64UrlEncode(point.slice(1, 33)),
		y: base64UrlEncode(point.slice(33, 65)),
		d: base64UrlEncode(d),
	}, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]).catch(() => {
		throw new Error("VAPID_PRIVATE_KEY does not match VAPID_PUBLIC_KEY");
	});
	// A private key from another pair imports without error; prove the pair before any push service sees it.
	const verifyKey = await crypto.subtle.importKey("raw", point, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
	const probe = utf8("eonmun-vapid-pair-check");
	const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, signingKey, probe);
	if (!await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, verifyKey, signature, probe)) {
		throw new Error("VAPID_PRIVATE_KEY does not match VAPID_PUBLIC_KEY");
	}
	return { publicKey, subject, signingKey };
}

export function getVapidConfig(env: PushEnv): Promise<VapidConfig> | null {
	const publicKey = getVapidPublicKey(env);
	const privateKey = stringValue(env.VAPID_PRIVATE_KEY);
	if (!publicKey || !privateKey) return null;
	const subject = stringValue(env.VAPID_SUBJECT) ?? DEFAULT_SUBJECT;
	// Isolate-level memo of an imported key, not a request-bound client.
	if (cached?.publicKey !== publicKey || cached.privateKey !== privateKey || cached.subject !== subject) {
		const config = importVapidConfig(publicKey, privateKey, subject);
		cached = { publicKey, privateKey, subject, config };
		config.catch(() => { if (cached?.config === config) cached = null; });
	}
	return cached.config;
}
