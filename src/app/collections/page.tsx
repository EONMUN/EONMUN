import { getAllCollections } from "@/actions/collection";
import { CollectionsCarousel } from "@/components/CollectionsCarousel";

// Edge-cache for 5 min; see e70e2ab for context.
export const revalidate = 300;

export default async function CollectionsPage() {
  const { data } = await getAllCollections();

  return <CollectionsCarousel collections={data} />;
}
