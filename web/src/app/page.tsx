import { strapiClient } from "@/lib/strapi";
import Image from "@/components/Image";
import { ArtworkInfo } from "@/components/ArtworkInfo";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Artwork } from "@/lib/strapi";

function ArtworkCarouselItem({ artwork }: { artwork: Artwork }) {
  console.log(artwork);
  return (
    <CarouselItem key={artwork.id} className="h-full pl-0">
      <div className="relative h-screen w-full overflow-hidden">
        <Image
          src={artwork.default_image!.url}
          alt={artwork.default_image?.alternativeText}
          className="absolute inset-0 w-full h-screen object-cover object-center"
        />

        {/* Collection display in bottom right */}
        {artwork?.collections && artwork?.collections?.length > 0 && (
          <ArtworkInfo artwork={artwork} />
        )}
      </div>
    </CarouselItem>
  );
}

function ArtworkCarousel({ artworks }: { artworks: Artwork[] }) {
  return (
    <div className="fixed inset-0 z-0">
      <Carousel className="w-full h-full">
        <CarouselContent className="h-full -ml-0">
          {artworks.map((artwork) => (
            <ArtworkCarouselItem key={artwork.id} artwork={artwork} />
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-4 z-10" />
        <CarouselNext className="right-4 z-10" />
      </Carousel>
    </div>
  );
}

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
  return <ArtworkCarousel artworks={data.slides as Artwork[]} />;
}
