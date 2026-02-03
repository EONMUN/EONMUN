import { getPostBySlugAdmin } from "@/actions/admin/post";
import PostForm from "@/components/PostForm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const post = await getPostBySlugAdmin(slug);

  if (!post) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-on-background mb-6 sm:mb-8">
        Edit Post
      </h1>
      <div className="bg-surface rounded-lg shadow-md border border-outline p-6">
        <PostForm key={post.slug} post={post} />
      </div>
    </div>
  );
}
