import { getAllCollections } from "@/actions/collection";
import { CollectionsCarousel } from "@/components/CollectionsCarousel";

export default async function CollectionsPage() {
  const { data } = await getAllCollections();

  return <CollectionsCarousel collections={data} />;
} 