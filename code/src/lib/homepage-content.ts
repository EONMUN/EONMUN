import { getHomepageSlides as getHomepageRows } from "../db/queries";
import { getPublishedArtworkEntries, type PublishedArtworkDetail } from "./artwork-content";
import { getRuntimeEnv } from "./runtime-env";

export async function getHomepageSlides(): Promise<PublishedArtworkDetail[]> {
	const [homepageRows, published] = await Promise.all([
		getHomepageRows(getRuntimeEnv()),
		getPublishedArtworkEntries(),
	]);
	const bySlug = new Map(published.map((detail) => [detail.artwork.id, detail]));
	return homepageRows
		.filter((row) => row.defaultImageUrl)
		.map((row) => bySlug.get(row.slug) ?? null)
		.filter((detail): detail is PublishedArtworkDetail => detail !== null);
}
