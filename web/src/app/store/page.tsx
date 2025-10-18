import { Metadata } from 'next';
import Link from 'next/link';
import { Product } from '@/lib/strapi';
import { getAllProducts } from '@/actions/product';
import { PurchaseButton } from '@/components/PurchaseButton';
import Image from '@/components/Image';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Store | EONMUN',
  description: 'Shop our collection of artworks, prints, digital downloads, and merchandise.',
};

async function getProducts() {
  const { data: products } = await getAllProducts({
    sort: ['featured:desc', 'createdAt:desc'],
  });
  return products;
}

export default async function StorePage() {
  const products = await getProducts();

  if (!products || products.length === 0) {
    return (
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-on-background">Store</h1>
        <div className="text-center py-12">
          <p className="text-lg text-on-surface-variant">No products available at the moment.</p>
          <Link href="/" className="text-primary hover:underline mt-4 inline-block">
            Return to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4 text-on-background">Store</h1>
        <p className="text-lg text-on-surface-variant">
          Discover our collection of artworks, prints, digital downloads, and exclusive merchandise.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  );
}

function ProductCard({ product }: { product: Product }) {
  const displayImage = product.images?.[0] || product.artwork?.default_image;
  const productTypeLabels = {
    artwork: 'Original Artwork',
    print: 'Limited Edition Print',
    merchandise: 'Merchandise',
    digital: 'Digital Download',
    book: 'Art Book',
    other: 'Product'
  };

  return (
    <article className="bg-surface rounded-lg border border-outline overflow-hidden hover:shadow-lg transition-shadow" data-testid="product-card">
      <Link href={`/store/${product.slug}`}>
        <div className="aspect-square relative bg-surface">
          {displayImage ? (
            <Image
              image={displayImage}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
              No Image
            </div>
          )}
          {product.featured && (
            <div className="absolute top-2 left-2 bg-primary text-on-primary px-2 py-1 text-xs rounded">
              Featured
            </div>
          )}
          {product.is_digital && (
            <div className="absolute top-2 right-2 bg-secondary text-on-secondary px-2 py-1 text-xs rounded">
              Digital
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-4">
        <div className="mb-2">
          <span className="text-xs text-on-surface-variant uppercase tracking-wide">
            {productTypeLabels[product.product_type]}
          </span>
        </div>

        <h3 className="text-lg font-semibold mb-2 line-clamp-2">
          <Link href={`/store/${product.slug}`} className="text-on-surface hover:text-primary transition-colors">
            {product.title}
          </Link>
        </h3>

        {product.description && (
          <p className="text-sm text-on-surface-variant mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-on-surface" data-testid="product-price">
            ${product.price.toLocaleString()}
          </span>
          {!product.is_available && (
            <span className="text-red-600 dark:text-red-400 text-sm font-medium">Out of Stock</span>
          )}
        </div>
        
        {product.is_available && (
          <PurchaseButton
            item={product}
            type="product"
            className="w-full"
          />
        )}
      </div>
    </article>
  );
}