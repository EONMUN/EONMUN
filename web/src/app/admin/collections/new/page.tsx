import CollectionForm from '@/components/CollectionForm';

export default function NewCollectionPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Collection</h1>
      <div className="bg-white rounded-lg shadow-md p-8">
        <CollectionForm />
      </div>
    </div>
  );
}
