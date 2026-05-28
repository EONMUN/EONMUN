import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const codeRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(codeRoot, "..");
const fixturesPath = path.join(repoRoot, "fixtures", "collections.json");
const outputDir = path.join(codeRoot, "src", "content", "collections");

const collections = JSON.parse(await fs.readFile(fixturesPath, "utf8"));

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });

for (const collection of collections) {
	const outputFile = path.join(outputDir, `${collection.slug}.json`);
	await fs.writeFile(
		outputFile,
		`${JSON.stringify(
			{
				name: collection.name,
				description: collection.description ?? null,
				publishedAt: collection.publishedAt ?? null,
				locale: collection.locale ?? "en",
			},
			null,
			2,
		)}\n`,
		"utf8",
	);
}

console.log(`Synced collections content to ${path.relative(codeRoot, outputDir)}`);
