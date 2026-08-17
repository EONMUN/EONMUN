import { getAllCollections } from "../db/queries";
import { getRuntimeEnv } from "./runtime-env";
import { selectRelatedBySlug } from "./public-catalog";

export interface PublicCollectionRef {
	id: number;
	name: string;
	slug: string;
	description: string | null;
	publishedAt: string;
	locale: string;
}

export async function getPublishedCollectionRefs(): Promise<PublicCollectionRef[]> {
	const rows = await getAllCollections(getRuntimeEnv());
	return rows
		.map((row) => ({
			id: row.id,
			name: row.name,
			slug: row.slug,
			description: row.description,
			publishedAt: row.publishedAt?.toISOString() ?? "",
			locale: row.locale,
		}))
		.sort((left, right) => left.name.localeCompare(right.name));
}

export async function getPublishedCollectionsBySlugs(slugs: string[]) {
	return selectRelatedBySlug(slugs, await getPublishedCollectionRefs(), (collection) => collection.slug);
}
