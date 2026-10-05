import { describe, expect, test } from "bun:test";
import { getVapidConfig } from "../src/lib/push/config";
import { base64UrlDecode, base64UrlEncode } from "../src/lib/push/encoding";
import { encryptPushPayload } from "../src/lib/push/encrypt";
import { createVapidToken, vapidAuthorization } from "../src/lib/push/vapid";

const b = (value: string) => base64UrlDecode(value.replace(/\s+/g, ""))!;

// RFC 8291 Appendix A.
const rfc = {
	plaintext: b("V2hlbiBJIGdyb3cgdXAsIEkgd2FudCB0byBiZSBhIHdhdGVybWVsb24"),
	asPublic: b("BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8"),
	asPrivate: "yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw",
	uaPublic: b("BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4"),
	uaPrivate: "q1dXpw3UpT5VOmu_cf_v6ih07Aems3njxI-JWgLcM94",
	salt: b("DGv6ra1nlYgDCS1FRnbzlw"),
	auth: b("BTBZMqHH6r4Tts7J_aSIgg"),
	header: "DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8",
	ciphertext: "8pfeW0KbunFT06SuDKoJH9Ql87S1QUrdirN6GcG7sFz1y1sqLgVi1VhjVkHsUoEsbI_0LpXMuGvnzQ",
};

const jwk = (point: Uint8Array, d: string): JsonWebKey => ({
	kty: "EC", crv: "P-256", d,
	x: base64UrlEncode(point.slice(1, 33)), y: base64UrlEncode(point.slice(33)),
});

describe("web push encryption", () => {
	test("matches the RFC 8291 worked example byte for byte", async () => {
		const privateKey = await crypto.subtle.importKey("jwk", jwk(rfc.asPublic, rfc.asPrivate), { name: "ECDH", namedCurve: "P-256" }, false, ["deriveBits"]);
		const body = await encryptPushPayload(rfc.plaintext, rfc.uaPublic, rfc.auth, { salt: rfc.salt, serverKeys: { privateKey, publicKey: rfc.asPublic } });
		expect(body.length).toBe(86 + b(rfc.ciphertext).length);
		expect(base64UrlEncode(body.slice(0, 86))).toBe(rfc.header);
		expect(base64UrlEncode(body.slice(86))).toBe(rfc.ciphertext);
	});

	test("uses a fresh salt and server key per message", async () => {
		const first = await encryptPushPayload(rfc.plaintext, rfc.uaPublic, rfc.auth);
		const second = await encryptPushPayload(rfc.plaintext, rfc.uaPublic, rfc.auth);
		expect(base64UrlEncode(first.slice(0, 16))).not.toBe(base64UrlEncode(second.slice(0, 16)));
		expect(base64UrlEncode(first.slice(21, 86))).not.toBe(base64UrlEncode(second.slice(21, 86)));
	});

	test("rejects an invalid user agent key", async () => {
		await expect(encryptPushPayload(rfc.plaintext, new Uint8Array(65).fill(4), rfc.auth)).rejects.toThrow();
	});
});

async function vapidPair() {
	const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]) as CryptoKeyPair;
	const publicKey = base64UrlEncode(await crypto.subtle.exportKey("raw", pair.publicKey) as ArrayBuffer);
	const privateKey = (await crypto.subtle.exportKey("jwk", pair.privateKey)).d!;
	return { publicKey, privateKey, verifyKey: pair.publicKey };
}

describe("VAPID", () => {
	test("signs an ES256 token for the push service origin", async () => {
		const pair = await vapidPair();
		const config = await getVapidConfig({ VAPID_PUBLIC_KEY: pair.publicKey, VAPID_PRIVATE_KEY: pair.privateKey, VAPID_SUBJECT: "mailto:alerts@example.com" })!;
		const now = Date.UTC(2026, 9, 5);
		const { token } = await createVapidToken(config, "https://web.push.apple.com", now);
		const [header, claims, signature] = token.split(".");
		expect(JSON.parse(new TextDecoder().decode(b(header)))).toEqual({ typ: "JWT", alg: "ES256" });
		const payload = JSON.parse(new TextDecoder().decode(b(claims)));
		expect(payload).toEqual({ aud: "https://web.push.apple.com", exp: now / 1000 + 12 * 3600, sub: "mailto:alerts@example.com" });
		expect(b(signature).length).toBe(64);
		expect(await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, pair.verifyKey, b(signature), new TextEncoder().encode(`${header}.${claims}`))).toBe(true);
	});

	test("reuses a token for at least an hour per push service", async () => {
		const pair = await vapidPair();
		const config = await getVapidConfig({ VAPID_PUBLIC_KEY: pair.publicKey, VAPID_PRIVATE_KEY: pair.privateKey })!;
		const endpoint = new URL("https://web.push.apple.com/abc");
		const now = Date.UTC(2026, 9, 5);
		const first = await vapidAuthorization(config, endpoint, now);
		expect(await vapidAuthorization(config, endpoint, now + 3_600_000)).toBe(first);
		expect(await vapidAuthorization(config, new URL("https://fcm.googleapis.com/fcm/send/x"), now)).not.toBe(first);
		expect(await vapidAuthorization(config, endpoint, now + 11.5 * 3_600_000)).not.toBe(first);
		expect(first).toEndWith(`, k=${pair.publicKey}`);
	});

	test("rejects a private key from another pair", async () => {
		const [one, two] = await Promise.all([vapidPair(), vapidPair()]);
		await expect(getVapidConfig({ VAPID_PUBLIC_KEY: one.publicKey, VAPID_PRIVATE_KEY: two.privateKey })!).rejects.toThrow("does not match");
	});

	test("is unconfigured without both keys", () => {
		expect(getVapidConfig({})).toBeNull();
		expect(getVapidConfig({ VAPID_PUBLIC_KEY: "BAAA" , VAPID_PRIVATE_KEY: "x" })).toBeNull();
	});
});
