import { getAllCollections } from "@/actions/collection";
import { CollectionsCarousel } from "@/components/CollectionsCarousel";

// Force dynamic rendering - disable build-time caching
export const dynamic = 'force-dynamic';

export default async function CollectionsPage() {
  const { data } = await getAllCollections();

  return <CollectionsCarousel collections={data} />;
} 