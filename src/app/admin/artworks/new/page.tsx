import ArtworkForm from '@/components/ArtworkForm';

export default function NewArtworkPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-on-background mb-8">Create New Artwork</h1>
      <div className="bg-surface rounded-lg shadow-md p-8 border border-outline">
        <ArtworkForm />
      </div>
    </div>
  );
}
