import { getCollectionByIdAdmin } from '@/actions/admin/collection';
import CollectionForm from '@/components/CollectionForm';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EditCollectionPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const id = parseInt(documentId);
  
  if (isNaN(id)) {
    notFound();
  }
  
  const collection = await getCollectionByIdAdmin(id);

  if (!collection) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Collection</h1>
      <div className="bg-white rounded-lg shadow-md p-8">
        <CollectionForm collection={collection} />
      </div>
    </div>
  );
}
