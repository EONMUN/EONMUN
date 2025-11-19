'use client';

import { useState } from 'react';
// import { useEffect } from 'react'; // TODO: Re-enable when collection loading is implemented
import { useRouter } from 'next/navigation';
import Image from '@/components/Image';
import { createArtworkAdmin, updateArtworkAdmin, deleteArtworkAdmin, type Artwork } from '@/actions/admin/artwork';
// import { getAllCollectionsAdmin, type Collection } from '@/actions/admin/collection';
import { generateSlug } from '@/lib/utils';

interface ArtworkFormProps {
  artwork?: Artwork;
}

export default function ArtworkForm({ artwork }: ArtworkFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const [collections, setCollections] = useState<Collection[]>([]);
  const [formData, setFormData] = useState({
    title: artwork?.title || '',
    description: artwork?.description || '',
    artist: artwork?.artist || '',
    price: artwork?.price?.toString() || '',
    // collectionId: artwork?.collectionId?.toString() || '',
  });

  // TODO: Reimplement collection loading for many-to-many relationship
  // useEffect(() => {
  //   const loadCollections = async () => {
  //     try {
  //       const result = await getAllCollectionsAdmin();
  //       if ('data' in result) {
  //         setCollections(result.data);
  //       }
  //     } catch (err) {
  //       console.error('Failed to load collections:', err);
  //     }
  //   };
  //   loadCollections();
  // }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const data = {
        title: formData.title,
        slug: artwork?.slug || generateSlug(formData.title),
        description: formData.description || undefined,
        artist: formData.artist || undefined,
        price: formData.price ? parseInt(formData.price) : undefined,
        // collectionId: formData.collectionId ? parseInt(formData.collectionId) : undefined,
      };

      let result;
      if (artwork) {
        result = await updateArtworkAdmin(artwork.id, data);
      } else {
        result = await createArtworkAdmin(data);
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
      const result = await deleteArtworkAdmin(artwork.id);
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

      {/* Image Preview */}
      {artwork && (
        <div>
          <label className="block text-sm font-medium text-on-surface mb-2">
            Current Image
          </label>
          {artwork.defaultImageUrl ? (
            <div className="w-full rounded-lg border border-outline overflow-hidden bg-surface">
              <Image
                src={artwork.defaultImageUrl}
                alt={artwork.title}
                className="w-full h-auto object-contain"
              />
            </div>
          ) : (
            <div className="w-full aspect-video rounded-lg border border-outline bg-primary-container flex flex-col items-center justify-center">
              <svg
                className="w-16 h-16 text-on-primary-container mb-2"
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
              <span className="text-on-primary-container text-sm">No Image Available</span>
            </div>
          )}
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-on-surface mb-2">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-2 bg-surface text-on-surface border border-outline rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="Enter artwork title"
        />
      </div>

      <div>
        <label htmlFor="artist" className="block text-sm font-medium text-on-surface mb-2">
          Artist
        </label>
        <input
          type="text"
          id="artist"
          value={formData.artist}
          onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
          className="w-full px-4 py-2 bg-surface text-on-surface border border-outline rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="Enter artist name"
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
          placeholder="Enter artwork description"
        />
      </div>

      <div>
        <label htmlFor="price" className="block text-sm font-medium text-on-surface mb-2">
          Price (in cents)
        </label>
        <input
          type="number"
          id="price"
          min="0"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          className="w-full px-4 py-2 bg-surface text-on-surface border border-outline rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="e.g., 10000 for $100.00"
        />
        {formData.price && (
          <p className="text-sm text-on-surface-variant mt-1">
            ${(parseInt(formData.price) / 100).toFixed(2)}
          </p>
        )}
      </div>

      {/* TODO: Reimplement collection selection for many-to-many relationship */}
      {/* <div>
        <label htmlFor="collectionId" className="block text-sm font-medium text-gray-700 mb-2">
          Collection
        </label>
        <select
          id="collectionId"
          value={formData.collectionId}
          onChange={(e) => setFormData({ ...formData, collectionId: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">No collection</option>
          {collections.map((collection) => (
            <option key={collection.id} value={collection.id}>
              {collection.name}
            </option>
          ))}
        </select>
      </div> */}

      <div className="flex items-center justify-between pt-6 border-t border-outline">
        <div>
          {artwork && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 font-medium"
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
            className="px-4 py-2 border border-outline text-on-surface rounded-md hover:bg-primary-container disabled:opacity-50 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-primary text-on-primary rounded-md hover:opacity-90 disabled:opacity-50 font-medium"
          >
            {isSubmitting ? 'Saving...' : artwork ? 'Update Artwork' : 'Create Artwork'}
          </button>
        </div>
      </div>
    </form>
  );
}
