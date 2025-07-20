import strapi from "@/utils/strapi";
import Image from "@/components/Image";
import Link from "next/link";
import { Collection } from "@/lib/strapi";
import { FrostedGlass } from "@/components/ui/FrostedGlass";

function CollectionCard({ collection }: { collection: Collection }) {
  // Get the first artwork's image as the collection thumbnail
  const thumbnailImage = collection.artworks?.[0]?.default_image;
  
  return (
    <Link 
      href={`/collections/${collection.slug}`}
      className="group relative block aspect-square overflow-hidden rounded-lg bg-gray-100"
    >
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
      
      {/* Collection info overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-4 left-4 right-4">
          <FrostedGlass variant="dark" className="p-3 rounded-lg">
            <h3 className="text-white font-medium text-lg">{collection.name}</h3>
            {collection.artworks && (
              <p className="text-gray-300 text-sm">
                {collection.artworks.length} artwork{collection.artworks.length !== 1 ? 's' : ''}
              </p>
            )}
          </FrostedGlass>
        </div>
      </div>
    </Link>
  );
}

export default async function CollectionsPage() {
  const { data } = await strapi.collection("collections").find({
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Collections</h1>
        <p className="text-gray-600">
          Explore our curated collections of artworks
        </p>
      </div>

      {collections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No collections found.</p>
        </div>
      )}
    </div>
  );
} 