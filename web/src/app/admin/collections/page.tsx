import Link from 'next/link';
import Image from '@/components/Image';
import { getAllCollectionsAdmin } from '@/actions/admin/collection';
// import { getCollectionWithArtworksAdmin } from '@/actions/admin/collection';

export const dynamic = 'force-dynamic';

export default async function CollectionsAdminPage() {
  const result = await getAllCollectionsAdmin();
  if ('error' in result) {
    return <div>Error: {result.error}</div>;
  }
  const collections = result.data;

  // Get artwork counts for each collection
  // TODO: Fix artwork count - need to query artworks_to_collections junction table
  const collectionsWithCounts = collections.map((collection) => ({
    ...collection,
    artworkCount: 0,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-on-background">Collections</h1>
        <Link
          href="/admin/collections/new"
          className="px-4 py-2 bg-primary text-on-primary rounded-md hover:opacity-90 font-medium"
        >
          + New Collection
        </Link>
      </div>

      {collections.length === 0 ? (
        <div className="bg-surface rounded-lg shadow-md p-12 text-center border border-outline">
          <svg
            className="w-16 h-16 text-on-surface-variant mx-auto mb-4"
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
          <h3 className="text-lg font-medium text-on-surface mb-2">No collections yet</h3>
          <p className="text-on-surface-variant mb-4">Get started by creating your first collection</p>
          <Link
            href="/admin/collections/new"
            className="inline-block px-4 py-2 bg-primary text-on-primary rounded-md hover:opacity-90 font-medium"
          >
            Create Collection
          </Link>
        </div>
      ) : (
        <div className="bg-surface rounded-lg shadow-md overflow-hidden border border-outline">
          <table className="min-w-full divide-y divide-outline">
            <thead className="bg-primary-container">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-on-primary-container uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-on-primary-container uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-on-primary-container uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-on-primary-container uppercase tracking-wider">
                  Artworks
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-on-primary-container uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-outline">
              {collectionsWithCounts.map((collection) => (
                <tr key={collection.id} className="hover:bg-primary-container/50">
                  <td className="px-6 py-4">
                    <div className="w-16 h-16 flex items-center justify-center bg-surface-variant rounded-md overflow-hidden">
                      {collection.defaultArtworkImageUrl ? (
                        <Image
                          src={collection.defaultArtworkImageUrl}
                          alt={collection.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg
                          className="w-8 h-8 text-on-surface-variant"
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
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/collections/${collection.slug}`}
                      className="text-sm font-medium text-primary hover:text-primary/80 hover:underline"
                    >
                      {collection.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-on-surface-variant truncate max-w-sm">
                      {collection.description || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-on-surface">
                      {collection.artworkCount} artwork{collection.artworkCount !== 1 ? 's' : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/admin/collections/${collection.slug}`}
                      className="text-primary hover:text-primary/80 mr-4"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
