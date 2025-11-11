'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createCollectionAdmin, updateCollectionAdmin, deleteCollectionAdmin, getCollectionWithArtworksAdmin, type Collection } from '@/actions/admin/collection';
import { generateSlug } from '@/lib/utils';

interface CollectionFormProps {
  collection?: Collection;
}

export default function CollectionForm({ collection }: CollectionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [artworkCount, setArtworkCount] = useState(0);
  const [formData, setFormData] = useState({
    name: collection?.name || '',
    description: collection?.description || '',
  });

  useEffect(() => {
    const loadArtworkCount = async () => {
      if (collection) {
        try {
          const collectionWithArtworks = await getCollectionWithArtworksAdmin(collection.id);
          setArtworkCount(collectionWithArtworks?.artworks?.length || 0);
        } catch (err) {
          console.error('Failed to load artworks:', err);
        }
      }
    };
    loadArtworkCount();
  }, [collection]);

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
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter collection description"
        />
      </div>

      {collection && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Artworks in this collection:</strong> {artworkCount}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            To add or remove artworks from this collection, edit the artwork and select this collection.
          </p>
        </div>
      )}

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
