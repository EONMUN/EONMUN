"use client";

import { useState, useRef, ChangeEvent } from 'react';
import type { Upload, ArtworkUpload } from '@/actions/admin/uploads';
import {
  createUploadForArtworkAdmin,
  setUploadAsDefaultAdmin,
  unlinkUploadFromArtworkAdmin,
  updateUploadAdmin,
} from '@/actions/admin/uploads';

interface ArtworkUploadsManagerProps {
  artworkId: number;
  artworkUploads?: {
    artworkUploads: (ArtworkUpload & { upload: Upload })[];
  } | null;
}

interface UploadResponse {
  success: boolean;
  url: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  error?: string;
}

export default function ArtworkUploadsManager({
  artworkId,
  artworkUploads,
}: ArtworkUploadsManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingUploadId, setEditingUploadId] = useState<number | null>(null);
  const [editAltText, setEditAltText] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploads = artworkUploads?.artworkUploads || [];

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, WebP, or SVG)');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Upload file to API
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || 'Upload failed');
      }

      const data: UploadResponse = await response.json();

      if (!data.success || !data.url) {
        throw new Error('Upload failed');
      }

      // Create upload record and link to artwork
      const result = await createUploadForArtworkAdmin(
        {
          fileName: data.fileName,
          storagePath: data.fileName,
          fileSize: data.fileSize,
          mimeType: data.fileType,
          storageType: process.env.NODE_ENV === 'production' ? 'r2' : 'local',
          storageUrl: data.url,
          isDeleted: false,
        },
        artworkId,
        uploads.length === 0 // Set as default if it's the first upload
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to save upload');
      }

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Refresh the page to show new upload
      window.location.reload();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSetDefault = async (uploadId: number) => {
    try {
      const result = await setUploadAsDefaultAdmin(uploadId, artworkId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to set default');
      }
      window.location.reload();
    } catch (err) {
      console.error('Set default error:', err);
      setError(err instanceof Error ? err.message : 'Failed to set default image');
    }
  };

  const handleUnlink = async (uploadId: number) => {
    if (!confirm('Are you sure you want to remove this image from the artwork?')) {
      return;
    }

    try {
      const result = await unlinkUploadFromArtworkAdmin(uploadId, artworkId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to unlink');
      }
      window.location.reload();
    } catch (err) {
      console.error('Unlink error:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove image');
    }
  };

  const handleEditMetadata = (upload: Upload) => {
    setEditingUploadId(upload.id);
    setEditAltText(upload.alternativeText || '');
    setEditCaption(upload.caption || '');
  };

  const handleSaveMetadata = async () => {
    if (editingUploadId === null) return;

    try {
      const result = await updateUploadAdmin(editingUploadId, {
        alternativeText: editAltText,
        caption: editCaption,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update');
      }

      setEditingUploadId(null);
      window.location.reload();
    } catch (err) {
      console.error('Update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update metadata');
    }
  };

  const handleCancelEdit = () => {
    setEditingUploadId(null);
    setEditAltText('');
    setEditCaption('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Artwork Images</h3>

        {/* Upload Button */}
        <div className="mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 border-0 px-6 py-3"
          >
            {uploading ? (
              <>
                <span className="loading loading-spinner loading-sm mr-2"></span>
                Uploading...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                Upload New Image
              </>
            )}
          </button>
          <p className="text-sm text-on-surface-variant mt-2">
            Supported: JPEG, PNG, GIF, WebP, SVG (Max 10MB)
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-3 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Uploads Grid */}
        {uploads.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
            <p>No images uploaded yet.</p>
            <p className="text-sm mt-2">Upload your first image to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {uploads.map(({ upload, isDefault }) => (
              <div
                key={upload.id}
                className={`border rounded-lg overflow-hidden ${
                  isDefault ? 'border-blue-500 border-2' : 'border-gray-300'
                }`}
              >
                {/* Image */}
                <div className="relative aspect-video bg-gray-100">
                  <img
                    src={upload.storageUrl}
                    alt={upload.alternativeText || upload.fileName}
                    className="w-full h-full object-cover"
                  />
                  {isDefault && (
                    <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                      DEFAULT
                    </div>
                  )}
                </div>

                {/* Info & Actions */}
                <div className="p-4 space-y-3">
                  {editingUploadId === upload.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editAltText}
                        onChange={(e) => setEditAltText(e.target.value)}
                        placeholder="Alt text"
                        className="w-full px-3 py-2 border rounded"
                      />
                      <input
                        type="text"
                        value={editCaption}
                        onChange={(e) => setEditCaption(e.target.value)}
                        placeholder="Caption"
                        className="w-full px-3 py-2 border rounded"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleSaveMetadata}
                          className="btn btn-sm bg-green-600 text-white hover:bg-green-700 border-0"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="btn btn-sm bg-gray-500 text-white hover:bg-gray-600 border-0"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium truncate">{upload.fileName}</p>
                      {upload.alternativeText && (
                        <p className="text-xs text-gray-600 mt-1">{upload.alternativeText}</p>
                      )}
                      {upload.caption && (
                        <p className="text-xs text-gray-500 mt-1 italic">{upload.caption}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {(upload.fileSize / 1024).toFixed(0)} KB
                        {upload.width && upload.height && ` • ${upload.width}×${upload.height}`}
                      </p>
                    </div>
                  )}

                  {editingUploadId !== upload.id && (
                    <div className="flex flex-wrap gap-2">
                      {!isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(upload.id)}
                          className="btn btn-sm bg-blue-600 text-white hover:bg-blue-700 border-0"
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleEditMetadata(upload)}
                        className="btn btn-sm bg-gray-600 text-white hover:bg-gray-700 border-0"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUnlink(upload.id)}
                        className="btn btn-sm bg-red-600 text-white hover:bg-red-700 border-0"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
