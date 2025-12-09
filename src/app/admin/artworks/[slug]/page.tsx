import { getArtworkWithProductBySlugAdmin } from "@/actions/admin/artwork";
import ArtworkForm from "@/components/ArtworkForm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditArtworkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const artworkWithProduct = await getArtworkWithProductBySlugAdmin(slug);

  if (!artworkWithProduct) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-on-background mb-8">
        Edit Artwork
      </h1>
      <div className="bg-surface rounded-lg shadow-md p-8 border border-outline">
        <ArtworkForm
          artwork={artworkWithProduct}
          initialPrice={artworkWithProduct.product?.price}
        />
      </div>
    </div>
  );
}
