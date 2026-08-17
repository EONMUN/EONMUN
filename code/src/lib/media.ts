// CRITICAL: artwork image URLs are fixed to the public EONMUN R2 origin and
// validated against it before they are stored.
export const R2_PUBLIC_ORIGIN = "https://r2.eonmun.com";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

// SECURITY: the declared content type is attacker-controlled, so each accepted
// type also has to match its magic bytes before the file reaches R2.
const ascii = (bytes: Uint8Array, start: number, end: number) =>
	new TextDecoder().decode(bytes.subarray(start, end));

const startsWithBytes = (bytes: Uint8Array, expected: number[]) =>
	expected.every((value, index) => bytes[index] === value);

function hasAvifBrand(bytes: Uint8Array) {
	if (bytes.byteLength < 16 || ascii(bytes, 4, 8) !== "ftyp") return false;
	const boxSize = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0);
	if (boxSize < 16 || boxSize > bytes.byteLength || (boxSize - 16) % 4 !== 0) return false;
	const brands = [ascii(bytes, 8, 12)];
	for (let offset = 16; offset < boxSize; offset += 4) brands.push(ascii(bytes, offset, offset + 4));
	return brands.includes("avif") || brands.includes("avis");
}

const IMAGE_TYPES = new Map<string, { extension: string; matches: (bytes: Uint8Array) => boolean }>([
	["image/jpeg", { extension: "jpg", matches: (b) => startsWithBytes(b, [0xff, 0xd8, 0xff]) }],
	["image/png", { extension: "png", matches: (b) => startsWithBytes(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) }],
	["image/gif", { extension: "gif", matches: (b) => /^GIF8[79]a$/.test(ascii(b, 0, 6)) }],
	["image/webp", { extension: "webp", matches: (b) => ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP" }],
	["image/avif", { extension: "avif", matches: hasAvifBrand }],
]);

export class MediaValidationError extends Error {}
export class MediaStorageError extends Error {}

export async function validateImageFile(file: File) {
	const type = IMAGE_TYPES.get(file.type);
	if (!type) throw new MediaValidationError("Only JPEG, PNG, WebP, GIF, and AVIF images are accepted");
	if (file.size === 0 || file.size > MAX_IMAGE_BYTES) throw new MediaValidationError("Each image must be no larger than 10 MB");
	const bytes = new Uint8Array(await file.slice(0, Math.min(file.size, 4096)).arrayBuffer());
	if (!type.matches(bytes)) throw new MediaValidationError("File content does not match its image type");
	return type.extension;
}

export async function uploadArtworkMedia(bucket: R2Bucket, files: File[]) {
	// Validate the complete batch before the first irreversible object write.
	const validated: { file: File; extension: string }[] = [];
	for (const file of files) {
		validated.push({ file, extension: await validateImageFile(file) });
	}

	const uploaded: { key: string; url: string; contentType: string }[] = [];
	for (const { file, extension } of validated) {
		const key = `artwork-media/${crypto.randomUUID()}.${extension}`;
		try {
			const result = await bucket.put(key, file, { httpMetadata: { contentType: file.type } });
			if (!result) throw new Error("R2 did not confirm the upload");
		} catch (error) {
			throw new MediaStorageError(error instanceof Error ? error.message : "R2 upload failed");
		}
		uploaded.push({ key, url: `${R2_PUBLIC_ORIGIN}/${key}`, contentType: file.type });
	}
	return uploaded;
}

export async function handleArtworkMediaUpload(request: Request, env: { R2_BUCKET?: R2Bucket }) {
	if (!env.R2_BUCKET) return Response.json({ error: "R2 media storage is unavailable" }, { status: 503 });
	try {
		const form = await request.formData();
		const files = form.getAll("images").filter((value): value is File => value instanceof File);
		if (files.length === 0) return Response.json({ error: "At least one image is required" }, { status: 400 });
		return Response.json({ images: await uploadArtworkMedia(env.R2_BUCKET, files) }, { status: 201 });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Upload failed";
		console.error(JSON.stringify({ message: "artwork media upload failed", error: message }));
		return Response.json(
			{ error: message },
			{ status: error instanceof MediaStorageError ? 502 : 400 },
		);
	}
}
