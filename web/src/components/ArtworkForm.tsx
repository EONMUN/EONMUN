'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createArtwork, updateArtwork, deleteArtwork } from '@/actions/artwork';
import type { Artwork } from '@/lib/strapi';

interface ArtworkFormProps {
  artwork?: Artwork;
}

export default function ArtworkForm({ artwork }: ArtworkFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: artwork?.title || '',
    description: artwork?.description || '',
    year: artwork?.year?.toString() || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const data = {
        title: formData.title,
        description: formData.description || undefined,
        year: formData.year ? parseInt(formData.year) : undefined,
      };

      let result;
      if (artwork) {
        result = await updateArtwork(artwork.documentId, data);
      } else {
        result = await createArtwork(data);
      }

      if (result.success) {
        router.push('/admin/artworks');
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
    if (!artwork) return;
    
    if (!confirm('Are you sure you want to delete this artwork? This action cannot be undone.')) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await deleteArtwork(artwork.documentId);
      if (result.success) {
        router.push('/admin/artworks');
        router.refresh();
      } else {
        setError(result.error || 'Failed to delete artwork');
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
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter artwork title"
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
          placeholder="Enter artwork description"
        />
      </div>

      <div>
        <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
          Year
        </label>
        <input
          type="number"
          id="year"
          min="0"
          max="2050"
          value={formData.year}
          onChange={(e) => setFormData({ ...formData, year: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., 2024"
        />
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <div>
          {artwork && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 font-medium"
            >
              Delete Artwork
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
            {isSubmitting ? 'Saving...' : artwork ? 'Update Artwork' : 'Create Artwork'}
          </button>
        </div>
      </div>
    </form>
  );
}
