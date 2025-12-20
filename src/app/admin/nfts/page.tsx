import Link from 'next/link';

export default function AdminNftsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">NFT Management</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* View Collection Card */}
        <Link
          href="/nfts/emn"
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
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">View Collection</h2>
          <p className="text-gray-600">
            Browse and view all NFTs in the EMN collection
          </p>
        </Link>

        {/* Mint NFT Card */}
        <Link
          href="/admin/nfts/mint"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Mint NFT</h2>
          <p className="text-gray-600">
            Create and mint new NFTs to the collection
          </p>
        </Link>

        {/* Contract Admin Card */}
        <Link
          href="/admin/nfts/contract"
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Contract Admin</h2>
          <p className="text-gray-600">
            Manage contract settings, roles, and royalties
          </p>
        </Link>
      </div>

      {/* Info Panel */}
      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">NFT Management</h3>
        <p className="text-blue-800">
          Manage your NFT collection from this panel. The collection is publicly viewable, but only admins can mint new NFTs and manage contract settings.
        </p>
      </div>
    </div>
  );
}
