import Link from "next/link";
import { getAllPublishedPosts } from "@/actions/post";
import PostCard from "@/components/PostCard";
import type { PostType } from "@/database/schema.posts";

// Admin post mutations call revalidatePath('/posts'); searchParams (?type=) auto-opt dynamic at request time.
export const revalidate = 300;

const POST_TYPE_LABELS: Record<string, string> = {
  announcement: "Announcements",
  educational: "Educational",
  behind_the_scenes: "Behind the Scenes",
  general: "General",
};

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const validTypes = [
    "announcement",
    "educational",
    "behind_the_scenes",
    "general",
  ];
  const postType =
    type && validTypes.includes(type) ? (type as PostType) : undefined;

  const { data: posts } = await getAllPublishedPosts(postType);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-on-background mb-2">Posts</h1>
        <p className="text-on-surface-variant">
          News, insights, and stories from the studio
        </p>
      </div>

      {/* Type filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Link
          href="/posts"
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            !postType
              ? "bg-primary text-on-primary"
              : "bg-surface border border-outline text-on-surface-variant hover:bg-primary-container"
          }`}
        >
          All
        </Link>
        {Object.entries(POST_TYPE_LABELS).map(([value, label]) => (
          <Link
            key={value}
            href={`/posts?type=${value}`}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              postType === value
                ? "bg-primary text-on-primary"
                : "bg-surface border border-outline text-on-surface-variant hover:bg-primary-container"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-on-surface-variant text-lg">No posts found.</p>
        </div>
      )}
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: "Posts - EONMUN",
    description: "News, insights, and stories from the EONMUN studio",
  };
}
