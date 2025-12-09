import Link from "next/link";
import Image from "@/components/Image";
import { getAllArtworksWithProductsAndCollectionsAdmin } from "@/actions/admin/artwork";

export const dynamic = "force-dynamic";

export default async function ArtworksAdminPage() {
  const result = await getAllArtworksWithProductsAndCollectionsAdmin();
  if ("error" in result) {
    return <div>Error: {result.error}</div>;
  }
  const artworks = result.data;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-on-background">Artworks</h1>
        <Link
          href="/admin/artworks/new"
          className="px-4 py-2 bg-primary text-on-primary rounded-md hover:opacity-90 font-medium"
        >
          + New Artwork
        </Link>
      </div>

      {artworks.length === 0 ? (
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
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-on-surface mb-2">
            No artworks yet
          </h3>
          <p className="text-on-surface-variant mb-4">
            Get started by creating your first artwork
          </p>
          <Link
            href="/admin/artworks/new"
            className="inline-block px-4 py-2 bg-primary text-on-primary rounded-md hover:opacity-90 font-medium"
          >
            Create Artwork
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
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-on-primary-container uppercase tracking-wider">
                  Artist
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-on-primary-container uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-on-primary-container uppercase tracking-wider">
                  Collection
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-on-primary-container uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-outline">
              {artworks.map((artwork) => (
                <tr
                  key={artwork.id}
                  className="hover:bg-primary-container/50 cursor-pointer relative"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/artworks/${artwork.slug}`}
                      className="absolute inset-0"
                      aria-label={`Edit ${artwork.title}`}
                    />
                    {artwork.defaultImageUrl ? (
                      <div className="w-16 h-16 rounded border border-outline overflow-hidden">
                        <Image
                          src={artwork.defaultImageUrl}
                          alt={artwork.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded border border-outline bg-primary-container flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-on-primary-container"
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
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-primary">
                      {artwork.title}
                    </span>
                    {artwork.description && (
                      <div className="text-sm text-on-surface-variant truncate max-w-xs">
                        {artwork.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-on-surface">
                      {artwork.artist || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-on-surface">
                      {artwork.product?.price
                        ? `$${(artwork.product.price / 100).toFixed(2)}`
                        : "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-on-surface">
                      {artwork.collections.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {artwork.collections.map((collection) => (
                            <span
                              key={collection.id}
                              className="inline-block px-2 py-0.5 bg-primary-container text-on-primary-container rounded text-xs"
                            >
                              {collection.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        "-"
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <span className="text-primary">Edit</span>
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
