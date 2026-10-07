import { beforeEach, afterEach, expect, test } from "bun:test";
import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { unlink } from "node:fs/promises";
import { eq } from "drizzle-orm";
import * as schema from "../src/db/schema";
import { createCatalogSchema } from "./schema-fixture";
import { getFacetDirectory, mutateFacet } from "../src/db/facet-admin";
import { parseFacetMutation } from "../src/lib/facet-input";
let client: Client;
let db: ReturnType<typeof drizzle<typeof schema>>;
let path: string;
beforeEach(async () => {
	path = `/tmp/eonmun-facets-${crypto.randomUUID()}.db`;
	client = createClient({ url: `file:${path}` });
	db = drizzle(client, { schema });
	await createCatalogSchema(client);
});
afterEach(async () => {
	client.close();
	await unlink(path).catch(() => {});
});
async function facet(key: string, value: string, namespace = "artwork") {
	return (
		await db.insert(schema.facets).values({ key, value, namespace }).returning()
	)[0];
}
async function artwork(slug: string, ids: number[]) {
	const [art] = await db
		.insert(schema.artworks)
		.values({ title: slug, slug, updatedAt: new Date(0) })
		.returning();
	for (const facetId of ids)
		await db
			.insert(schema.artworksToFacets)
			.values({ artworkId: art.id, facetId });
	return art;
}
test("rename retains ID and associations while case-insensitive collision requires merge", async () => {
	const source = await facet("material", "Canvas");
	await facet("material", "Paper");
	await artwork("one", [source.id]);
	await expect(
		mutateFacet({}, { action: "rename", id: source.id, value: "paper" }, db),
	).rejects.toThrow("Merge");
	await mutateFacet(
		{},
		{ action: "rename", id: source.id, value: "Linen" },
		db,
	);
	const directory = await getFacetDirectory({}, db);
	expect(directory.find((value) => value.id === source.id)?.value).toBe(
		"Linen",
	);
	expect(
		(await db.select().from(schema.artworks))[0].updatedAt.getTime(),
	).toBeGreaterThan(0);
	expect(
		directory
			.find((value) => value.id === source.id)
			?.artworks.map((art) => art.slug),
	).toEqual(["one"]);
});
test("merge preserves union, deduplicates overlap and removes source", async () => {
	const source = await facet("material", "Canvas");
	const target = await facet("material", "Linen");
	await artwork("source-only", [source.id]);
	await artwork("both", [source.id, target.id]);
	await artwork("target-only", [target.id]);
	await mutateFacet(
		{},
		{ action: "merge", id: source.id, targetId: target.id },
		db,
	);
	const directory = await getFacetDirectory({}, db);
	expect(directory).toHaveLength(1);
	expect(directory[0].artworks.map((art) => art.slug).sort()).toEqual([
		"both",
		"source-only",
		"target-only",
	]);
});
test("cross-category merge and derived or unknown mutation rejected without changes", async () => {
	const source = await facet("material", "Canvas");
	const target = await facet("medium", "Oil");
	const derived = await facet("orientation", "Portrait");
	const foreign = await facet("material", "Wood", "other");
	await expect(
		mutateFacet(
			{},
			{ action: "merge", id: source.id, targetId: target.id },
			db,
		),
	).rejects.toThrow("same namespace");
	for (const id of [derived.id, foreign.id])
		await expect(mutateFacet({}, { action: "delete", id }, db)).rejects.toThrow(
			"read-only",
		);
	expect(await getFacetDirectory({}, db)).toHaveLength(4);
});
test("delete refuses linked value and permits unused value", async () => {
	const linked = await facet("material", "Canvas");
	const unused = await facet("material", "Paper");
	await artwork("linked", [linked.id]);
	await expect(
		mutateFacet({}, { action: "delete", id: linked.id }, db),
	).rejects.toThrow("used by artwork");
	await mutateFacet({}, { action: "delete", id: unused.id }, db);
	expect(
		await db
			.select()
			.from(schema.facets)
			.where(eq(schema.facets.id, linked.id)),
	).toHaveLength(1);
});
test("validation rejects malformed IDs and editor-incompatible values", () => {
	for (const id of [true, "1", -1, 1.5, null])
		expect(() => parseFacetMutation({ action: "delete", id })).toThrow();
	for (const value of [" ", "!?!", "x".repeat(41)])
		expect(() =>
			parseFacetMutation({ action: "create", key: "tag", value }),
		).toThrow();
	expect(() =>
		parseFacetMutation({
			action: "create",
			key: "orientation",
			value: "Portrait",
		}),
	).toThrow();
	expect(
		parseFacetMutation({
			action: "create",
			key: "material",
			value: " Canvas ",
		}),
	).toEqual({ action: "create", key: "material", value: "Canvas" });
});
