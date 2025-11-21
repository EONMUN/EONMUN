import Link from "next/link";
import type { ArtworkWithCollections } from "@/models/artwork";
import { FrostedGlass } from "@/components/ui/FrostedGlass";

interface ArtworkInfoProps {
  artwork: ArtworkWithCollections;
  className?: string;
}

export function ArtworkInfo({ artwork, className = "" }: ArtworkInfoProps) {
  return (
    <div className={`absolute bottom-5 right-4 z-[50] ${className}`}>
      <FrostedGlass 
        variant="dark" 
        className="p-3 rounded-lg"
      >
        <div className="flex flex-col gap-2 text-right">
          <div className="tracking-wide">
            <div className="text-xs text-white/70 font-medium uppercase">
              Name
            </div>
            <div className="text-base text-white font-medium">{artwork.title}</div>
          </div>

          {artwork.year && (
            <div className="tracking-wide">
              <div className="text-xs text-white/70 font-medium uppercase">
                Year
              </div>
              <div className="text-base text-white font-medium">{artwork.year}</div>
            </div>
          )}

          {artwork?.collections && artwork?.collections?.length > 0 && (
            <div className="tracking-wide">
              <div className="text-xs text-white/70 uppercase font-medium">
                Collection{artwork?.collections?.length > 1 ? "s" : ""}
              </div>
              <div className="flex flex-col gap-1">
                {artwork?.collections?.map((collection) => (
                  <Link
                    href={`/collections/${collection.slug}`}
                    key={collection.id}
                    className="text-base text-white font-medium hover:text-gray-200 transition-colors"
                  >
                    {collection.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </FrostedGlass>
    </div>
  );
} 