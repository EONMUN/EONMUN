import ArtworkForm from '@/components/ArtworkForm';

export default function NewArtworkPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Artwork</h1>

      {/* Info Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-800 text-sm">
          <strong>Note:</strong> You can upload images after creating the artwork. Save the basic details first, then add images on the edit page.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <ArtworkForm />
      </div>
    </div>
  );
}
