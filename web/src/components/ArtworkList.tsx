'use client';

import { Artwork } from '@/lib/strapi';
import { PencilIcon, TrashIcon, CalendarIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface ArtworkListProps {
  artworks: Artwork[];
  onEdit: (artwork: Artwork) => void;
  onDelete: (documentId: string) => void;
}

export default function ArtworkList({ artworks, onEdit, onDelete }: ArtworkListProps) {
  if (artworks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="h-12 w-12">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No artworks</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating your first artwork.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {artworks.map((artwork) => (
          <li key={artwork.documentId}>
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {/* Artwork Image */}
                  <div className="flex-shrink-0 h-20 w-20 relative">
                    {artwork.images && artwork.images.length > 0 ? (
                      <Image
                        className="h-20 w-20 rounded-lg object-cover"
                        src={artwork.images[0].url}
                        alt={artwork.images[0].alternativeText || artwork.title}
                        fill
                        sizes="80px"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-lg bg-gray-200 flex items-center justify-center">
                        <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Artwork Details */}
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {artwork.title}
                      </h3>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          artwork.publishedAt 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {artwork.publishedAt ? 'Published' : 'Draft'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {artwork.description && artwork.description.length > 100 
                            ? `${artwork.description.substring(0, 100)}...` 
                            : artwork.description || 'No description'}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <CalendarIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        <p>
                          {artwork.year ? `Created in ${artwork.year}` : 'Year not specified'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center text-xs text-gray-500">
                      <span>
                        Created: {new Date(artwork.createdAt).toLocaleDateString()}
                      </span>
                      <span className="mx-2">•</span>
                      <span>
                        Updated: {new Date(artwork.updatedAt).toLocaleDateString()}
                      </span>
                      {artwork.images && artwork.images.length > 0 && (
                        <>
                          <span className="mx-2">•</span>
                          <span>
                            {artwork.images.length} image{artwork.images.length !== 1 ? 's' : ''}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onEdit(artwork)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(artwork.documentId)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}