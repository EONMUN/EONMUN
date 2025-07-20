import { strapiClient } from "@/lib/strapi";
import Image from "@/components/Image";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Artwork } from "@/lib/strapi";
import { FrostedGlass } from "@/components/ui/FrostedGlass";
import Link from "next/link";

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

        {/* Collection display in bottom left */}
        {artwork?.collections && artwork?.collections?.length > 0 && (
          <div className="absolute bottom-20 left-4 z-[5]">
            <FrostedGlass variant="dark" className="p-3 rounded-lg">
              <div className="flex flex-col gap-1">
                <div className=" tracking-wide">
                  <div className="text-sm text-white  font-medium uppercase">
                    Name
                  </div>
                  <div className="text-xs text-white ">{artwork.title}</div>
                </div>

                <div className="text-gray-300 uppercase tracking-wide font-medium text-sm">
                  Collection{artwork?.collections?.length > 1 ? "s" : ""}
                </div>
                {artwork?.collections?.map((collection) => (
                  <Link
                    href={`/collections/${collection.slug}`}
                    key={collection.id}
                    className="text-xs text-white"
                  >
                    {collection.name}
                  </Link>
                ))}
              </div>
            </FrostedGlass>
          </div>
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
