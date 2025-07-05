import strapi from "@/utils/strapi";
import Image from "@/components/Image";
import { Artwork } from "@/lib/strapi";

function ArtworkCarousel({ artworks }: { artworks: Artwork[] }) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="overflow-x-auto">
        <div className="flex gap-4 pb-4">
          {artworks.map((artwork) => (
            <div key={artwork.id} className="flex-none w-80">
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <Image 
                        src={artwork.default_image.url} 
                        alt={artwork.title}
                        className="w-full h-full object-cover"
                      />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function Home() {
  const {data} = await strapi.collection('artworks').find({
    populate: {
      default_image: {
        populate: '*'
      }
    }
  })
  console.log(data)
  return (
    <div >
      <main >
        <ArtworkCarousel artworks={data as Artwork[]} />
      </main>
      
    </div>
  );
}
