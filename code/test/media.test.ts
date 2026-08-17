import { describe, expect, test } from "bun:test";
import { handleArtworkMediaUpload, uploadArtworkMedia, validateImageFile } from "../src/lib/media";

const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0]);

function isoFileTypeBox(majorBrand: string, compatibleBrands: string[] = []) {
	const bytes = new Uint8Array(16 + compatibleBrands.length * 4);
	new DataView(bytes.buffer).setUint32(0, bytes.byteLength);
	bytes.set(new TextEncoder().encode("ftyp"), 4);
	bytes.set(new TextEncoder().encode(majorBrand), 8);
	for (const [index, brand] of compatibleBrands.entries()) {
		bytes.set(new TextEncoder().encode(brand), 16 + index * 4);
	}
	return bytes;
}

function uploadRequest(files: File[]) {
	const form = new FormData();
	for (const file of files) form.append("images", file);
	return new Request("https://eonmun.test/api/admin/media", { method: "POST", body: form });
}

describe("artwork media", () => {
	test("uploads multiple images with content types and random keys", async () => {
		const puts: unknown[][] = [];
		const bucket = { put: async (...args: unknown[]) => { puts.push(args); return { key: args[0] }; } } as R2Bucket;
		const files = [new File([png], "a.png", { type: "image/png" }), new File([png], "b.png", { type: "image/png" })];
		const uploaded = await uploadArtworkMedia(bucket, files);
		expect(uploaded).toHaveLength(2);
		expect(uploaded[0].key).toStartWith("artwork-media/");
		expect(uploaded[0].key).not.toBe(uploaded[1].key);
		expect((puts[0][2] as R2PutOptions).httpMetadata).toEqual({ contentType: "image/png" });
	});

	test("rejects SVG and disguised non-image content", async () => {
		await expect(validateImageFile(new File(["<svg/>"], "x.svg", { type: "image/svg+xml" }))).rejects.toThrow("Only JPEG");
		await expect(validateImageFile(new File(["not png"], "x.png", { type: "image/png" }))).rejects.toThrow("does not match");
	});

	test("accepts AVIF and AVIS major or compatible brands", async () => {
		for (const bytes of [
			isoFileTypeBox("avif"),
			isoFileTypeBox("avis"),
			isoFileTypeBox("mif1", ["avif"]),
			isoFileTypeBox("mif1", ["avis"]),
		]) {
			await expect(validateImageFile(new File([bytes], "image.avif", { type: "image/avif" }))).resolves.toBe("avif");
		}
	});

	test("rejects non-AVIF ISO BMFF input", async () => {
		await expect(
			validateImageFile(new File([isoFileTypeBox("mif1", ["heic"])], "image.avif", { type: "image/avif" })),
		).rejects.toThrow("does not match");
	});

	test("rejects images over 10 MB", async () => {
		await expect(validateImageFile(new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.png", { type: "image/png" }))).rejects.toThrow("10 MB");
	});

	test("propagates an R2 failure", async () => {
		const bucket = { put: async () => { throw new Error("R2 failed"); } } as R2Bucket;
		await expect(uploadArtworkMedia(bucket, [new File([png], "a.png", { type: "image/png" })])).rejects.toThrow("R2 failed");
	});

	test("validates every file before the first R2 write", async () => {
		let puts = 0;
		const bucket = { put: async () => { puts += 1; return { key: "unused" }; } } as R2Bucket;
		const response = await handleArtworkMediaUpload(uploadRequest([
			new File([png], "valid.png", { type: "image/png" }),
			new File(["not png"], "invalid.png", { type: "image/png" }),
		]), { R2_BUCKET: bucket });
		expect(response.status).toBe(400);
		expect(puts).toBe(0);
	});

	test("returns a server error when a later R2 write fails", async () => {
		let puts = 0;
		const bucket = {
			put: async (...args: unknown[]) => {
				puts += 1;
				if (puts === 2) throw new Error("R2 failed");
				return { key: args[0] };
			},
		} as R2Bucket;
		const response = await handleArtworkMediaUpload(uploadRequest([
			new File([png], "first.png", { type: "image/png" }),
			new File([png], "second.png", { type: "image/png" }),
		]), { R2_BUCKET: bucket });
		expect(response.status).toBe(502);
		expect(puts).toBe(2);
	});

	test("fails closed when the R2 binding is missing", async () => {
		const request = new Request("https://eonmun.test/api/admin/media", { method: "POST", body: new FormData() });
		const response = await handleArtworkMediaUpload(request, {});
		expect(response.status).toBe(503);
	});
});
