"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  updateHomePageOrderAdmin,
  addArtworkToHomePageAdmin,
  removeArtworkFromHomePageAdmin,
  type HomePageArtwork,
} from "@/actions/admin/home";

interface HomePageOrderManagerProps {
  initialHomeArtworks: HomePageArtwork[];
  availableArtworks: HomePageArtwork[];
}

export default function HomePageOrderManager({
  initialHomeArtworks,
  availableArtworks,
}: HomePageOrderManagerProps) {
  const router = useRouter();
  const [homeArtworks, setHomeArtworks] =
    useState<HomePageArtwork[]>(initialHomeArtworks);
  const [available, setAvailable] =
    useState<HomePageArtwork[]>(availableArtworks);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

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
      const newArtworks = [...homeArtworks];
      const [removed] = newArtworks.splice(draggedIndex, 1);
      newArtworks.splice(dragOverIndex, 0, removed);
      setHomeArtworks(newArtworks);
      setHasChanges(true);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newArtworks = [...homeArtworks];
    [newArtworks[index - 1], newArtworks[index]] = [
      newArtworks[index],
      newArtworks[index - 1],
    ];
    setHomeArtworks(newArtworks);
    setHasChanges(true);
  };

  const handleMoveDown = (index: number) => {
    if (index === homeArtworks.length - 1) return;
    const newArtworks = [...homeArtworks];
    [newArtworks[index], newArtworks[index + 1]] = [
      newArtworks[index + 1],
      newArtworks[index],
    ];
    setHomeArtworks(newArtworks);
    setHasChanges(true);
  };

  const handleRemove = async (artwork: HomePageArtwork) => {
    setIsSaving(true);
    const result = await removeArtworkFromHomePageAdmin(artwork.id);
    if (result.success) {
      setHomeArtworks(homeArtworks.filter((a) => a.id !== artwork.id));
      setAvailable([...available, artwork]);
    }
    setIsSaving(false);
    router.refresh();
  };

  const handleAdd = async (artwork: HomePageArtwork) => {
    setIsSaving(true);
    const result = await addArtworkToHomePageAdmin(artwork.id);
    if (result.success) {
      setAvailable(available.filter((a) => a.id !== artwork.id));
      setHomeArtworks([...homeArtworks, artwork]);
    }
    setIsSaving(false);
    router.refresh();
  };

  const handleSaveOrder = async () => {
    setIsSaving(true);
    const artworkIds = homeArtworks.map((a) => a.id);
    const result = await updateHomePageOrderAdmin(artworkIds);
    if (result.success) {
      setHasChanges(false);
    }
    setIsSaving(false);
    router.refresh();
  };

  return (
    <div className="space-y-8">
      {/* Current Home Page Artworks */}
      <div className="bg-surface border border-outline rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-on-surface">
            Home Page Carousel ({homeArtworks.length} artwork
            {homeArtworks.length !== 1 ? "s" : ""})
          </h2>
          {hasChanges && (
            <button
              onClick={handleSaveOrder}
              disabled={isSaving}
              className="px-4 py-2 bg-primary text-on-primary rounded-md hover:opacity-90 disabled:opacity-50 font-medium"
            >
              {isSaving ? "Saving..." : "Save Order"}
            </button>
          )}
        </div>

        {homeArtworks.length === 0 ? (
          <p className="text-on-surface-variant py-8 text-center">
            No artworks on the home page. Add artworks from below.
          </p>
        ) : (
          <div className="space-y-2">
            {homeArtworks.map((artwork, index) => (
              <div
                key={artwork.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-4 p-3 bg-surface-variant/30 border border-outline/50 rounded-lg cursor-move ${
                  dragOverIndex === index ? "ring-2 ring-primary" : ""
                } ${draggedIndex === index ? "opacity-50" : ""}`}
              >
                {/* Order number */}
                <div className="w-8 h-8 flex items-center justify-center bg-primary text-on-primary rounded-full font-bold text-sm">
                  {index + 1}
                </div>

                {/* Thumbnail */}
                <div className="w-16 h-16 relative rounded overflow-hidden flex-shrink-0">
                  {artwork.defaultImageUrl ? (
                    <Image
                      src={artwork.defaultImageUrl}
                      alt={artwork.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-variant flex items-center justify-center text-on-surface-variant text-xs">
                      No image
                    </div>
                  )}
                </div>

                {/* Title and link */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/admin/artworks/${artwork.slug}`}
                    className="text-on-surface font-medium hover:text-primary truncate block"
                  >
                    {artwork.title}
                  </Link>
                  <Link
                    href={`/artworks/${artwork.slug}`}
                    className="text-sm text-on-surface-variant hover:text-primary"
                    target="_blank"
                  >
                    View on site →
                  </Link>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0 || isSaving}
                    className="p-2 hover:bg-surface-variant rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    <svg
                      className="w-5 h-5"
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
                  <button
                    type="button"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === homeArtworks.length - 1 || isSaving}
                    className="p-2 hover:bg-surface-variant rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    <svg
                      className="w-5 h-5"
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
                  <button
                    type="button"
                    onClick={() => handleRemove(artwork)}
                    disabled={isSaving}
                    className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                    title="Remove from home page"
                  >
                    <svg
                      className="w-5 h-5"
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Artworks */}
      <div className="bg-surface border border-outline rounded-lg p-6">
        <h2 className="text-lg font-semibold text-on-surface mb-4">
          Available Artworks ({available.length})
        </h2>

        {available.length === 0 ? (
          <p className="text-on-surface-variant py-8 text-center">
            All published artworks are already on the home page.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {available.map((artwork) => (
              <div
                key={artwork.id}
                className="bg-surface-variant/30 border border-outline/50 rounded-lg overflow-hidden group"
              >
                <div className="aspect-square relative">
                  {artwork.defaultImageUrl ? (
                    <Image
                      src={artwork.defaultImageUrl}
                      alt={artwork.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-variant flex items-center justify-center text-on-surface-variant text-xs">
                      No image
                    </div>
                  )}
                  <button
                    onClick={() => handleAdd(artwork)}
                    disabled={isSaving}
                    className="absolute inset-0 bg-primary/80 text-on-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-medium disabled:opacity-50"
                  >
                    + Add to Home
                  </button>
                </div>
                <div className="p-2">
                  <p className="text-sm text-on-surface font-medium truncate">
                    {artwork.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
