import homepageSlugs from "../../../fixtures/homepage.json";

import { getPublishedArtworkEntries, type PublishedArtworkDetail } from "./artwork-content";

export async function getHomepageSlides(): Promise<PublishedArtworkDetail[]> {
	const artworkBySlug = new Map(
		(await getPublishedArtworkEntries()).map((detail) => [detail.artwork.id, detail]),
	);

	return homepageSlugs
		.map((slug) => artworkBySlug.get(slug) ?? null)
		.filter((detail): detail is PublishedArtworkDetail => detail !== null);
}
