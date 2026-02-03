import Link from "next/link";
import { getAllPostsAdmin } from "@/actions/admin/post";

export const dynamic = "force-dynamic";

function PostTypeBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
    announcement: "Announcement",
    educational: "Educational",
    behind_the_scenes: "Behind the Scenes",
    general: "General",
  };
  return (
    <span className="inline-block px-2 py-0.5 bg-primary-container text-on-primary-container rounded text-xs">
      {labels[type] || type}
    </span>
  );
}

function PostStatus({
  publishedAt,
  scheduledAt,
}: {
  publishedAt: Date | null;
  scheduledAt: Date | null;
}) {
  if (publishedAt) {
    return (
      <span className="inline-block px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">
        Published
      </span>
    );
  }
  if (scheduledAt) {
    return (
      <span className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs">
        Scheduled
      </span>
    );
  }
  return (
    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-800 rounded text-xs">
      Draft
    </span>
  );
}

export default async function PostsAdminPage() {
  const result = await getAllPostsAdmin();
  if ("error" in result) {
    return <div>Error: {result.error}</div>;
  }
  const posts = result.data;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-on-background">
          Posts
        </h1>
        <Link
          href="/admin/posts/new"
          className="px-4 py-2 bg-primary text-on-primary rounded-md hover:opacity-90 font-medium text-center whitespace-nowrap"
        >
          + New Post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="bg-surface rounded-lg shadow-md p-12 text-center border border-outline">
          <svg
            className="w-16 h-16 text-on-surface-variant mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
          <h3 className="text-lg font-medium text-on-surface mb-2">
            No posts yet
          </h3>
          <p className="text-on-surface-variant mb-4">
            Get started by creating your first post
          </p>
          <Link
            href="/admin/posts/new"
            className="inline-block px-4 py-2 bg-primary text-on-primary rounded-md hover:opacity-90 font-medium"
          >
            Create Post
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-4">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/admin/posts/edit/${post.slug}`}
                className="block bg-surface rounded-lg shadow-md border border-outline hover:bg-primary-container/50 transition-colors"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-base font-medium text-primary truncate">
                      {post.title}
                    </h3>
                    <PostStatus
                      publishedAt={post.publishedAt}
                      scheduledAt={post.scheduledAt}
                    />
                  </div>
                  {post.excerpt && (
                    <p className="text-sm text-on-surface-variant line-clamp-2 mb-2">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <PostTypeBadge type={post.postType} />
                    <span className="text-xs text-on-surface-variant">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden md:block bg-surface rounded-lg shadow-md overflow-hidden border border-outline">
            <table className="min-w-full divide-y divide-outline">
              <thead className="bg-primary-container">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-on-primary-container uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-on-primary-container uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-on-primary-container uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-on-primary-container uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-on-primary-container uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-outline">
                {posts.map((post) => (
                  <tr
                    key={post.id}
                    className="hover:bg-primary-container/50 cursor-pointer relative"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/posts/edit/${post.slug}`}
                        className="absolute inset-0"
                        aria-label={`Edit ${post.title}`}
                      />
                      <span className="text-sm font-medium text-primary">
                        {post.title}
                      </span>
                      {post.excerpt && (
                        <div className="text-sm text-on-surface-variant truncate max-w-xs">
                          {post.excerpt}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PostTypeBadge type={post.postType} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PostStatus
                        publishedAt={post.publishedAt}
                        scheduledAt={post.scheduledAt}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-on-surface">
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString()
                          : post.scheduledAt
                            ? new Date(post.scheduledAt).toLocaleDateString()
                            : new Date(post.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <span className="text-primary">Edit</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
