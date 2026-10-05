import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { readFile, readdir, unlink } from "node:fs/promises";
import * as schema from "../../src/db/schema";
import { base64UrlDecode, base64UrlEncode, concatBytes, utf8, type Bytes } from "../../src/lib/push/encoding";

const migrations = new URL("../../drizzle/", import.meta.url);

// Runs the real migration files so the tests exercise the shipped schema.
export async function createMigratedDb() {
	const path = `/tmp/eonmun-push-test-${crypto.randomUUID()}.db`;
	const client: Client = createClient({ url: `file:${path}` });
	for (const file of (await readdir(migrations)).filter((name) => name.endsWith(".sql")).sort()) {
		for (const statement of (await readFile(new URL(file, migrations), "utf8")).split("--> statement-breakpoint")) {
			if (statement.trim()) await client.execute(statement);
		}
	}
	return {
		client,
		db: drizzle(client, { schema }),
		async close() {
			client.close();
			await unlink(path).catch(() => undefined);
		},
	};
}

export async function vapidKeys() {
	const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]) as CryptoKeyPair;
	return {
		VAPID_PUBLIC_KEY: base64UrlEncode(await crypto.subtle.exportKey("raw", pair.publicKey) as ArrayBuffer),
		VAPID_PRIVATE_KEY: (await crypto.subtle.exportKey("jwk", pair.privateKey)).d!,
	};
}

// A browser-side subscription key pair, kept so tests can decrypt what was sent.
export async function browserKeys() {
	const pair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]) as CryptoKeyPair;
	const publicKey = new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey) as ArrayBuffer);
	const auth = crypto.getRandomValues(new Uint8Array(16));
	return { privateKey: pair.privateKey, publicKey, auth, p256dh: base64UrlEncode(publicKey), authText: base64UrlEncode(auth) };
}

async function hkdf(salt: Bytes, ikm: Bytes, info: Bytes, length: number) {
	const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
	return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, key, length * 8));
}

export async function decryptPush(body: Bytes, keys: Awaited<ReturnType<typeof browserKeys>>) {
	const salt = body.slice(0, 16);
	const idLength = body[20];
	const serverPublic = body.slice(21, 21 + idLength);
	const serverKey = await crypto.subtle.importKey("raw", serverPublic, { name: "ECDH", namedCurve: "P-256" }, false, []);
	const secret = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: serverKey }, keys.privateKey, 256));
	const ikm = await hkdf(keys.auth, secret, concatBytes(utf8("WebPush: info\0"), keys.publicKey, serverPublic), 32);
	const cek = await hkdf(salt, ikm, utf8("Content-Encoding: aes128gcm\0"), 16);
	const nonce = await hkdf(salt, ikm, utf8("Content-Encoding: nonce\0"), 12);
	const key = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["decrypt"]);
	const padded = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: nonce }, key, body.slice(21 + idLength)));
	let end = padded.length - 1;
	while (end > 0 && padded[end] === 0) end--;
	if (padded[end] !== 2) throw new Error("Missing last-record delimiter");
	return JSON.parse(new TextDecoder().decode(padded.slice(0, end)));
}

export function decodeJwtClaims(authorization: string) {
	const token = /^vapid t=([^,]+), k=/.exec(authorization)?.[1] ?? "";
	return JSON.parse(new TextDecoder().decode(base64UrlDecode(token.split(".")[1])!));
}

export type CapturedPush = { url: string; init: RequestInit; body: Bytes; headers: Headers };

export function pushServer(respond: (push: CapturedPush, index: number) => Response | Promise<Response> = () => new Response(null, { status: 201 })) {
	const calls: CapturedPush[] = [];
	const fetchImpl = (async (input: string | URL | Request, init: RequestInit = {}) => {
		const push = { url: String(input), init, body: new Uint8Array(init.body as Uint8Array) as Bytes, headers: new Headers(init.headers) };
		calls.push(push);
		return respond(push, calls.length - 1);
	}) as typeof fetch;
	return { calls, fetchImpl };
}
