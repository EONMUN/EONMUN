import { getCollectionById } from '@/actions/collection';
import CollectionForm from '@/components/CollectionForm';
import { notFound } from 'next/navigation';

export default async function EditCollectionPage({
  params,
}: {
  params: { documentId: string };
}) {
  const collection = await getCollectionById(params.documentId);

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
