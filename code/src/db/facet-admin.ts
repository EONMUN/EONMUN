import { and, eq, sql } from "drizzle-orm";
import { getDb, type Database, type Env } from "./index";
import { artworks, artworksToFacets, facets } from "./schema";
import {
	facetValue,
	facetSourceIds,
	isEditableFacet,
	type FacetMutation,
} from "../lib/facet-input";

export class FacetConflict extends Error {}
export async function getFacetDirectory(env: Env, db: Database = getDb(env)) {
	const values = await db
		.select()
		.from(facets)
		.orderBy(facets.namespace, facets.key, facets.value);
	const links = await db
		.select({
			facetId: artworksToFacets.facetId,
			slug: artworks.slug,
			title: artworks.title,
			publishedAt: artworks.publishedAt,
		})
		.from(artworksToFacets)
		.innerJoin(artworks, eq(artworks.id, artworksToFacets.artworkId));
	return values.map((facet) => ({
		...facet,
		editable: isEditableFacet(facet),
		artworks: links.filter((link) => link.facetId === facet.id),
	}));
}
export async function mutateFacet(
	env: Env,
	input: FacetMutation,
	db: Database = getDb(env),
) {
	return db.transaction(async (tx) => {
		const lookup = async (id: number) => {
			const [facet] = await tx.select().from(facets).where(eq(facets.id, id));
			if (!facet) throw new Error("Facet no longer exists. Reload the page.");
			if (!isEditableFacet(facet))
				throw new Error("This facet category is read-only");
			return facet;
		};
		const conflict = async (key: string, value: string, except?: number) => {
			const [existing] = await tx
				.select({ id: facets.id })
				.from(facets)
				.where(
					and(
						eq(facets.namespace, "artwork"),
						eq(facets.key, key),
						sql`${facets.value} = ${value} COLLATE NOCASE`,
					),
				);
			if (existing && existing.id !== except)
				throw new FacetConflict(
					"This value already exists. Merge the values instead.",
				);
		};
		if (input.action === "create") {
			const value = facetValue(input.value, input.key);
			await conflict(input.key, value);
			await tx
				.insert(facets)
				.values({ namespace: "artwork", key: input.key, value });
			return [];
		}

		if (input.action === "merge" || input.action === "mergeMany") {
			const target = await lookup(
				input.action === "merge" ? input.targetId : input.id,
			);
			const ids = facetSourceIds(
				input.action === "merge" ? [input.id] : input.sourceIds,
			);
			const sources = [];
			for (const id of ids) {
				if (id === target.id) throw new Error("Choose a different destination");
				const source = await lookup(id);
				if (source.namespace !== target.namespace || source.key !== target.key)
					throw new Error("Merge requires the same namespace and category");
				sources.push(source);
			}
			const affected = new Map<
				string,
				{ slug: string; publishedAt: Date | null }
			>();
			// CRITICAL: Validate every source before moving associations; one bad source aborts the complete merge.
			for (const source of sources) {
				const members = await tx
					.select({ slug: artworks.slug, publishedAt: artworks.publishedAt })
					.from(artworksToFacets)
					.innerJoin(artworks, eq(artworks.id, artworksToFacets.artworkId))
					.where(eq(artworksToFacets.facetId, source.id));
				for (const member of members) affected.set(member.slug, member);
				await tx.run(
					sql`UPDATE artworks SET updated_at = ${Math.floor(Date.now() / 1000)} WHERE id IN (SELECT artwork_id FROM artworks_to_facets WHERE facet_id = ${source.id})`,
				);
				// CRITICAL: SQL transfer keeps large association sets below the database parameter limit.
				await tx.run(
					sql`INSERT OR IGNORE INTO artworks_to_facets (artwork_id, facet_id, created_at) SELECT artwork_id, ${target.id}, created_at FROM artworks_to_facets WHERE facet_id = ${source.id}`,
				);
				await tx
					.delete(artworksToFacets)
					.where(eq(artworksToFacets.facetId, source.id));
				await tx.delete(facets).where(eq(facets.id, source.id));
			}
			return [...affected.values()];
		}
		const source = await lookup(input.id);
		const affected = await tx
			.select({ slug: artworks.slug, publishedAt: artworks.publishedAt })
			.from(artworksToFacets)
			.innerJoin(artworks, eq(artworks.id, artworksToFacets.artworkId))
			.where(eq(artworksToFacets.facetId, source.id));
		if (input.action !== "delete") {
			await tx.run(
				sql`UPDATE artworks SET updated_at = ${Math.floor(Date.now() / 1000)} WHERE id IN (SELECT artwork_id FROM artworks_to_facets WHERE facet_id = ${source.id})`,
			);
		}
		if (input.action === "rename") {
			const value = facetValue(input.value, source.key);
			await conflict(source.key, value, source.id);
			await tx
				.update(facets)
				.set({ value, updatedAt: new Date() })
				.where(eq(facets.id, source.id));
		} else {
			if (affected.length)
				throw new FacetConflict(
					"This value is used by artwork. Merge it instead.",
				);
			await tx.delete(facets).where(eq(facets.id, source.id));
		}
		return affected;
	});
}
