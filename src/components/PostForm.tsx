"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/ImageUpload";
import {
  createPostAdmin,
  updatePostAdmin,
  deletePostAdmin,
  type PostWithRelations,
} from "@/actions/admin/post";
import {
  searchArtworksAdmin,
  searchCollectionsAdmin,
} from "@/actions/admin/collection";
import { generateSlug } from "@/lib/utils";
import type { PostType } from "@/database/schema.posts";

const POST_TYPES: { value: PostType; label: string }[] = [
  { value: "announcement", label: "Announcement" },
  { value: "educational", label: "Educational" },
  { value: "behind_the_scenes", label: "Behind the Scenes" },
  { value: "general", label: "General" },
];

function getLocalISOString(date: Date) {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().slice(0, 16);
}

interface PostFormProps {
  post?: PostWithRelations;
}

export default function PostForm({ post }: PostFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    title: post?.title || "",
    slug: post?.slug || "",
    body: post?.body || "",
    excerpt: post?.excerpt || "",
    postType: (post?.postType as PostType) || "general",
    coverImageUrl: post?.coverImageUrl || "",
    publishStatus: post?.publishedAt
      ? "published"
      : post?.scheduledAt
        ? "scheduled"
        : "draft",
    publishedAt: post?.publishedAt
      ? getLocalISOString(post.publishedAt)
      : getLocalISOString(new Date()),
    scheduledAt: post?.scheduledAt
      ? new Date(post.scheduledAt).toISOString().slice(0, 16)
      : "",
    socialMetaX: post?.socialMetaX || "",
    socialMetaInstagram: post?.socialMetaInstagram || "",
    socialMetaThreads: post?.socialMetaThreads || "",
  });

  // Artwork and collection selections
  const [selectedArtworkIds, setSelectedArtworkIds] = useState<number[]>(
    post?.artworks?.map((a) => a.id) || [],
  );
  const [selectedArtworks, setSelectedArtworks] = useState<
    { id: number; title: string; slug: string }[]
  >(
    post?.artworks?.map((a) => ({ id: a.id, title: a.title, slug: a.slug })) ||
      [],
  );

  const [selectedCollectionIds, setSelectedCollectionIds] = useState<number[]>(
    post?.collections?.map((c) => c.id) || [],
  );
  const [selectedCollections, setSelectedCollections] = useState<
    { id: number; name: string; slug: string }[]
  >(
    post?.collections?.map((c) => ({ id: c.id, name: c.name, slug: c.slug })) ||
      [],
  );

  // Search state for artwork selector
  const [artworkSearch, setArtworkSearch] = useState("");
  const [artworkResults, setArtworkResults] = useState<
    { id: number; title: string; slug: string }[]
  >([]);
  const [showArtworkDropdown, setShowArtworkDropdown] = useState(false);
  const artworkDropdownRef = useRef<HTMLDivElement>(null);

  // Search state for collection selector
  const [collectionSearch, setCollectionSearch] = useState("");
  const [collectionResults, setCollectionResults] = useState<
    { id: number; name: string; slug: string }[]
  >([]);
  const [showCollectionDropdown, setShowCollectionDropdown] = useState(false);
  const collectionDropdownRef = useRef<HTMLDivElement>(null);

  // Auto-generate slug from title
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!post);
  useEffect(() => {
    if (!slugManuallyEdited && formData.title) {
      setFormData((prev) => ({ ...prev, slug: generateSlug(prev.title) }));
    }
  }, [formData.title, slugManuallyEdited]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        artworkDropdownRef.current &&
        !artworkDropdownRef.current.contains(event.target as Node)
      ) {
        setShowArtworkDropdown(false);
      }
      if (
        collectionDropdownRef.current &&
        !collectionDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCollectionDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Artwork search
  const handleArtworkSearch = useCallback(
    async (query: string) => {
      setArtworkSearch(query);
      setShowArtworkDropdown(true);
      try {
        const result = await searchArtworksAdmin(query);
        const filtered = result.data.filter(
          (a: { id: number }) => !selectedArtworkIds.includes(a.id),
        );
        setArtworkResults(
          filtered.map((a: { id: number; title: string; slug: string }) => ({
            id: a.id,
            title: a.title,
            slug: a.slug,
          })),
        );
      } catch {
        setArtworkResults([]);
      }
    },
    [selectedArtworkIds],
  );

  // Collection search
  const handleCollectionSearch = useCallback(
    async (query: string) => {
      setCollectionSearch(query);
      setShowCollectionDropdown(true);
      try {
        const result = await searchCollectionsAdmin(query);
        const filtered = result.data.filter(
          (c: { id: number }) => !selectedCollectionIds.includes(c.id),
        );
        setCollectionResults(
          filtered.map((c: { id: number; name: string; slug: string }) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
          })),
        );
      } catch {
        setCollectionResults([]);
      }
    },
    [selectedCollectionIds],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const submitData: Record<string, unknown> = {
        title: formData.title,
        slug: formData.slug,
        body: formData.body,
        excerpt: formData.excerpt || null,
        postType: formData.postType,
        coverImageUrl: formData.coverImageUrl || null,
        publishedAt: formData.publishStatus === "published" 
          ? (formData.publishedAt ? new Date(formData.publishedAt) : new Date()) 
          : null,
        scheduledAt:
          formData.publishStatus === "scheduled" && formData.scheduledAt
            ? new Date(formData.scheduledAt)
            : null,
        socialMetaX: formData.socialMetaX || null,
        socialMetaInstagram: formData.socialMetaInstagram || null,
        socialMetaThreads: formData.socialMetaThreads || null,
        artworkIds: selectedArtworkIds,
        collectionIds: selectedCollectionIds,
      };

      let result;
      if (post) {
        result = await updatePostAdmin(post.id, submitData);
      } else {
        result = await createPostAdmin(
          submitData as Parameters<typeof createPostAdmin>[0],
        );
      }

      if ("success" in result && result.success) {
        router.push("/admin/posts");
      } else if ("error" in result) {
        setError(result.error as string);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!post) return;
    if (!confirm("Are you sure you want to delete this post?")) return;

    setIsSubmitting(true);
    try {
      const result = await deletePostAdmin(post.id);
      if (result.success) {
        router.push("/admin/posts");
      } else if ("error" in result) {
        setError(result.error || "Failed to delete post");
      }
    } catch {
      setError("Failed to delete post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-on-surface mb-1"
        >
          Title *
        </label>
        <input
          id="title"
          type="text"
          required
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          className="w-full px-3 py-2 border border-outline rounded-md bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Slug */}
      <div>
        <label
          htmlFor="slug"
          className="block text-sm font-medium text-on-surface mb-1"
        >
          Slug
        </label>
        <input
          id="slug"
          type="text"
          value={formData.slug}
          onChange={(e) => {
            setSlugManuallyEdited(true);
            setFormData((prev) => ({ ...prev, slug: e.target.value }));
          }}
          className="w-full px-3 py-2 border border-outline rounded-md bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="mt-1 text-xs text-on-surface-variant">
          Auto-generated from title. Edit to customize.
        </p>
      </div>

      {/* Post Type */}
      <div>
        <label
          htmlFor="postType"
          className="block text-sm font-medium text-on-surface mb-1"
        >
          Post Type
        </label>
        <select
          id="postType"
          value={formData.postType}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              postType: e.target.value as PostType,
            }))
          }
          className="w-full px-3 py-2 border border-outline rounded-md bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {POST_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Excerpt */}
      <div>
        <label
          htmlFor="excerpt"
          className="block text-sm font-medium text-on-surface mb-1"
        >
          Excerpt
        </label>
        <textarea
          id="excerpt"
          rows={2}
          value={formData.excerpt}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, excerpt: e.target.value }))
          }
          className="w-full px-3 py-2 border border-outline rounded-md bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Short summary for listings and social sharing"
        />
      </div>

      {/* Body (Markdown) */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label
            htmlFor="body"
            className="block text-sm font-medium text-on-surface"
          >
            Body (Markdown)
          </label>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-xs text-primary hover:text-primary/80"
          >
            {showPreview ? "Edit" : "Preview"}
          </button>
        </div>
        {showPreview ? (
          <div className="w-full min-h-[300px] px-3 py-2 border border-outline rounded-md bg-surface text-on-surface prose prose-sm max-w-none">
            <div
              dangerouslySetInnerHTML={{
                __html:
                  formData.body
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/\n/g, "<br />"),
              }}
            />
            <p className="text-xs text-on-surface-variant mt-4 italic">
              Note: Full Markdown rendering available on the published page.
            </p>
          </div>
        ) : (
          <textarea
            id="body"
            rows={15}
            value={formData.body}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, body: e.target.value }))
            }
            className="w-full px-3 py-2 border border-outline rounded-md bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            placeholder="Write your post content in Markdown..."
          />
        )}
      </div>

      {/* Cover Image */}
      <div>
        <label className="block text-sm font-medium text-on-surface mb-1">
          Cover Image
        </label>
        <ImageUpload
          onUploadComplete={(url) =>
            setFormData((prev) => ({ ...prev, coverImageUrl: url }))
          }
          currentImageUrl={formData.coverImageUrl || undefined}
          compact
        />
        {formData.coverImageUrl && (
          <button
            type="button"
            onClick={() =>
              setFormData((prev) => ({ ...prev, coverImageUrl: "" }))
            }
            className="mt-2 text-xs text-red-600 hover:text-red-800"
          >
            Remove cover image
          </button>
        )}
      </div>

      {/* Publish Status */}
      <div>
        <label className="block text-sm font-medium text-on-surface mb-2">
          Publish Status
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="publishStatus"
              value="draft"
              checked={formData.publishStatus === "draft"}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  publishStatus: e.target.value,
                }))
              }
              className="text-primary"
            />
            <span className="text-sm text-on-surface">Draft</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="publishStatus"
              value="published"
              checked={formData.publishStatus === "published"}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  publishStatus: e.target.value,
                }))
              }
              className="text-primary"
            />
            <span className="text-sm text-on-surface">Published</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="publishStatus"
              value="scheduled"
              checked={formData.publishStatus === "scheduled"}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  publishStatus: e.target.value,
                }))
              }
              className="text-primary"
            />
            <span className="text-sm text-on-surface">Scheduled</span>
          </label>
        </div>
        {formData.publishStatus === "published" && (
          <div className="mt-2 ml-6">
            <label className="block text-xs text-on-surface-variant mb-1">Published Date</label>
            <input
              type="datetime-local"
              value={formData.publishedAt}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  publishedAt: e.target.value,
                }))
              }
              className="px-3 py-2 border border-outline rounded-md bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}
        {formData.publishStatus === "scheduled" && (
          <div className="mt-2 ml-6">
            <label className="block text-xs text-on-surface-variant mb-1">Scheduled Date</label>
            <input
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  scheduledAt: e.target.value,
                }))
              }
              className="px-3 py-2 border border-outline rounded-md bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}
      </div>

      {/* Artwork Selector */}
      <div>
        <label className="block text-sm font-medium text-on-surface mb-1">
          Linked Artworks
        </label>
        <div ref={artworkDropdownRef} className="relative">
          <input
            type="text"
            value={artworkSearch}
            onChange={(e) => handleArtworkSearch(e.target.value)}
            onFocus={() => handleArtworkSearch(artworkSearch)}
            placeholder="Search artworks..."
            className="w-full px-3 py-2 border border-outline rounded-md bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {showArtworkDropdown && artworkResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-surface border border-outline rounded-md shadow-lg max-h-48 overflow-y-auto">
              {artworkResults.map((artwork) => (
                <button
                  key={artwork.id}
                  type="button"
                  onClick={() => {
                    setSelectedArtworkIds((prev) => [...prev, artwork.id]);
                    setSelectedArtworks((prev) => [...prev, artwork]);
                    setArtworkSearch("");
                    setShowArtworkDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-primary-container/50 text-on-surface"
                >
                  {artwork.title}
                </button>
              ))}
            </div>
          )}
        </div>
        {selectedArtworks.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedArtworks.map((artwork) => (
              <span
                key={artwork.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary-container text-on-primary-container rounded text-xs"
              >
                {artwork.title}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedArtworkIds((prev) =>
                      prev.filter((id) => id !== artwork.id),
                    );
                    setSelectedArtworks((prev) =>
                      prev.filter((a) => a.id !== artwork.id),
                    );
                  }}
                  className="ml-1 hover:text-red-600"
                >
                  x
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Collection Selector */}
      <div>
        <label className="block text-sm font-medium text-on-surface mb-1">
          Linked Collections
        </label>
        <div ref={collectionDropdownRef} className="relative">
          <input
            type="text"
            value={collectionSearch}
            onChange={(e) => handleCollectionSearch(e.target.value)}
            onFocus={() => handleCollectionSearch(collectionSearch)}
            placeholder="Search collections..."
            className="w-full px-3 py-2 border border-outline rounded-md bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {showCollectionDropdown && collectionResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-surface border border-outline rounded-md shadow-lg max-h-48 overflow-y-auto">
              {collectionResults.map((collection) => (
                <button
                  key={collection.id}
                  type="button"
                  onClick={() => {
                    setSelectedCollectionIds((prev) => [
                      ...prev,
                      collection.id,
                    ]);
                    setSelectedCollections((prev) => [...prev, collection]);
                    setCollectionSearch("");
                    setShowCollectionDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-primary-container/50 text-on-surface"
                >
                  {collection.name}
                </button>
              ))}
            </div>
          )}
        </div>
        {selectedCollections.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedCollections.map((collection) => (
              <span
                key={collection.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary-container text-on-primary-container rounded text-xs"
              >
                {collection.name}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCollectionIds((prev) =>
                      prev.filter((id) => id !== collection.id),
                    );
                    setSelectedCollections((prev) =>
                      prev.filter((c) => c.id !== collection.id),
                    );
                  }}
                  className="ml-1 hover:text-red-600"
                >
                  x
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Social Media Metadata Section */}
      <div className="pt-6 border-t border-outline">
        <h3 className="text-lg font-semibold text-on-surface mb-4">
          Social Media Guidelines
        </h3>
        <p className="text-sm text-on-surface-variant mb-4">
          Provide guidelines and metadata for sharing this post on social media platforms.
        </p>

        {/* X (Twitter) / Threads */}
        <div className="mb-4">
          <label
            htmlFor="socialMetaX"
            className="block text-sm font-medium text-on-surface mb-1"
          >
            X (Twitter)
          </label>
          <textarea
            id="socialMetaX"
            rows={4}
            value={formData.socialMetaX}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, socialMetaX: e.target.value }))
            }
            className="w-full px-3 py-2 border border-outline rounded-md bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            placeholder="Guidelines for X (Twitter) posts. Note: Consider creating tweet threads rather than linking back (avoids penalties). Include suggested thread structure, key points, and hashtags."
          />
          <p className="mt-1 text-xs text-on-surface-variant">
            For X: Create tweet threads instead of linking directly to avoid penalties. Include thread structure and key talking points.
          </p>
        </div>

        {/* Instagram */}
        <div className="mb-4">
          <label
            htmlFor="socialMetaInstagram"
            className="block text-sm font-medium text-on-surface mb-1"
          >
            Instagram
          </label>
          <textarea
            id="socialMetaInstagram"
            rows={4}
            value={formData.socialMetaInstagram}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                socialMetaInstagram: e.target.value,
              }))
            }
            className="w-full px-3 py-2 border border-outline rounded-md bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            placeholder="Guidelines for Instagram posts. Include caption suggestions, hashtags, image requirements, and story ideas."
          />
          <p className="mt-1 text-xs text-on-surface-variant">
            Include caption, hashtags, visual requirements, and any story/reel suggestions.
          </p>
        </div>

        {/* Threads */}
        <div className="mb-4">
          <label
            htmlFor="socialMetaThreads"
            className="block text-sm font-medium text-on-surface mb-1"
          >
            Threads
          </label>
          <textarea
            id="socialMetaThreads"
            rows={4}
            value={formData.socialMetaThreads}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                socialMetaThreads: e.target.value,
              }))
            }
            className="w-full px-3 py-2 border border-outline rounded-md bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            placeholder="Guidelines for Threads posts. Include post structure, tone, and any specific linking strategy."
          />
          <p className="mt-1 text-xs text-on-surface-variant">
            Provide post structure, tone guidelines, and engagement strategies for Threads.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-outline">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-primary text-on-primary rounded-md hover:opacity-90 font-medium disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : post ? "Update Post" : "Create Post"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/posts")}
          className="px-6 py-2 border border-outline text-on-surface rounded-md hover:bg-surface"
        >
          Cancel
        </button>
        {post && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isSubmitting}
            className="ml-auto px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}