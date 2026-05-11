import { cache } from "react";
import Link from "next/link";
import Image from "@/components/Image";
import { getPostBySlug } from "@/actions/post";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { buildSocialMetadata, SITE_NAME } from "@/utils/metadata";

// Edge-cache post detail for 5 min — once a post is published its
// content is stable; bursts from social-media link previews benefit
// from a longer TTL than the listing index.
export const revalidate = 300;

// Dedupe the lookup between page render and generateMetadata.
const getPostCached = cache(getPostBySlug);

const POST_TYPE_LABELS: Record<string, string> = {
  announcement: "Announcement",
  educational: "Educational",
  behind_the_scenes: "Behind the Scenes",
  general: "General",
};

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostCached(slug);

  if (!post) {
    notFound();
  }

  const publishedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-8">
        <Link href="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/posts" className="hover:text-primary transition-colors">
          Posts
        </Link>
        <span>/</span>
        <span className="truncate">{post.title}</span>
      </div>

      <article className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-block px-2 py-0.5 bg-primary-container text-on-primary-container rounded text-xs">
              {POST_TYPE_LABELS[post.postType] || post.postType}
            </span>
            {publishedDate && (
              <span className="text-sm text-on-surface-variant">
                {publishedDate}
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-on-background mb-4">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-lg text-on-surface-variant">{post.excerpt}</p>
          )}
        </header>

        {/* Cover Image */}
        {post.coverImageUrl && (
          <div className="mb-8 rounded-lg overflow-hidden border border-outline">
            <Image
              src={post.coverImageUrl}
              alt={post.title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Body */}
        <div className="prose prose-lg max-w-none text-on-surface prose-headings:text-on-background prose-a:text-primary prose-strong:text-on-surface prose-code:text-on-surface">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize]}
          >
            {post.body}
          </ReactMarkdown>
        </div>

        {/* Linked Artworks */}
        {post.artworks && post.artworks.length > 0 && (
          <section className="mt-12 pt-8 border-t border-outline">
            <h2 className="text-2xl font-bold text-on-background mb-6">
              Featured Artworks
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {post.artworks.map((artwork) => (
                <Link
                  key={artwork.id}
                  href={`/artworks/${artwork.slug}`}
                  className="group block"
                >
                  <div className="aspect-square overflow-hidden rounded-lg bg-surface border border-outline mb-2">
                    {artwork.defaultImageUrl ? (
                      <Image
                        src={artwork.defaultImageUrl}
                        alt={artwork.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-on-surface-variant text-sm">
                          No Image
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors text-center">
                    {artwork.title}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Linked Collections */}
        {post.collections && post.collections.length > 0 && (
          <section className="mt-8 pt-8 border-t border-outline">
            <h2 className="text-2xl font-bold text-on-background mb-4">
              Related Collections
            </h2>
            <div className="flex flex-wrap gap-2">
              {post.collections.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/collections/${collection.slug}`}
                  className="inline-block px-4 py-2 bg-primary-container hover:bg-primary-container/80 text-on-primary-container rounded-full transition-colors text-sm font-medium"
                >
                  {collection.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Back to Posts */}
        <div className="mt-12 text-center">
          <Link
            href="/posts"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
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
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Posts
          </Link>
        </div>
      </article>
    </div>
  );
}

export async function generateMetadata({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostCached(slug);

  if (!post) {
    return { title: "Post Not Found" };
  }

  const description = post.excerpt || `Read "${post.title}" on ${SITE_NAME}`;

  return buildSocialMetadata({
    title: `${post.title} - ${SITE_NAME}`,
    description,
    image: post.coverImageUrl,
    path: `/posts/${post.slug}`,
    type: "article",
    publishedTime: post.publishedAt
      ? new Date(post.publishedAt).toISOString()
      : undefined,
  });
}
