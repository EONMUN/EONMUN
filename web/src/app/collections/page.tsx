import { getAllCollections } from "@/actions/collection";
import { CollectionsCarousel } from "@/components/CollectionsCarousel";

export default async function CollectionsPage() {
  const { data } = await getAllCollections({
    populate: {
      artworks: {
        populate: {
          default_image: true,
        },
      },
    },
  });

  return <CollectionsCarousel collections={data} />;
} 