// RFC 8291 message encryption with the RFC 8188 aes128gcm content coding.
import { concatBytes, utf8, type Bytes } from "./encoding";

const RECORD_SIZE = 4096;
// One record: 16-byte tag and the 0x02 last-record delimiter share the record size.
export const MAX_PLAINTEXT_BYTES = RECORD_SIZE - 17;

async function hkdf(salt: Bytes, ikm: Bytes, info: Bytes, length: number) {
	const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
	return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, key, length * 8));
}

export interface EncryptionOverrides {
	salt?: Bytes;
	serverKeys?: { privateKey: CryptoKey; publicKey: Bytes };
}

export async function encryptPushPayload(
	plaintext: Bytes,
	userAgentPublic: Bytes,
	authSecret: Bytes,
	overrides: EncryptionOverrides = {},
) {
	if (plaintext.length > MAX_PLAINTEXT_BYTES) throw new Error("Push payload is too large");
	const userAgentKey = await crypto.subtle.importKey("raw", userAgentPublic, { name: "ECDH", namedCurve: "P-256" }, false, []);
	let serverKeys = overrides.serverKeys;
	if (!serverKeys) {
		const pair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]) as CryptoKeyPair;
		serverKeys = { privateKey: pair.privateKey, publicKey: new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey) as ArrayBuffer) };
	}
	const salt = overrides.salt ?? crypto.getRandomValues(new Uint8Array(16));
	const ecdhSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: userAgentKey }, serverKeys.privateKey, 256));
	const keyInfo = concatBytes(utf8("WebPush: info\0"), userAgentPublic, serverKeys.publicKey);
	const ikm = await hkdf(authSecret, ecdhSecret, keyInfo, 32);
	const cek = await hkdf(salt, ikm, utf8("Content-Encoding: aes128gcm\0"), 16);
	const nonce = await hkdf(salt, ikm, utf8("Content-Encoding: nonce\0"), 12);
	const key = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
	const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, key, concatBytes(plaintext, new Uint8Array([2]))));
	const header = new Uint8Array(21);
	header.set(salt);
	new DataView(header.buffer).setUint32(16, RECORD_SIZE);
	header[20] = serverKeys.publicKey.length;
	return concatBytes(header, serverKeys.publicKey, ciphertext);
}
