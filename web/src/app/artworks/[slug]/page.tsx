import Image from "@/components/Image";
import Link from "next/link";
import { Artwork, artworkAPI } from "@/lib/strapi";
import { notFound } from "next/navigation";

interface ArtworkPageProps {
  params: Promise<{
    slug: string;
  }>;
}

function CollectionTag({ collection }: { collection: any }) {
  return (
    <Link 
      href={`/collections/${collection.slug}`}
      className="inline-block px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
    >
      {collection.name}
    </Link>
  );
}

function ImageGallery({ artwork }: { artwork: Artwork }) {
  const allImages = artwork.images || [];
  const defaultImage = artwork.default_image;
  
  // Create a unique list with default_image first if it exists
  const displayImages = [];
  if (defaultImage) {
    displayImages.push(defaultImage);
  }
  
  // Add other images that aren't the default image
  allImages.forEach(img => {
    if (!defaultImage || img.id !== defaultImage.id) {
      displayImages.push(img);
    }
  });

  if (displayImages.length === 0) {
    return (
      <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
        <span className="text-gray-400 text-lg">No Image Available</span>
      </div>
    );
  }

  if (displayImages.length === 1) {
    return (
      <div className="aspect-square overflow-hidden rounded-lg">
        <Image
          src={displayImages[0].url}
          alt={displayImages[0].alternativeText || artwork.title}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {/* Main image */}
      <div className="aspect-square overflow-hidden rounded-lg">
        <Image
          src={displayImages[0].url}
          alt={displayImages[0].alternativeText || artwork.title}
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Additional images */}
      {displayImages.length > 1 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {displayImages.slice(1).map((image, index) => (
            <div key={image.id} className="aspect-square overflow-hidden rounded-md">
              <Image
                src={image.url}
                alt={image.alternativeText || `${artwork.title} - Image ${index + 2}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function ArtworkPage(props: ArtworkPageProps) {
  const { slug } = await props.params;
  const artwork = await artworkAPI.getBySlug(slug);

  if (!artwork) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link href="/" className="hover:text-gray-700">
          Home
        </Link>
        <span>/</span>
        <Link href="/artworks" className="hover:text-gray-700">
          Artworks
        </Link>
        <span>/</span>
        <span>{artwork.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image Gallery */}
        <div>
          <ImageGallery artwork={artwork} />
        </div>

        {/* Artwork Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{artwork.title}</h1>
            {artwork.year && (
              <p className="text-xl text-gray-600">{artwork.year}</p>
            )}
          </div>

          {artwork.description && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {artwork.description}
              </p>
            </div>
          )}

          {artwork.collections && artwork.collections.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Collections</h2>
              <div className="flex flex-wrap gap-2">
                {artwork.collections.map((collection) => (
                  <CollectionTag key={collection.id} collection={collection} />
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Details</h2>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-600">Created:</dt>
                <dd className="text-gray-900">
                  {new Date(artwork.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Last Updated:</dt>
                <dd className="text-gray-900">
                  {new Date(artwork.updatedAt).toLocaleDateString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Locale:</dt>
                <dd className="text-gray-900">{artwork.locale}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Back to Collections link */}
      <div className="mt-12 text-center">
        <Link 
          href="/collections" 
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Browse Collections
        </Link>
      </div>
    </div>
  );
}

// Generate metadata for the page
export async function generateMetadata({ params }: ArtworkPageProps) {
  const { slug } = await params;
  const artwork = await artworkAPI.getBySlug(slug);

  if (!artwork) {
    return {
      title: "Artwork Not Found",
    };
  }

  return {
    title: `${artwork.title} - Artwork`,
    description: artwork.description || `View ${artwork.title} ${artwork.year ? `from ${artwork.year}` : ''}`,
  };
} 