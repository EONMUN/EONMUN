"use client";

import { useState, useRef, ChangeEvent } from "react";
import Image from "next/image";

export interface ArtworkImage {
  id: string;
  url: string;
  alternativeText?: string;
  caption?: string;
  width?: number;
  height?: number;
}

interface MultiImageUploadProps {
  images: ArtworkImage[];
  onChange: (images: ArtworkImage[]) => void;
  className?: string;
}

interface UploadResponse {
  success: boolean;
  url: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  error?: string;
}

export default function MultiImageUpload({
  images,
  onChange,
  className = "",
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateId = () =>
    `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ];

    setUploading(true);
    setError(null);

    const newImages: ArtworkImage[] = [];

    for (const file of Array.from(files)) {
      // Validate file type
      if (!validTypes.includes(file.type)) {
        setError(
          "Please select valid image files (JPEG, PNG, GIF, WebP, or SVG)",
        );
        continue;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("Each file must be less than 10MB");
        continue;
      }

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string };
          throw new Error(errorData.error || "Upload failed");
        }

        const data: UploadResponse = await response.json();

        if (data.success && data.url) {
          newImages.push({
            id: generateId(),
            url: data.url,
            alternativeText: file.name.replace(/\.[^/.]+$/, ""),
          });
        }
      } catch (err) {
        console.error("Upload error:", err);
        setError(err instanceof Error ? err.message : "Failed to upload image");
      }
    }

    if (newImages.length > 0) {
      onChange([...images, ...newImages]);
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (
      draggedIndex !== null &&
      dragOverIndex !== null &&
      draggedIndex !== dragOverIndex
    ) {
      const newImages = [...images];
      const [removed] = newImages.splice(draggedIndex, 1);
      newImages.splice(dragOverIndex, 0, removed);
      onChange(newImages);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    [newImages[index - 1], newImages[index]] = [
      newImages[index],
      newImages[index - 1],
    ];
    onChange(newImages);
  };

  const handleMoveDown = (index: number) => {
    if (index === images.length - 1) return;
    const newImages = [...images];
    [newImages[index], newImages[index + 1]] = [
      newImages[index + 1],
      newImages[index],
    ];
    onChange(newImages);
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    const [removed] = newImages.splice(index, 1);
    newImages.unshift(removed);
    onChange(newImages);
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative group border rounded-lg overflow-hidden ${
                dragOverIndex === index ? "ring-2 ring-primary" : ""
              } ${draggedIndex === index ? "opacity-50" : ""}`}
            >
              <div className="aspect-square relative">
                <Image
                  src={image.url}
                  alt={image.alternativeText || `Image ${index + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              {/* Primary badge */}
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-primary text-on-primary text-xs px-2 py-1 rounded">
                  Primary
                </div>
              )}

              {/* Order number */}
              <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>

              {/* Hover controls */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {/* Move up */}
                <button
                  type="button"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="p-1.5 bg-white/90 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Move up"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                </button>

                {/* Move down */}
                <button
                  type="button"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === images.length - 1}
                  className="p-1.5 bg-white/90 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Move down"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Set as primary */}
                {index !== 0 && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(index)}
                    className="p-1.5 bg-white/90 rounded hover:bg-white"
                    title="Set as primary"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                  </button>
                )}

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="p-1.5 bg-red-600 text-white rounded hover:bg-red-700"
                  title="Remove"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Drag handle indicator */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-white/90 px-2 py-1 rounded text-xs text-gray-600">
                  Drag to reorder
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
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
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Images
          </>
        )}
      </button>
      <p className="text-sm text-on-surface-variant mt-2">
        Supported: JPEG, PNG, GIF, WebP, SVG (Max 10MB each). First image is the
        primary image.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-3 mt-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
