import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const codeRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(codeRoot, "..");
const fixturesPath = path.join(repoRoot, "fixtures", "posts.json");
const outputDir = path.join(codeRoot, "src", "content", "posts");

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

const posts = JSON.parse(await fs.readFile(fixturesPath, "utf8"));

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });

for (const post of posts) {
	const body = String(post.body ?? "").trimEnd();
	const fileContents = [
		"---",
		`title: ${toYamlScalar(post.title)}`,
		`excerpt: ${toYamlScalar(post.excerpt ?? null)}`,
		`postType: ${toYamlScalar(post.postType)}`,
		`coverImageUrl: ${toYamlScalar(post.coverImageUrl ?? null)}`,
		`publishedAt: ${toYamlScalar(post.publishedAt ?? null)}`,
		`scheduledAt: ${toYamlScalar(post.scheduledAt ?? null)}`,
		`locale: ${toYamlScalar(post.locale ?? "en")}`,
		`artworkSlugs: ${toYamlArray(post.artworkSlugs ?? [])}`,
		`collectionSlugs: ${toYamlArray(post.collectionSlugs ?? [])}`,
		"---",
		"",
		body,
		"",
	].join("\n");

	const outputFile = path.join(outputDir, `${post.slug}.mdx`);
	await fs.writeFile(outputFile, fileContents, "utf8");
}

console.log(`Synced posts content to ${path.relative(codeRoot, outputDir)}`);
