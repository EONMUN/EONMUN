"use client"
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
import Autoplay from "embla-carousel-autoplay";
import Fade from "embla-carousel-fade";

function ArtworkCarouselItem({ artwork }: { artwork: Artwork }) {
  return (
    <CarouselItem key={artwork.id} className="h-full pl-0">
      <div className="mobile-fullscreen-carousel-item relative">
        <Image
          src={artwork.default_image!.url}
          alt={artwork.default_image?.alternativeText}
          className="mobile-fullscreen-image"
        />

        {/* Collection display in bottom right */}
        {artwork?.collections && artwork?.collections?.length > 0 && (
          <ArtworkInfo artwork={artwork} />
        )}
      </div>
    </CarouselItem>
  );
}

export default function HomePageArtworkCarousel({ artworks }: { artworks: Artwork[] }) {
  return (
    <div className="mobile-fullscreen-carousel">
      <Carousel 
        className="w-full h-full"
        plugins={[
          Autoplay({
            delay: 5000,
          }),
          Fade(),
        ]}
        opts={{
          loop: true,
        }}
      >
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