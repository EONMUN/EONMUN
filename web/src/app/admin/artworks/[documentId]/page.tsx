import { getArtworkByIdAdmin } from '@/actions/admin/artwork';
import ArtworkForm from '@/components/ArtworkForm';
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

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Artwork</h1>
      <div className="bg-white rounded-lg shadow-md p-8">
        <ArtworkForm artwork={artwork} />
      </div>
    </div>
  );
}
