import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Product Not Found | EONMUN',
};

export default function ProductPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <nav className="mb-6">
        <Link href="/store" className="text-blue-600 hover:underline">
          ← Back to Store
        </Link>
      </nav>
      <div className="text-center py-12">
        <p className="text-lg text-gray-600 mb-4">
          Product page temporarily unavailable.
        </p>
      </div>
    </main>
  );
}
