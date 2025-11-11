import Image from "@/components/Image";
import Link from "next/link";
import { getArtworkBySlug } from "@/actions/artwork";
import { notFound } from "next/navigation";
import { PurchaseButton } from "@/components/PurchaseButton";
import type { ArtworkWithCollections } from "@/models/artwork";
import type { SelectCollection } from "@/database/factories/collection.factory";

interface ArtworkPageProps {
  params: Promise<{
    slug: string;
  }>;
}

function CollectionTag({ collection }: { collection: SelectCollection }) {
  return (
    <Link 
      href={`/collections/${collection.slug}`}
      className="inline-block px-3 py-1 text-sm bg-primary-container hover:bg-primary-container/80 text-on-primary-container rounded-full transition-colors"
    >
      {collection.name}
    </Link>
  );
}

function ImageGallery({ artwork }: { artwork: ArtworkWithCollections }) {
  if (artwork.defaultImageUrl) {
    return (
      <div className="aspect-square overflow-hidden rounded-lg border border-outline">
        <Image
          src={artwork.defaultImageUrl}
          alt={artwork.title}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="aspect-square bg-surface border border-outline rounded-lg flex items-center justify-center">
      <span className="text-on-surface-variant text-lg">No Image Available</span>
    </div>
  );
}

export default async function ArtworkPage(props: ArtworkPageProps) {
  const { slug } = await props.params;
  const artwork = await getArtworkBySlug(slug);

  if (!artwork) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-8">
        <Link href="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/artworks" className="hover:text-primary transition-colors">
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
            <h1 className="text-4xl font-bold text-on-background mb-2">{artwork.title}</h1>
            {artwork.year && (
              <p className="text-xl text-on-surface-variant">{artwork.year}</p>
            )}
          </div>

          {/* Purchase Section */}
          <div className="border-t border-b border-outline py-6">
            <PurchaseButton artwork={artwork} />
          </div>

          {artwork.description && (
            <div>
              <h2 className="text-lg font-semibold text-on-surface mb-3">Description</h2>
              <p className="text-on-surface leading-relaxed whitespace-pre-line">
                {artwork.description}
              </p>
            </div>
          )}

          {artwork.collection && (
            <div>
              <h2 className="text-lg font-semibold text-on-surface mb-3">Collection</h2>
              <div className="flex flex-wrap gap-2">
                <CollectionTag collection={artwork.collection} />
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-6 border-t border-outline">
            <h2 className="text-lg font-semibold text-on-surface mb-3">Details</h2>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-on-surface-variant">Created:</dt>
                <dd className="text-on-surface">
                  {new Date(artwork.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-on-surface-variant">Last Updated:</dt>
                <dd className="text-on-surface">
                  {new Date(artwork.updatedAt).toLocaleDateString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-on-surface-variant">Locale:</dt>
                <dd className="text-on-surface">{artwork.locale}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Back to Collections link */}
      <div className="mt-12 text-center">
        <Link 
          href="/collections" 
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
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
  const artwork = await getArtworkBySlug(slug);

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