import Link from "next/link";
import Image from "@/components/Image";
import type { PostWithRelations } from "@/models/post";

const POST_TYPE_LABELS: Record<string, string> = {
  announcement: "Announcement",
  educational: "Educational",
  behind_the_scenes: "Behind the Scenes",
  general: "General",
};

export default function PostCard({ post }: { post: PostWithRelations }) {
  const publishedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group block bg-surface rounded-lg border border-outline overflow-hidden hover:shadow-md transition-shadow"
    >
      {post.coverImageUrl && (
        <div className="aspect-video overflow-hidden">
          <Image
            src={post.coverImageUrl}
            alt={post.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block px-2 py-0.5 bg-primary-container text-on-primary-container rounded text-xs">
            {POST_TYPE_LABELS[post.postType] || post.postType}
          </span>
          {publishedDate && (
            <span className="text-xs text-on-surface-variant">
              {publishedDate}
            </span>
          )}
        </div>
        <h3 className="text-lg font-semibold text-on-surface group-hover:text-primary transition-colors mb-2">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-sm text-on-surface-variant line-clamp-3">
            {post.excerpt}
          </p>
        )}
        {post.artworks && post.artworks.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {post.artworks.slice(0, 3).map((artwork) => (
              <span
                key={artwork.id}
                className="text-xs text-on-surface-variant bg-surface-variant/30 px-2 py-0.5 rounded"
              >
                {artwork.title}
              </span>
            ))}
            {post.artworks.length > 3 && (
              <span className="text-xs text-on-surface-variant">
                +{post.artworks.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
