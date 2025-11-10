import { getArtworkByIdAdmin } from '@/actions/admin/artwork';
import { getArtworkUploadsAdmin } from '@/actions/admin/uploads';
import ArtworkForm from '@/components/ArtworkForm';
import ArtworkUploadsManager from '@/components/ArtworkUploadsManager';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EditArtworkPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const id = parseInt(documentId);

  if (isNaN(id)) {
    notFound();
  }

  const artwork = await getArtworkByIdAdmin(id);

  if (!artwork) {
    notFound();
  }

  // Fetch uploads for this artwork
  const artworkUploads = await getArtworkUploadsAdmin(id);

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Artwork</h1>

      {/* Artwork Form */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <h2 className="text-xl font-semibold mb-4">Artwork Details</h2>
        <ArtworkForm artwork={artwork} />
      </div>

      {/* Upload Manager */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <ArtworkUploadsManager artworkId={id} artworkUploads={artworkUploads} />
      </div>
    </div>
  );
}
