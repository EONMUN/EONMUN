import Link from "next/link";
import { Artwork } from "@/lib/strapi";
import { FrostedGlass } from "@/components/ui/FrostedGlass";

interface ArtworkInfoProps {
  artwork: Artwork;
  className?: string;
}

export function ArtworkInfo({ artwork, className = "" }: ArtworkInfoProps) {
  return (
    <div className={`absolute bottom-5 right-4 z-[50] ${className}`}>
      <FrostedGlass 
        variant="dark" 
        className="p-3 rounded-lg"
      >
        <div className="flex flex-col gap-1 text-right">
          <div className="tracking-wide">
            <div className="text-sm text-white font-medium uppercase">
              Name
            </div>
            <div className="text-xs text-white">{artwork.title}</div>
          </div>

          {artwork?.collections && artwork?.collections?.length > 0 && (
            <>
              <div className="text-gray-300 uppercase tracking-wide font-medium text-sm">
                Collection{artwork?.collections?.length > 1 ? "s" : ""}
              </div>
              {artwork?.collections?.map((collection) => (
                <Link
                  href={`/collections/${collection.slug}`}
                  key={collection.id}
                  className="text-xs text-white hover:text-gray-200 transition-colors"
                >
                  {collection.name}
                </Link>
              ))}
            </>
          )}
        </div>
      </FrostedGlass>
    </div>
  );
} 