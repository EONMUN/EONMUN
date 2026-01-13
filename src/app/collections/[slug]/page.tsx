import Image from "@/components/Image";
import Link from "next/link";
import type { SelectArtwork } from "@/models/artwork";
import { getCollectionBySlug } from "@/actions/collection";
import { FrostedGlass } from "@/components/ui/FrostedGlass";
import { notFound } from "next/navigation";

// Enable ISR - revalidate every hour
export const revalidate = 3600;

interface CollectionPageProps {
  params: Promise<{
    slug: string;
  }>;
}

function ArtworkCard({ artwork }: { artwork: SelectArtwork }) {
  return (
    <Link href={`/artworks/${artwork.slug}`} className="block">
      <div className="group relative aspect-square overflow-hidden rounded-lg bg-surface border border-outline">
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

        {/* Artwork info overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-4 left-4 right-4">
            <FrostedGlass variant="dark" className="p-3 rounded-lg">
              <h3 className="text-white font-medium text-lg">
                {artwork.title}
              </h3>
              {artwork.year && (
                <p className="text-gray-300 text-sm">{artwork.year}</p>
              )}
              {artwork.description && (
                <p className="text-gray-300 text-sm mt-2 line-clamp-2">
                  {artwork.description}
                </p>
              )}
            </FrostedGlass>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default async function CollectionPage(props: CollectionPageProps) {
  const { slug } = await props.params;
  const collection = await getCollectionBySlug(slug);

  if (!collection) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Collection Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-4">
          <Link
            href="/collections"
            className="hover:text-primary transition-colors"
          >
            Collections
          </Link>
          <span>/</span>
          <span>{collection.name}</span>
        </div>

        <h1 className="text-4xl font-bold text-on-background mb-4">
          {collection.name}
        </h1>

        {collection.artworks && (
          <p className="text-on-surface-variant">
            {collection.artworks.length} artwork
            {collection.artworks.length !== 1 ? "s" : ""} in this collection
          </p>
        )}
      </div>

      {/* Artworks Grid */}
      {collection.artworks && collection.artworks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {collection.artworks.map((artwork) => (
            <ArtworkCard key={artwork.id} artwork={artwork} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-on-surface-variant text-lg">
            No artworks found in this collection.
          </p>
          <Link
            href="/collections"
            className="mt-4 inline-block text-primary hover:text-primary/80 transition-colors"
          >
            Browse all collections
          </Link>
        </div>
      )}
    </div>
  );
}

// Generate metadata for the page
export async function generateMetadata({ params }: CollectionPageProps) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);

  if (!collection) {
    return {
      title: "Collection Not Found",
    };
  }

  return {
    title: `${collection.name} - Collections`,
    description: `Browse artworks in the ${collection.name} collection`,
  };
}
