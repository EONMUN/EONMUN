import { getAllCollections } from "@/actions/collection";
import { CollectionsCarousel } from "@/components/CollectionsCarousel";

// Admin collection mutations call revalidatePath('/admin/collections'); 5min TTL is the safety net for the public list.
export const revalidate = 300;

export default async function CollectionsPage() {
  const { data } = await getAllCollections();

  return <CollectionsCarousel collections={data} />;
}
