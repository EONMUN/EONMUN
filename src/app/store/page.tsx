import { Metadata } from 'next';
import Link from 'next/link';
import Image from '@/components/Image';
import { getAvailableProductsWithArtwork } from '@/actions/product';
import { getAllCollections } from '@/actions/collection';
import { PurchaseButton } from '@/components/PurchaseButton';
import { FrostedGlass } from '@/components/ui/FrostedGlass';
import type { ProductWithArtwork } from '@/models/product';

export const metadata: Metadata = {
  title: 'Shop | EONMUN',
  description: 'Shop original artworks by EONMUN.',
};

function ProductCard({ product }: { product: ProductWithArtwork }) {
  const priceInDollars = product.price / 100;
  const imageUrl = product.imageUrl || product.artwork?.defaultImageUrl;
  const description = product.description || product.artwork?.description;

  return (
    <div 
      className="group bg-surface border border-outline rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
      data-testid="product-card"
    >
      <Link href={`/store/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden bg-surface-variant">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
              No Image
            </div>
          )}

          {/* Description overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute bottom-4 left-4 right-4">
              <FrostedGlass variant="dark" className="p-3 rounded-lg">
                <h3 className="text-white font-medium text-lg">
                  {product.name}
                </h3>
                {product.artwork?.year && (
                  <p className="text-gray-300 text-sm">{product.artwork.year}</p>
                )}
                {description && (
                  <p className="text-gray-300 text-sm mt-2 line-clamp-2">
                    {description}
                  </p>
                )}
              </FrostedGlass>
            </div>
          </div>
        </div>
      </Link>

      <div className="p-4 space-y-3">
        <Link href={`/store/${product.slug}`}>
          <h3 className="font-semibold text-on-surface group-hover:text-primary transition-colors line-clamp-1">
            {product.name}
          </h3>
          {product.artwork?.year && (
            <p className="text-sm text-on-surface-variant">{product.artwork.year}</p>
          )}
        </Link>

        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-primary" data-testid="product-price">
            ${priceInDollars.toLocaleString()}
          </span>
        </div>

        <PurchaseButton 
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
          }} 
          variant="compact" 
        />
      </div>
    </div>
  );
}

export default async function StorePage() {
  const { data: products } = await getAvailableProductsWithArtwork({ type: 'artwork' });
  const { data: collections } = await getAllCollections();

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-on-background mb-2">Shop</h1>
        <p className="text-on-surface-variant">
          Original artworks available for purchase.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filter Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-surface border border-outline rounded-lg p-4">
            <h2 className="font-semibold text-on-surface mb-4">Collections</h2>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/store"
                  className="text-primary hover:underline"
                >
                  All Products
                </Link>
              </li>
              {collections.map((collection) => (
                <li key={collection.id}>
                  <Link
                    href={`/collections/${collection.slug}`}
                    className="text-on-surface-variant hover:text-primary transition-colors"
                  >
                    {collection.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-surface border border-outline rounded-lg p-4">
            <h2 className="font-semibold text-on-surface mb-4">Information</h2>
            <ul className="space-y-2 text-sm text-on-surface-variant">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Secure payment via Stripe
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Original artwork
              </li>
            </ul>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="lg:col-span-3">
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-on-surface-variant text-lg mb-4">
                No products available at this time.
              </p>
              <Link href="/" className="text-primary hover:underline">
                Return to Home
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
