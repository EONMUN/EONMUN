export function base64UrlEncode(bytes: Uint8Array | ArrayBuffer) {
	const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
	let binary = "";
	for (const byte of view) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export type Bytes = Uint8Array<ArrayBuffer>;

export function base64UrlDecode(value: string): Bytes | null {
	if (!/^[A-Za-z0-9_-]*={0,2}$/.test(value)) return null;
	const normalized = value.replace(/=+$/, "").replace(/-/g, "+").replace(/_/g, "/");
	if (normalized.length % 4 === 1) return null;
	try {
		const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
		return Uint8Array.from(binary, (character) => character.charCodeAt(0));
	} catch {
		return null;
	}
}

export function concatBytes(...parts: Uint8Array[]): Bytes {
	const result = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
	let offset = 0;
	for (const part of parts) {
		result.set(part, offset);
		offset += part.length;
	}
	return result;
}

export const utf8 = (value: string): Bytes => new TextEncoder().encode(value) as Bytes;
