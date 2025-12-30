import { getAllArtworksWithProducts } from "@/actions/artwork";
import Image from "@/components/Image";
import Link from "next/link";
import type { ArtworkWithProductAndCollections } from "@/models/artwork";

function ArtworkCard({
  artwork,
}: {
  artwork: ArtworkWithProductAndCollections;
}) {
  const price = artwork.product ? artwork.product.price / 100 : null;

  return (
    <div className="group">
      <Link href={`/artworks/${artwork.slug}`} className="block">
        <div className="aspect-square overflow-hidden rounded-lg bg-surface border border-outline mb-4">
          {artwork.defaultImageUrl ? (
            <Image
              src={artwork.defaultImageUrl}
              alt={artwork.title}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-surface flex items-center justify-center">
              <span className="text-on-surface-variant">No Image</span>
            </div>
          )}
        </div>

        <div className="text-center">
          <h3 className="text-lg font-medium text-on-background group-hover:text-primary transition-colors mb-1">
            {artwork.title}
          </h3>
          {artwork.year && (
            <p className="text-sm text-on-surface-variant">{artwork.year}</p>
          )}
          {artwork.collections && artwork.collections.length > 0 && (
            <p className="text-xs text-on-surface-variant mt-1">
              {artwork.collections.map((c) => c.name).join(", ")}
            </p>
          )}
          {price !== null && (
            <p className="text-sm font-semibold text-primary mt-2">
              ${price.toLocaleString()}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}

export default async function ArtworksPage() {
  const { data } = await getAllArtworksWithProducts();
  const artworks = data;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-on-background mb-2">Artworks</h1>
        <p className="text-on-surface-variant">
          Explore our complete collection of artworks
        </p>
        {artworks.length > 0 && (
          <p className="text-sm text-on-surface-variant mt-2">
            {artworks.length} artwork{artworks.length !== 1 ? "s" : ""}{" "}
            available
          </p>
        )}
      </div>

      {artworks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {artworks.map((artwork) => (
            <ArtworkCard key={artwork.id} artwork={artwork} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-on-surface-variant text-lg">No artworks found.</p>
          <Link
            href="/collections"
            className="mt-4 inline-block text-primary hover:text-primary/80 transition-colors"
          >
            Browse collections instead
          </Link>
        </div>
      )}
    </div>
  );
}

// Generate metadata for the page
export async function generateMetadata() {
  const { data } = await getAllArtworksWithProducts();
  const artworkCount = data.length;

  return {
    title: `Artworks (${artworkCount}) - Gallery`,
    description: `Browse our collection of ${artworkCount} artworks`,
  };
}
