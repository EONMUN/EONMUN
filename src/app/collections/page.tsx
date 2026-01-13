import { getAllCollections } from "@/actions/collection";
import { CollectionsCarousel } from "@/components/CollectionsCarousel";

// Enable ISR - revalidate every hour
export const revalidate = 3600;

export default async function CollectionsPage() {
  const { data } = await getAllCollections();

  return <CollectionsCarousel collections={data} />;
} 