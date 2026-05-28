import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const codeRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(codeRoot, "..");
const fixturesDir = path.join(repoRoot, "fixtures");
const outputDir = path.join(codeRoot, "src", "content", "products");

function toYamlScalar(value) {
	if (value === null || value === undefined) {
		return "null";
	}

	return JSON.stringify(value);
}

function toMdxBody(value) {
	const normalized = String(value ?? "")
		.replaceAll("\r\n", "\n")
		.trim();

	if (!normalized) {
		return "";
	}

	return normalized.split("\n").map((line) => line.trimEnd()).join("  \n");
}

async function readJson(name) {
	return JSON.parse(await fs.readFile(path.join(fixturesDir, name), "utf8"));
}

const [products, artworks] = await Promise.all([
	readJson("products.json"),
	readJson("artworks.json"),
]);
const artworkBySlug = new Map(artworks.map((artwork) => [artwork.slug, artwork]));

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });

for (const product of products) {
	const artwork = product.artworkSlug ? artworkBySlug.get(product.artworkSlug) : null;
	const slug = product.slug ?? product.artworkSlug;
	const name = product.name ?? artwork?.title ?? slug;
	const imageUrl = product.imageUrl ?? artwork?.images?.[0] ?? null;
	const publishedAt = product.publishedAt ?? artwork?.publishedAt ?? null;
	const body = toMdxBody(product.description);

	if (!slug || !name) {
		continue;
	}

	const fileContents = [
		"---",
		`type: ${toYamlScalar(product.type)}`,
		`artworkSlug: ${toYamlScalar(product.artworkSlug ?? null)}`,
		`name: ${toYamlScalar(name)}`,
		`description: ${toYamlScalar(product.description ?? null)}`,
		`imageUrl: ${toYamlScalar(imageUrl)}`,
		`price: ${JSON.stringify(product.price)}`,
		`quantity: ${toYamlScalar(product.quantity ?? null)}`,
		`publishedAt: ${toYamlScalar(publishedAt)}`,
		"---",
		"",
		body,
		"",
	].join("\n");

	await fs.writeFile(path.join(outputDir, `${slug}.mdx`), fileContents, "utf8");
}

console.log(`Synced products content to ${path.relative(codeRoot, outputDir)}`);
