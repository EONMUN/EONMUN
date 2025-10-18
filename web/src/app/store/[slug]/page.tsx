import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProductBySlug } from '@/actions/product';
import { PurchaseButton } from '@/components/PurchaseButton';
import Image from '@/components/Image';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: 'Product Not Found | EONMUN',
    };
  }

  return {
    title: `${product.title} | EONMUN Store`,
    description: product.description || `Shop ${product.title} - ${product.product_type}`,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const productTypeLabels = {
    artwork: 'Original Artwork',
    print: 'Limited Edition Print',
    merchandise: 'Merchandise',
    digital: 'Digital Download',
    book: 'Art Book',
    other: 'Product'
  };

  const displayImages = product.images || (product.artwork?.default_image ? [product.artwork.default_image] : []);

  return (
    <main className="container mx-auto px-4 py-8">
      <nav className="mb-6">
        <Link href="/store" className="text-primary hover:underline">
          ← Back to Store
        </Link>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          {displayImages.length > 0 ? (
            <>
              <div className="aspect-square bg-surface rounded-lg overflow-hidden">
                <Image
                  image={displayImages[0]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {displayImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {displayImages.slice(1, 5).map((image, index) => (
                    <div key={index} className="aspect-square bg-surface rounded overflow-hidden">
                      <Image
                        image={image}
                        alt={`${product.title} ${index + 2}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="aspect-square bg-surface rounded-lg flex items-center justify-center">
              <span className="text-on-surface-variant">No Image Available</span>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <div>
            <div className="mb-2">
              <span className="text-sm text-on-surface-variant uppercase tracking-wide">
                {productTypeLabels[product.product_type]}
              </span>
              {product.featured && (
                <span className="ml-2 bg-primary-container text-on-primary-container text-xs px-2 py-1 rounded">
                  Featured
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-on-background mb-2">{product.title}</h1>
            {product.sku && (
              <p className="text-sm text-on-surface-variant">SKU: {product.sku}</p>
            )}
          </div>

          {product.description && (
            <div>
              <h2 className="text-lg font-semibold mb-2 text-on-surface">Description</h2>
              <p className="text-on-surface leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Product Features */}
          <div className="space-y-2">
            {product.is_digital && (
              <div className="flex items-center text-sm text-secondary">
                <span className="w-2 h-2 bg-secondary rounded-full mr-2"></span>
                Digital download
              </div>
            )}
            {product.shipping_required && (
              <div className="flex items-center text-sm text-primary">
                <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                Physical shipping required
              </div>
            )}
            {product.stock_quantity > 0 && !product.is_digital && (
              <div className="flex items-center text-sm text-on-surface-variant">
                <span className="w-2 h-2 bg-on-surface-variant rounded-full mr-2"></span>
                {product.stock_quantity} in stock
              </div>
            )}
          </div>

          {/* Related Artwork */}
          {product.artwork && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-2 text-on-surface">Related Artwork</h3>
              <Link
                href={`/artworks/${product.artwork.slug}`}
                className="flex items-center space-x-3 text-primary hover:underline"
              >
                {product.artwork.default_image && (
                  <div className="w-12 h-12 bg-surface rounded overflow-hidden">
                    <Image
                      image={product.artwork.default_image}
                      alt={product.artwork.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <span>{product.artwork.title}</span>
              </Link>
            </div>
          )}

          {/* Purchase Section */}
          <div className="border-t pt-6">
            {product.is_available ? (
              <PurchaseButton
                item={product}
                type="product"
                className="w-full max-w-sm"
              />
            ) : (
              <div className="w-full max-w-sm">
                <div className="text-3xl font-bold text-on-background mb-2">
                  ${product.price.toLocaleString()}
                </div>
                <div className="bg-surface text-on-surface px-6 py-3 rounded-lg text-center border border-outline">
                  Currently Unavailable
                </div>
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="text-sm text-on-surface-variant space-y-1">
            <p>Currency: {product.currency}</p>
            <p>Secure payment powered by Stripe</p>
            {product.is_digital && (
              <p>Digital items are delivered instantly after purchase</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
