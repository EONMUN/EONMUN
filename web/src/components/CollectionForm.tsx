'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from '@/components/Image';
import { createCollectionAdmin, updateCollectionAdmin, deleteCollectionAdmin } from '@/actions/admin/collection';
import type { CollectionWithArtworks } from '@/models/collections';
import { generateSlug } from '@/lib/utils';

interface CollectionFormProps {
  collection?: CollectionWithArtworks;
}

export default function CollectionForm({ collection }: CollectionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: collection?.name || '',
    description: collection?.description || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const data = {
        name: formData.name,
        slug: collection?.slug || generateSlug(formData.name),
        description: formData.description || undefined,
      };

      let result;
      if (collection) {
        result = await updateCollectionAdmin(collection.id, data);
      } else {
        result = await createCollectionAdmin(data);
      }

      if (result.success) {
        router.push('/admin/collections');
        router.refresh();
      } else {
        setError(result.error || 'An error occurred');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!collection) return;
    
    if (!confirm('Are you sure you want to delete this collection? This action cannot be undone.')) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await deleteCollectionAdmin(collection.id);
      if (result.success) {
        router.push('/admin/collections');
        router.refresh();
      } else {
        setError(result.error || 'Failed to delete collection');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-on-surface mb-2">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 bg-surface text-on-surface border border-outline rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="Enter collection name"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-on-surface mb-2">
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-2 bg-surface text-on-surface border border-outline rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="Enter collection description"
        />
      </div>

      {collection && (
        <div className="space-y-4">
          {/* Default Artwork Display */}
          {collection.defaultArtwork && (
            <div className="bg-primary-container/30 border border-primary rounded-lg p-4">
              <p className="text-sm font-medium text-on-primary-container mb-3">
                Default Artwork
              </p>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 flex-shrink-0 rounded-md overflow-hidden border border-outline bg-surface-variant">
                  {collection.defaultArtwork.defaultImageUrl ? (
                    <Image
                      src={collection.defaultArtwork.defaultImageUrl}
                      alt={collection.defaultArtwork.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
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
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Link
                    href={`/admin/artworks/${collection.defaultArtwork.slug}`}
                    className="text-sm font-medium text-primary hover:text-primary/80 hover:underline"
                  >
                    {collection.defaultArtwork.title}
                  </Link>
                  {collection.defaultArtwork.artist && (
                    <p className="text-xs text-on-primary-container/80 mt-1">
                      by {collection.defaultArtwork.artist}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Artworks List */}
          <div className="bg-primary-container/30 border border-primary rounded-lg p-4">
            <p className="text-sm font-medium text-on-primary-container mb-3">
              <strong>Artworks in this collection:</strong> {collection.artworks?.length || 0}
            </p>

            {collection.artworks && collection.artworks.length > 0 ? (
              <div className="space-y-2">
                {collection.artworks.map((artwork) => (
                  <div
                    key={artwork.id}
                    className="flex items-center gap-3 p-2 bg-surface/50 rounded border border-outline/50"
                  >
                    <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden border border-outline bg-surface-variant">
                      {artwork.defaultImageUrl ? (
                        <Image
                          src={artwork.defaultImageUrl}
                          alt={artwork.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-on-surface-variant"
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
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/admin/artworks/${artwork.slug}`}
                        className="text-sm font-medium text-primary hover:text-primary/80 hover:underline block truncate"
                      >
                        {artwork.title}
                      </Link>
                      {artwork.artist && (
                        <p className="text-xs text-on-surface-variant truncate">
                          by {artwork.artist}
                        </p>
                      )}
                    </div>
                    {artwork.isDefaultForCollection && (
                      <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded font-medium flex-shrink-0">
                        Default
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-on-primary-container/80">
                No artworks in this collection yet.
              </p>
            )}

            <p className="text-xs text-on-primary-container/80 mt-3">
              To add or remove artworks from this collection, edit the artwork and select this collection.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-6 border-t border-outline">
        <div>
          {collection && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 font-medium"
            >
              Delete Collection
            </button>
          )}
        </div>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="px-4 py-2 border border-outline text-on-surface rounded-md hover:bg-primary-container disabled:opacity-50 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-primary text-on-primary rounded-md hover:opacity-90 disabled:opacity-50 font-medium"
          >
            {isSubmitting ? 'Saving...' : collection ? 'Update Collection' : 'Create Collection'}
          </button>
        </div>
      </div>
    </form>
  );
}
