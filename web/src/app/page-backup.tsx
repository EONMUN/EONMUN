import { strapiClient } from "@/lib/strapi";
import HomePageArtworkCarousel from "@/components/HomePageArtworkCarousel";
import { Artwork } from "@/lib/strapi";

export default async function Home() {
  const { data } = await strapiClient.single("home").find({
    populate: {
      slides: {
        populate: {
          default_image: true,
          collections: true,
        },
      },
    },
  });
  
  return (
    <div className="absolute inset-0 w-full h-screen">
      <HomePageArtworkCarousel artworks={data.slides as Artwork[]} />
    </div>
  );
}