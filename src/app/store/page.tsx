import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Store | EONMUN',
  description: 'Shop our collection of artworks, prints, digital downloads, and merchandise.',
};

export default function StorePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Store</h1>
      <div className="text-center py-12">
        <p className="text-lg text-gray-600 mb-4">
          Store temporarily unavailable. Products will be added from database fixtures.
        </p>
        <Link href="/" className="text-blue-600 hover:underline">
          Return to Home
        </Link>
      </div>
    </main>
  );
}
