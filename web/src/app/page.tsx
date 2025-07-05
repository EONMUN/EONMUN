import strapi from "@/utils/strapi";
import Image from "@/components/Image";
import { Artwork } from "@/lib/strapi";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

function ArtworkCarousel({ artworks }: { artworks: Artwork[] }) {
  return (
    <Carousel className="w-full h-screen">
      <CarouselContent className="h-full">
        {artworks.map((artwork) => (
          <CarouselItem key={artwork.id} className="h-full">
            <div className="p-1 h-full">
              <Card className="h-full">
                <CardContent className="flex items-center justify-center p-0 h-full">
                  <div className="w-full h-full">
                      <Image 
                        src={artwork.default_image.url} 
                        alt={artwork.default_image.alternativeText || artwork.title}
                        className="w-full h-full object-cover"
                      />
                    ) 
                  </div>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-4" />
      <CarouselNext className="right-4" />
    </Carousel>
  );
}

export default async function Home() {
  const {data} = await strapi.collection('artworks').find({
    populate: {
      default_image: {
        populate: '*'
      },
    }
  })
  console.log(data)
  return (
    <div className="h-screen">
      <main className="h-full">
        <ArtworkCarousel artworks={data as Artwork[]} />
      </main>
    </div>
  );
}
