import { collectionAPI } from "@/lib/strapi";
import Image from "@/components/Image";
import Link from "next/link";
import { Collection } from "@/lib/strapi";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselPrevious, 
  CarouselNext 
} from "@/components/ui/carousel";

function CollectionCard({ collection }: { collection: Collection }) {
  // Get the first artwork's image as the collection thumbnail
  const thumbnailImage = collection.artworks?.[0]?.default_image;
  
  return (
    <div className="group h-full">
      <Link 
        href={`/collections/${collection.slug}`}
        className="block h-full flex flex-col"
      >
        <div className="aspect-[4/5] overflow-hidden rounded-lg bg-gray-100 mb-6">
          {thumbnailImage ? (
            <Image
              src={thumbnailImage.url}
              alt={thumbnailImage.alternativeText || collection.name}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">No Image</span>
            </div>
          )}
        </div>
        
        <div className="text-center pb-4">
          <h3 className="text-2xl font-medium text-gray-900 group-hover:text-gray-700 transition-colors mb-2">
            {collection.name}
          </h3>
          {collection.artworks && (
            <p className="text-lg text-gray-500">
              {collection.artworks.length} artwork{collection.artworks.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}

export default async function CollectionsPage() {
  const { data } = await collectionAPI.getAll({
    populate: {
      artworks: {
        populate: {
          default_image: true,
        },
      },
    },
  });

  const collections = data as Collection[];

  return (
    <div className="flex flex-col">
      <div className="mb-8 flex-shrink-0">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Collections</h1>
        <p className="text-gray-600">
          Explore our curated collections of artworks
        </p>
      </div>

      {collections.length > 0 ? (
        <div className="flex-1 flex items-center">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full max-w-7xl mx-auto h-[calc(100vh-12rem)]"
          >
            <CarouselContent className="-ml-2 md:-ml-4 h-full">
              {collections.map((collection) => (
                <CarouselItem 
                  key={collection.id} 
                  className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3 h-full"
                >
                  <CollectionCard collection={collection} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 text-lg">No collections found.</p>
          </div>
        </div>
      )}
    </div>
  );
} 