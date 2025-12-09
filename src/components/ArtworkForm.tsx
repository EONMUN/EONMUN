"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/ImageUpload";
import FacetSelector from "@/components/FacetSelector";
import CollectionSelector, {
  type SelectedCollection,
} from "@/components/CollectionSelector";
import {
  createArtworkAdmin,
  updateArtworkAdmin,
  deleteArtworkAdmin,
  type Artwork,
} from "@/actions/admin/artwork";
import {
  getFacetsForArtworkAdmin,
  setFacetsForArtworkAdmin,
} from "@/actions/admin/facet";
import {
  getCollectionsForArtworkAdmin,
  setCollectionsForArtworkAdmin,
} from "@/actions/admin/collection";
import type { Facet } from "@/models/facets";
import { generateSlug } from "@/lib/utils";

const DIMENSION_UNITS = ["in", "cm", "mm"] as const;

interface ArtworkFormProps {
  artwork?: Artwork;
  /** Initial price from product (passed from server to avoid client-side fetch) */
  initialPrice?: number;
}

export default function ArtworkForm({
  artwork,
  initialPrice,
}: ArtworkFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!!artwork);

  // Form data for direct fields
  // Note: price is passed as initialPrice prop from the server (in cents), converted to dollars for display
  const [formData, setFormData] = useState({
    title: artwork?.title || "",
    description: artwork?.description || "",
    artist: artwork?.artist || "",
    year: artwork?.year?.toString() || "",
    width: artwork?.width?.toString() || "",
    height: artwork?.height?.toString() || "",
    depth: artwork?.depth?.toString() || "",
    dimensionUnit: artwork?.dimensionUnit || "in",
    price: initialPrice ? (initialPrice / 100).toString() : "",
    defaultImageUrl: artwork?.defaultImageUrl || "",
  });

  // Many-to-many relationship data
  const [selectedMaterials, setSelectedMaterials] = useState<Facet[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<
    SelectedCollection[]
  >([]);

  // Load existing materials and collections when editing
  useEffect(() => {
    if (!artwork) {
      setIsLoading(false);
      return;
    }

    const loadRelationships = async () => {
      try {
        // Load materials
        const materialsResult = await getFacetsForArtworkAdmin(
          artwork.id,
          "material",
        );
        if (materialsResult.data) {
          setSelectedMaterials(materialsResult.data);
        }

        // Load collections
        const collectionsResult = await getCollectionsForArtworkAdmin(
          artwork.id,
        );
        if (collectionsResult.data) {
          setSelectedCollections(
            collectionsResult.data.map((c) => ({
              collection: c,
              isDefault: c.isDefaultForCollection,
            })),
          );
        }
      } catch (err) {
        console.error("Error loading relationships:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadRelationships();
  }, [artwork]);

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
        year: formData.year ? parseInt(formData.year) : undefined,
        width: formData.width ? parseFloat(formData.width) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        depth: formData.depth ? parseFloat(formData.depth) : undefined,
        dimensionUnit: formData.dimensionUnit || undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        defaultImageUrl: formData.defaultImageUrl || undefined,
      };

      let result;
      let artworkId: number | undefined;

      if (artwork) {
        result = await updateArtworkAdmin(artwork.id, data);
        artworkId = artwork.id;
      } else {
        result = await createArtworkAdmin(data);
        artworkId = result.data?.id;
      }

      if (result.success && artworkId !== undefined) {
        // Save materials
        await setFacetsForArtworkAdmin(
          artworkId,
          selectedMaterials.map((m) => m.id),
          "material",
        );

        // Save collections
        await setCollectionsForArtworkAdmin(
          artworkId,
          selectedCollections.map((sc) => ({
            collectionId: sc.collection.id,
            isDefault: sc.isDefault,
          })),
        );

        router.push("/admin/artworks");
        router.refresh();
      } else {
        setError(result.error || "An error occurred");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!artwork) return;

    if (
      !confirm(
        "Are you sure you want to delete this artwork? This action cannot be undone.",
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await deleteArtworkAdmin(artwork.id);
      if (result.success) {
        router.push("/admin/artworks");
        router.refresh();
      } else {
        setError(result.error || "Failed to delete artwork");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format dimensions for display
  const dimensionPreview = (() => {
    const parts = [];
    if (formData.width) parts.push(formData.width);
    if (formData.height) parts.push(formData.height);
    if (formData.depth) parts.push(formData.depth);
    if (parts.length === 0) return null;
    return `${parts.join(" x ")} ${formData.dimensionUnit}`;
  })();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-on-surface-variant">Loading...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-on-surface mb-2">
          Artwork Image
        </label>
        <ImageUpload
          currentImageUrl={formData.defaultImageUrl}
          onUploadComplete={(url) =>
            setFormData({ ...formData, defaultImageUrl: url })
          }
        />
      </div>

      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-on-surface mb-2"
        >
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

      {/* Artist */}
      <div>
        <label
          htmlFor="artist"
          className="block text-sm font-medium text-on-surface mb-2"
        >
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

      {/* Physical Details Section */}
      <div className="bg-surface-variant/30 border border-outline/50 rounded-lg p-4 space-y-4">
        <p className="text-sm font-medium text-on-surface">Physical Details</p>

        {/* Year */}
        <div>
          <label
            htmlFor="year"
            className="block text-sm font-medium text-on-surface mb-2"
          >
            Year Completed
          </label>
          <input
            type="number"
            id="year"
            min="1400"
            max={new Date().getFullYear() + 1}
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
            className="w-full sm:w-32 px-4 py-2 bg-surface text-on-surface border border-outline rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="e.g., 2024"
          />
        </div>

        {/* Dimensions */}
        <div>
          <label className="block text-sm font-medium text-on-surface mb-2">
            Dimensions
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.width}
              onChange={(e) =>
                setFormData({ ...formData, width: e.target.value })
              }
              className="w-20 px-3 py-2 bg-surface text-on-surface border border-outline rounded-md focus:ring-2 focus:ring-primary focus:border-primary text-center"
              placeholder="W"
              aria-label="Width"
            />
            <span className="text-on-surface-variant">x</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.height}
              onChange={(e) =>
                setFormData({ ...formData, height: e.target.value })
              }
              className="w-20 px-3 py-2 bg-surface text-on-surface border border-outline rounded-md focus:ring-2 focus:ring-primary focus:border-primary text-center"
              placeholder="H"
              aria-label="Height"
            />
            <span className="text-on-surface-variant">x</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.depth}
              onChange={(e) =>
                setFormData({ ...formData, depth: e.target.value })
              }
              className="w-20 px-3 py-2 bg-surface text-on-surface border border-outline rounded-md focus:ring-2 focus:ring-primary focus:border-primary text-center"
              placeholder="D"
              aria-label="Depth"
            />
            <select
              value={formData.dimensionUnit}
              onChange={(e) =>
                setFormData({ ...formData, dimensionUnit: e.target.value })
              }
              className="px-3 py-2 bg-surface text-on-surface border border-outline rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
              aria-label="Unit"
            >
              {DIMENSION_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
          {dimensionPreview && (
            <p className="text-sm text-on-surface-variant mt-1">
              {dimensionPreview}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-on-surface mb-2"
        >
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="w-full px-4 py-2 bg-surface text-on-surface border border-outline rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="Enter artwork description"
        />
      </div>

      {/* Materials */}
      <FacetSelector
        type="material"
        label="Materials"
        selectedFacets={selectedMaterials}
        onChange={setSelectedMaterials}
        placeholder="Search or add materials..."
      />

      {/* Collections */}
      <CollectionSelector
        selectedCollections={selectedCollections}
        onChange={setSelectedCollections}
      />

      {/* Price */}
      <div>
        <label
          htmlFor="price"
          className="block text-sm font-medium text-on-surface mb-2"
        >
          Price
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            $
          </span>
          <input
            type="number"
            id="price"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: e.target.value })
            }
            className="w-full pl-7 pr-4 py-2 bg-surface text-on-surface border border-outline rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="100.00"
          />
        </div>
      </div>

      {/* Form Actions */}
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
            {isSubmitting
              ? "Saving..."
              : artwork
                ? "Update Artwork"
                : "Create Artwork"}
          </button>
        </div>
      </div>
    </form>
  );
}
