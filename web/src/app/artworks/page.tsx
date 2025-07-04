'use client';

import { useState, useEffect } from 'react';
import { artworkAPI, Artwork, CreateArtworkData } from '@/lib/strapi';
import ArtworkForm from '@/components/ArtworkForm';
import ArtworkList from '@/components/ArtworkList';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function ArtworksPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);

  // Fetch artworks on component mount
  useEffect(() => {
    fetchArtworks();
  }, []);

  const fetchArtworks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await artworkAPI.getAll({
        sort: ['createdAt:desc'],
      });
      setArtworks(response.data || []);
    } catch (err) {
      setError('Failed to fetch artworks');
      console.error('Error fetching artworks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArtwork = async (data: CreateArtworkData) => {
    try {
      const newArtwork = await artworkAPI.create(data);
      setArtworks([newArtwork.data, ...artworks]);
      setIsCreateModalOpen(false);
      return { success: true };
    } catch (err) {
      console.error('Error creating artwork:', err);
      return { success: false, error: 'Failed to create artwork' };
    }
  };

  const handleUpdateArtwork = async (documentId: string, data: CreateArtworkData) => {
    try {
      const updatedArtwork = await artworkAPI.update(documentId, data);
      setArtworks(artworks.map(artwork => 
        artwork.documentId === documentId ? updatedArtwork.data : artwork
      ));
      setEditingArtwork(null);
      return { success: true };
    } catch (err) {
      console.error('Error updating artwork:', err);
      return { success: false, error: 'Failed to update artwork' };
    }
  };

  const handleDeleteArtwork = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this artwork?')) {
      return;
    }

    try {
      await artworkAPI.delete(documentId);
      setArtworks(artworks.filter(artwork => artwork.documentId !== documentId));
    } catch (err) {
      console.error('Error deleting artwork:', err);
      alert('Failed to delete artwork');
    }
  };

  const handleEditArtwork = (artwork: Artwork) => {
    setEditingArtwork(artwork);
  };

  const handleCloseModals = () => {
    setIsCreateModalOpen(false);
    setEditingArtwork(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading artworks...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={fetchArtworks}
                    className="bg-red-100 hover:bg-red-200 text-red-800 font-medium py-2 px-4 rounded-md text-sm"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Artworks</h1>
              <p className="mt-2 text-gray-600">
                Manage your artwork collection
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Artwork
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Artworks</dt>
                  <dd className="text-lg font-medium text-gray-900">{artworks.length}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Published</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {artworks.filter(artwork => artwork.publishedAt).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Recent</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {artworks.filter(artwork => {
                      const oneWeekAgo = new Date();
                      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                      return new Date(artwork.createdAt) > oneWeekAgo;
                    }).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Artworks List */}
        <ArtworkList
          artworks={artworks}
          onEdit={handleEditArtwork}
          onDelete={handleDeleteArtwork}
        />

        {/* Create Modal */}
        {isCreateModalOpen && (
          <ArtworkForm
            onSubmit={handleCreateArtwork}
            onClose={handleCloseModals}
            title="Create New Artwork"
          />
        )}

        {/* Edit Modal */}
        {editingArtwork && (
          <ArtworkForm
            artwork={editingArtwork}
            onSubmit={(data) => handleUpdateArtwork(editingArtwork.documentId, data)}
            onClose={handleCloseModals}
            title="Edit Artwork"
          />
        )}
      </div>
    </div>
  );
}