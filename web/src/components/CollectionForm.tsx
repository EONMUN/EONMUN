'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createCollection, updateCollection, deleteCollection } from '@/actions/collection';
import { getAllArtworks } from '@/actions/artwork';
import type { Collection, Artwork } from '@/lib/strapi';

interface CollectionFormProps {
  collection?: Collection;
}

export default function CollectionForm({ collection }: CollectionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loadingArtworks, setLoadingArtworks] = useState(true);
  const [formData, setFormData] = useState({
    name: collection?.name || '',
    artworks: collection?.artworks?.map((a) => a.documentId) || [],
  });

  useEffect(() => {
    const loadArtworks = async () => {
      try {
        const { data } = await getAllArtworks({
          populate: ['default_image'],
        });
        setArtworks(data);
      } catch (err) {
        console.error('Failed to load artworks:', err);
      } finally {
        setLoadingArtworks(false);
      }
    };
    loadArtworks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const data = {
        name: formData.name,
        artworks: formData.artworks,
      };

      let result;
      if (collection) {
        result = await updateCollection(collection.documentId, data);
      } else {
        result = await createCollection(data);
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
      const result = await deleteCollection(collection.documentId);
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

  const toggleArtwork = (documentId: string) => {
    setFormData((prev) => ({
      ...prev,
      artworks: prev.artworks.includes(documentId)
        ? prev.artworks.filter((id) => id !== documentId)
        : [...prev.artworks, documentId],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter collection name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Artworks
        </label>
        {loadingArtworks ? (
          <div className="text-gray-500">Loading artworks...</div>
        ) : artworks.length === 0 ? (
          <div className="text-gray-500">
            No artworks available. Create some artworks first.
          </div>
        ) : (
          <div className="border border-gray-300 rounded-md max-h-96 overflow-y-auto">
            {artworks.map((artwork) => (
              <label
                key={artwork.id}
                className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-200 last:border-b-0"
              >
                <input
                  type="checkbox"
                  checked={formData.artworks.includes(artwork.documentId)}
                  onChange={() => toggleArtwork(artwork.documentId)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="ml-3 flex items-center flex-1">
                  {artwork.default_image && (
                    <img
                      src={artwork.default_image.url}
                      alt={artwork.title}
                      className="h-10 w-10 rounded object-cover mr-3"
                    />
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-900">{artwork.title}</div>
                    {artwork.year && (
                      <div className="text-xs text-gray-500">{artwork.year}</div>
                    )}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}
        <div className="mt-2 text-sm text-gray-500">
          {formData.artworks.length} artwork{formData.artworks.length !== 1 ? 's' : ''} selected
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <div>
          {collection && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 font-medium"
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
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:bg-gray-100 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium"
          >
            {isSubmitting ? 'Saving...' : collection ? 'Update Collection' : 'Create Collection'}
          </button>
        </div>
      </div>
    </form>
  );
}
