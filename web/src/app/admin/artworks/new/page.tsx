import ArtworkForm from '@/components/ArtworkForm';

export default function NewArtworkPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Artwork</h1>
      <div className="bg-white rounded-lg shadow-md p-8">
        <ArtworkForm />
      </div>
    </div>
  );
}
