import strapi from "@/utils/strapi";
import Image from "@/components/Image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// Define the Slide interface based on the shared.slide component
interface Slide {
  id: string;
  text: string;
  link: string;
  image: {
    id: string;
    name: string;
    url: string;
    alternativeText?: string;
    caption?: string;
    width?: number;
    height?: number;
    formats?: Record<string, unknown>;
  };
}

function ArtworkCarousel({ artworks }: { artworks: Slide[] }) {
  return (
    <div className="fixed inset-0 z-0">
      <Carousel className="w-full h-full">
        <CarouselContent className="h-full -ml-0">
          {artworks.map((artwork) => (
            <CarouselItem key={artwork.id} className="h-full pl-0">
              <div className="h-full">
                <div className="h-full">
                  <Image 
                    src={artwork.image.url}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-4 z-10" />
        <CarouselNext className="right-4 z-10" />
      </Carousel>
    </div>
  );
}

export default async function Home() {
  const {data} = await strapi.single('home').find({
    populate: {
      slides: {
        populate: '*'
      }
    }
  })
  console.log(data)
  return (
    <>
      <ArtworkCarousel artworks={data.slides as Slide[]} />
    </>
  );
}
