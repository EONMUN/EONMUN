import { artworkImages, getDb, type Env } from '../db';
import { getAdminArtworks } from '../db/admin';

export async function getCollectionEditorArtworks(env: Env) {
	const [artworks, images] = await Promise.all([
		getAdminArtworks(env),
		getDb(env).select({ artworkId: artworkImages.artworkId, url: artworkImages.url, isDefault: artworkImages.isDefault }).from(artworkImages),
	]);
	const thumbnails = new Map<number, string>();
	for (const image of images) {
		if (!thumbnails.has(image.artworkId) || image.isDefault) thumbnails.set(image.artworkId, image.url);
	}
	return artworks.map(artwork => ({ ...artwork, thumbnailUrl: thumbnails.get(artwork.id) ?? null }));
}
