import PostForm from "@/components/PostForm";

export default function NewPostPage() {
  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-on-background mb-6 sm:mb-8">
        New Post
      </h1>
      <div className="bg-surface rounded-lg shadow-md border border-outline p-6">
        <PostForm key="new" />
      </div>
    </div>
  );
}
