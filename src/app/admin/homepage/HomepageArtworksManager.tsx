"use client";

import { useState } from "react";
import Image from "@/components/Image";
import type { ArtworkWithCollections, SelectArtwork } from "@/models/artwork";
import { updateHomepageArtworks } from "@/actions/admin/homepage";

interface Props {
  currentArtworks: ArtworkWithCollections[];
  allArtworks: SelectArtwork[];
}

export default function HomepageArtworksManager({
  currentArtworks,
  allArtworks,
}: Props) {
  const [selectedArtworks, setSelectedArtworks] =
    useState<ArtworkWithCollections[]>(currentArtworks);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleAddArtwork = (artworkId: number) => {
    const artwork = allArtworks.find((a) => a.id === artworkId);
    if (!artwork) return;

    // Check if already added
    if (selectedArtworks.some((a) => a.id === artworkId)) {
      setMessage({
        type: "error",
        text: "This artwork is already on the homepage",
      });
      return;
    }

    // Add artwork with minimal data
    setSelectedArtworks([
      ...selectedArtworks,
      {
        ...artwork,
        collections: [],
        images: [],
      },
    ]);
    setMessage(null);
  };

  const handleRemoveArtwork = (artworkId: number) => {
    setSelectedArtworks(selectedArtworks.filter((a) => a.id !== artworkId));
    setMessage(null);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newList = [...selectedArtworks];
    [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
    setSelectedArtworks(newList);
  };

  const handleMoveDown = (index: number) => {
    if (index === selectedArtworks.length - 1) return;
    const newList = [...selectedArtworks];
    [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
    setSelectedArtworks(newList);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const artworkIds = selectedArtworks.map((a) => a.id);
      const result = await updateHomepageArtworks(artworkIds);

      if ("error" in result && result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({
          type: "success",
          text: "Homepage artworks updated successfully",
        });
      }
    } catch (err) {
      console.error("Error updating homepage artworks:", err);
      setMessage({
        type: "error",
        text: "Failed to update homepage artworks",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-md ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Add Artwork Section */}
      <div className="bg-surface rounded-lg shadow-md p-6 border border-outline">
        <h2 className="text-xl font-semibold text-on-background mb-4">
          Add Artwork
        </h2>
        <select
          className="w-full px-4 py-2 border border-outline rounded-md bg-background text-on-background"
          onChange={(e) => {
            if (e.target.value) {
              handleAddArtwork(parseInt(e.target.value));
              e.target.value = "";
            }
          }}
          defaultValue=""
        >
          <option value="">Select an artwork to add...</option>
          {allArtworks.map((artwork) => (
            <option key={artwork.id} value={artwork.id}>
              {artwork.title} {artwork.year ? `(${artwork.year})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Selected Artworks Section */}
      <div className="bg-surface rounded-lg shadow-md p-6 border border-outline">
        <h2 className="text-xl font-semibold text-on-background mb-4">
          Homepage Artworks ({selectedArtworks.length})
        </h2>

        {selectedArtworks.length === 0 ? (
          <p className="text-on-surface-variant">
            No artworks selected. Add artworks from the dropdown above.
          </p>
        ) : (
          <div className="space-y-3">
            {selectedArtworks.map((artwork, index) => (
              <div
                key={artwork.id}
                className="flex items-center gap-4 p-4 bg-background rounded-md border border-outline"
              >
                {/* Position */}
                <div className="flex-shrink-0 w-8 text-center font-semibold text-on-surface-variant">
                  {index + 1}
                </div>

                {/* Thumbnail */}
                <div className="flex-shrink-0 w-16 h-16 relative bg-surface-variant rounded overflow-hidden">
                  {artwork.defaultImageUrl && (
                    <Image
                      src={artwork.defaultImageUrl}
                      alt={artwork.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Artwork Info */}
                <div className="flex-grow">
                  <h3 className="font-semibold text-on-background">
                    {artwork.title}
                  </h3>
                  <p className="text-sm text-on-surface-variant">
                    {artwork.year && `${artwork.year}`}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="p-2 rounded hover:bg-surface-variant disabled:opacity-30 disabled:cursor-not-allowed"
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
                        strokeWidth={2}
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === selectedArtworks.length - 1}
                    className="p-2 rounded hover:bg-surface-variant disabled:opacity-30 disabled:cursor-not-allowed"
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
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveArtwork(artwork.id)}
                    className="p-2 rounded hover:bg-red-50 text-red-600"
                    title="Remove"
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
                        strokeWidth={2}
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

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-primary text-on-primary rounded-md hover:opacity-90 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
