import { Metadata } from 'next';
import Link from 'next/link';
import { productAPI, Product } from '@/lib/strapi';
import { PurchaseButton } from '@/components/PurchaseButton';
import Image from '@/components/Image';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Store | EONMUN',
  description: 'Shop our collection of artworks, prints, digital downloads, and merchandise.',
};

async function getProducts() {
  try {
    const { data: products } = await productAPI.getAll({
      populate: ['images', 'artwork', 'artwork.default_image'],
      sort: ['featured:desc', 'createdAt:desc'],
    });
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export default async function StorePage() {
  const products = await getProducts();

  if (!products || products.length === 0) {
    return (
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Store</h1>
        <div className="text-center py-12">
          <p className="text-lg text-gray-600">No products available at the moment.</p>
          <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
            Return to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Store</h1>
        <p className="text-lg text-gray-600">
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
    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow" data-testid="product-card">
      <Link href={`/store/${product.slug}`}>
        <div className="aspect-square relative bg-gray-100">
          {displayImage ? (
            <Image
              image={displayImage}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
          {product.featured && (
            <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 text-xs rounded">
              Featured
            </div>
          )}
          {product.is_digital && (
            <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 text-xs rounded">
              Digital
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-4">
        <div className="mb-2">
          <span className="text-xs text-gray-500 uppercase tracking-wide">
            {productTypeLabels[product.product_type]}
          </span>
        </div>
        
        <h3 className="text-lg font-semibold mb-2 line-clamp-2">
          <Link href={`/store/${product.slug}`} className="hover:text-blue-600">
            {product.title}
          </Link>
        </h3>
        
        {product.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.description}
          </p>
        )}
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-gray-900" data-testid="product-price">
            ${product.price.toLocaleString()}
          </span>
          {!product.is_available && (
            <span className="text-red-600 text-sm font-medium">Out of Stock</span>
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