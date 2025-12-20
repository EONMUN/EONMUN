import Link from 'next/link';

export default function AdminPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
      
      <div className="grid md:grid-cols-3 gap-6">
        {/* Artworks Card */}
        <Link
          href="/admin/artworks"
          className="block p-8 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
        >
          <div className="flex items-center mb-4">
            <svg
              className="w-12 h-12 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Artworks</h2>
          <p className="text-gray-600">
            Create, edit, and manage artworks in your collection
          </p>
        </Link>

        {/* Collections Card */}
        <Link
          href="/admin/collections"
          className="block p-8 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
        >
          <div className="flex items-center mb-4">
            <svg
              className="w-12 h-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Collections</h2>
          <p className="text-gray-600">
            Organize artworks into collections and manage groupings
          </p>
        </Link>

        {/* NFTs Card */}
        <Link
          href="/admin/nfts"
          className="block p-8 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
        >
          <div className="flex items-center mb-4">
            <svg
              className="w-12 h-12 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">NFTs</h2>
          <p className="text-gray-600">
            Manage NFT collection, mint tokens, and configure contracts
          </p>
        </Link>
      </div>

      {/* Quick Stats or Info */}
      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Welcome to the Admin Panel</h3>
        <p className="text-blue-800">
          Use this panel to manage your artworks and collections. Changes made here will be reflected on the public website.
        </p>
      </div>
    </div>
  );
}
