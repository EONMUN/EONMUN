import { artworkAPI } from "@/lib/strapi";
import Image from "@/components/Image";
import Link from "next/link";
import { Artwork } from "@/lib/strapi";

function ArtworkCard({ artwork }: { artwork: Artwork }) {
  return (
    <div className="group">
      <Link 
        href={`/artworks/${artwork.slug}`}
        className="block"
      >
        <div className="aspect-square overflow-hidden rounded-lg bg-gray-100 mb-4">
          {artwork.default_image ? (
            <Image
              src={artwork.default_image.url}
              alt={artwork.default_image.alternativeText || artwork.title}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">No Image</span>
            </div>
          )}
        </div>
        
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 group-hover:text-gray-700 transition-colors mb-1">
            {artwork.title}
          </h3>
          {artwork.year && (
            <p className="text-sm text-gray-500">{artwork.year}</p>
          )}
          {artwork.collections && artwork.collections.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {artwork.collections.length} collection{artwork.collections.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}

export default async function ArtworksPage() {
  const { data } = await artworkAPI.getAll({
    populate: {
      default_image: true,
      collections: true,
    },
    sort: ['year:desc', 'title:asc'],
  });

  const artworks = data as Artwork[];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Artworks</h1>
        <p className="text-gray-600">
          Explore our complete collection of artworks
        </p>
        {artworks.length > 0 && (
          <p className="text-sm text-gray-500 mt-2">
            {artworks.length} artwork{artworks.length !== 1 ? 's' : ''} available
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
          <p className="text-gray-500 text-lg">No artworks found.</p>
          <Link 
            href="/collections" 
            className="mt-4 inline-block text-blue-600 hover:text-blue-800"
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
  const { data } = await artworkAPI.getAll();
  const artworkCount = data.length;

  return {
    title: `Artworks (${artworkCount}) - Gallery`,
    description: `Browse our collection of ${artworkCount} artworks`,
  };
} 