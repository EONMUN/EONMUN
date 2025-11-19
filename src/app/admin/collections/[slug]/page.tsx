import { getCollectionWithArtworksBySlugAdmin } from '@/actions/admin/collection';
import CollectionForm from '@/components/CollectionForm';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EditCollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const collection = await getCollectionWithArtworksBySlugAdmin(slug);

  if (!collection) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-on-background mb-8">Edit Collection</h1>
      <div className="bg-surface rounded-lg shadow-md p-8 border border-outline">
        <CollectionForm collection={collection} />
      </div>
    </div>
  );
}
