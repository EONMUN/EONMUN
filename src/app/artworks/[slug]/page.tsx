import Image from "@/components/Image";
import Link from "next/link";
import { getArtworkWithProductAndCollectionsBySlug } from "@/actions/artwork";
import { notFound } from "next/navigation";
import type { ArtworkWithProductAndCollections } from "@/models/artwork";
import type { SelectCollection } from "@/database";
import { PurchaseButton } from "@/components/PurchaseButton";

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

function ImageGallery({
  artwork,
}: {
  artwork: ArtworkWithProductAndCollections;
}) {
  const images = artwork.images || [];
  const defaultImage = images.find((img) => img.isDefault) || images[0];
  const mainImageSrc = defaultImage?.url || artwork.defaultImageUrl;

  if (!mainImageSrc) {
    return (
      <div className="aspect-square bg-surface border border-outline rounded-lg flex items-center justify-center">
        <span className="text-on-surface-variant text-lg">
          No Image Available
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="w-full rounded-lg border border-outline overflow-hidden bg-surface">
        <Image
          src={mainImageSrc}
          alt={artwork.title}
          className="w-full h-auto object-contain"
        />
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-4">
          {images.map((img, index) => (
            <div
              key={index}
              className={`aspect-square rounded-md overflow-hidden border ${
                img.url === mainImageSrc
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-outline"
              }`}
            >
              <Image
                src={img.url}
                alt={`${artwork.title} view ${index + 1}`}
                className="w-full h-full object-cover"
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
  const artwork = await getArtworkWithProductAndCollectionsBySlug(slug);

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
            <h1 className="text-4xl font-bold text-on-background mb-2">
              {artwork.title}
            </h1>
            {artwork.year && (
              <p className="text-xl text-on-surface-variant">{artwork.year}</p>
            )}
          </div>

          {/* Purchase Link or Button */}
          <div className="border-t border-b border-outline py-6">
            {artwork.product ? (
              <PurchaseButton
                product={{
                  id: artwork.product.id,
                  name: artwork.product.name,
                  slug: artwork.product.slug,
                  price: artwork.product.price,
                }}
              />
            ) : (
              <Link
                href={`/store/${artwork.slug}`}
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                View in Store
              </Link>
            )}
          </div>

          {artwork.description && (
            <div>
              <h2 className="text-lg font-semibold text-on-surface mb-3">
                Description
              </h2>
              <p className="text-on-surface leading-relaxed whitespace-pre-line">
                {artwork.description}
              </p>
            </div>
          )}

          {artwork.collections && artwork.collections.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-on-surface mb-3">
                Collection{artwork.collections.length > 1 ? "s" : ""}
              </h2>
              <div className="flex flex-wrap gap-2">
                {artwork.collections.map((collection) => (
                  <CollectionTag key={collection.id} collection={collection} />
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-6 border-t border-outline">
            <h2 className="text-lg font-semibold text-on-surface mb-3">
              Details
            </h2>
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
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
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
  const artwork = await getArtworkWithProductAndCollectionsBySlug(slug);

  if (!artwork) {
    return {
      title: "Artwork Not Found",
    };
  }

  return {
    title: `${artwork.title} - Artwork`,
    description:
      artwork.description ||
      `View ${artwork.title} ${artwork.year ? `from ${artwork.year}` : ""}`,
  };
}
