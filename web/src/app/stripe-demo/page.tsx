import { PurchaseButton } from '@/components/PurchaseButton';
import { ARTWORK_PRICE } from '@/lib/stripe';

// Mock artwork data for demonstration
const mockArtwork = {
  id: 1,
  title: 'Digital Harmony',
  slug: 'digital-harmony',
  description: 'A stunning digital artwork exploring the intersection of technology and nature.',
  year: 2024,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  publishedAt: new Date('2024-01-01'),
  locale: 'en',
};

export default function StripeDemoPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-on-background mb-2">Stripe Store Demo</h1>
        <p className="text-on-surface-variant">
          Demonstration of the Stripe integration for purchasing artworks
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Mock Artwork Image */}
        <div>
          <div className="aspect-square overflow-hidden rounded-lg border border-outline bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
            <div className="text-center text-gray-600">
              <div className="text-6xl mb-4">🎨</div>
              <h3 className="text-xl font-semibold">Digital Harmony</h3>
              <p className="text-sm">Sample Artwork</p>
            </div>
          </div>
        </div>

        {/* Artwork Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-on-background mb-2">
              {mockArtwork.title}
            </h1>
            <p className="text-xl text-on-surface-variant">{mockArtwork.year}</p>
          </div>

          {/* Purchase Section */}
          <div className="border-t border-b border-outline py-6">
            <PurchaseButton artwork={mockArtwork} />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-on-surface mb-3">Description</h2>
            <p className="text-on-surface leading-relaxed">
              {mockArtwork.description}
            </p>
          </div>

          {/* Features */}
          <div className="bg-surface border border-outline rounded-lg p-6">
            <h3 className="text-lg font-semibold text-on-surface mb-3">
              What&apos;s Included
            </h3>
            <ul className="space-y-2 text-on-surface-variant">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                High-resolution digital artwork file
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                Certificate of authenticity
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                Commercial usage rights
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                Secure payment via Stripe
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Demo Information */}
      <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-blue-900 mb-3">
          🛍️ Stripe Store Implementation Complete
        </h2>
        <div className="text-blue-800 space-y-2">
          <p><strong>✅ Purchase Button:</strong> Ready to process payments</p>
          <p><strong>✅ Pricing Display:</strong> All artworks priced at ${ARTWORK_PRICE.toLocaleString()}</p>
          <p><strong>✅ Stripe Checkout:</strong> Secure payment processing</p>
          <p><strong>✅ Success Page:</strong> Confirmation and receipt</p>
          <p><strong>✅ API Integration:</strong> Backend checkout session creation</p>
        </div>
        
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800 text-sm">
            <strong>Note:</strong> This is a demonstration page. The purchase button requires valid Stripe API keys to function. 
            In production, make sure to configure your Stripe publishable and secret keys in the environment variables.
          </p>
        </div>
      </div>
    </div>
  );
}