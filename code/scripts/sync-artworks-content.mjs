import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const codeRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(codeRoot, "..");
const fixturesPath = path.join(repoRoot, "fixtures", "artworks.json");
const outputDir = path.join(codeRoot, "src", "content", "artworks");

function toYamlScalar(value) {
	if (value === null || value === undefined) {
		return "null";
	}

	return JSON.stringify(value);
}

function toYamlArray(values) {
	if (!Array.isArray(values) || values.length === 0) {
		return "[]";
	}

	return `\n${values.map((value) => `  - ${JSON.stringify(value)}`).join("\n")}`;
}

function toYamlImages(images, title) {
	if (!Array.isArray(images) || images.length === 0) {
		return "[]";
	}

	return `\n${images
		.map((url, index) =>
			[
				"  - url: " + JSON.stringify(url),
				"    isDefault: " + JSON.stringify(index === 0),
				"    caption: " + JSON.stringify(title),
			].join("\n"),
		)
		.join("\n")}`;
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

const artworks = JSON.parse(await fs.readFile(fixturesPath, "utf8"));

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });

for (const artwork of artworks) {
	const collectionSlugs = artwork.collectionSlug ? [artwork.collectionSlug] : [];
	const body = toMdxBody(artwork.description);
	const fileContents = [
		"---",
		`title: ${toYamlScalar(artwork.title)}`,
		`description: ${toYamlScalar(artwork.description ?? null)}`,
		`artist: ${toYamlScalar(artwork.artist ?? null)}`,
		`year: ${toYamlScalar(artwork.year ?? null)}`,
		`publishedAt: ${toYamlScalar(artwork.publishedAt ?? null)}`,
		`locale: ${toYamlScalar(artwork.locale ?? "en")}`,
		`isDefaultForCollection: ${JSON.stringify(Boolean(artwork.isDefaultForCollection))}`,
		`collectionSlugs: ${toYamlArray(collectionSlugs)}`,
		`images: ${toYamlImages(artwork.images ?? [], artwork.title)}`,
		"---",
		"",
		body,
		"",
	].join("\n");

	const outputFile = path.join(outputDir, `${artwork.slug}.mdx`);
	await fs.writeFile(outputFile, fileContents, "utf8");
}

console.log(`Synced artworks content to ${path.relative(codeRoot, outputDir)}`);
