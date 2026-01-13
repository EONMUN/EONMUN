import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from '@/components/Image';
import { getProductBySlug } from '@/actions/product';
import { PurchaseButton } from '@/components/PurchaseButton';
import type { ProductWithArtwork } from '@/models/product';

// Enable ISR - revalidate every hour
export const revalidate = 3600;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

function ProductGallery({ product }: { product: ProductWithArtwork }) {
  const imageUrl = product.imageUrl || product.artwork?.defaultImageUrl;

  if (imageUrl) {
    return (
      <div className="space-y-4">
        <div className="aspect-square rounded-lg border border-outline overflow-hidden bg-surface">
          <Image
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-square bg-surface border border-outline rounded-lg flex items-center justify-center">
      <span className="text-on-surface-variant">No Image Available</span>
    </div>
  );
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const artwork = product.artwork;
  const description = product.description || artwork?.description;

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-on-surface-variant mb-8">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/store" className="hover:text-primary transition-colors">Shop</Link>
        <span>/</span>
        <span className="text-on-surface">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Gallery */}
        <ProductGallery product={product} />

        {/* Product Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-on-background mb-2">
              {product.name}
            </h1>
            {artwork?.artist && (
              <p className="text-lg text-on-surface-variant">by {artwork.artist}</p>
            )}
            {artwork?.year && (
              <p className="text-on-surface-variant">{artwork.year}</p>
            )}
          </div>

          {/* Purchase Section */}
          <div className="bg-surface border border-outline rounded-lg p-6">
            <PurchaseButton product={product} />
          </div>

          {/* What's Included */}
          <div className="bg-primary-container/10 border border-primary/20 rounded-lg p-4">
            <h3 className="font-semibold text-on-surface mb-3">What&apos;s Included</h3>
            <ul className="space-y-2 text-sm text-on-surface-variant">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Original artwork
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Secure packaging and shipping
              </li>
            </ul>
          </div>

          {description && (
            <div>
              <h2 className="text-lg font-semibold text-on-surface mb-3">Description</h2>
              <p className="text-on-surface leading-relaxed whitespace-pre-line">
                {description}
              </p>
            </div>
          )}

          {/* Dimensions (from artwork) */}
          {artwork && (artwork.width || artwork.height || artwork.depth) && (
            <div>
              <h2 className="text-lg font-semibold text-on-surface mb-3">Dimensions</h2>
              <p className="text-on-surface-variant">
                {[artwork.width, artwork.height, artwork.depth]
                  .filter(Boolean)
                  .join(' x ')}{' '}
                {artwork.dimensionUnit || 'in'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Back to Shop */}
      <div className="mt-12 text-center">
        <Link
          href="/store"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Shop
        </Link>
      </div>
    </main>
  );
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: 'Product Not Found | EONMUN' };
  }

  return {
    title: `${product.name} | Shop EONMUN`,
    description: product.description || `Purchase ${product.name} by EONMUN.`,
  };
}
