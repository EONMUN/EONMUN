"use client";

import { Collection } from "@/lib/strapi";
import Image from "@/components/Image";
import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext
} from "@/components/ui/carousel";
import { useEffect, useRef } from "react";

function CollectionCard({ collection }: { collection: Collection }) {
  // Get the first artwork's image as the collection thumbnail
  const thumbnailImage = collection.artworks?.[0]?.default_image;

  return (
    <div className="group h-full">
      <Link
        href={`/collections/${collection.slug}`}
        className="block h-full flex flex-col"
      >
        <div className="aspect-[4/5] overflow-hidden rounded-lg bg-surface border border-outline mb-6">
          {thumbnailImage ? (
            <Image
              src={thumbnailImage.url}
              alt={thumbnailImage.alternativeText || collection.name}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-surface flex items-center justify-center">
              <span className="text-on-surface-variant">No Image</span>
            </div>
          )}
        </div>

        <div className="text-center pb-4">
          <h3 className="text-2xl font-medium text-on-background group-hover:text-primary transition-colors mb-2">
            {collection.name}
          </h3>
          {collection.artworks && (
            <p className="text-lg text-on-surface-variant">
              {collection.artworks.length} artwork{collection.artworks.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}

export function CollectionsCarousel({ collections }: { collections: Collection[] }) {
  const carouselRef = useRef<HTMLDivElement>(null);

  // Focus the carousel when component mounts for keyboard navigation
  useEffect(() => {
    if (carouselRef.current && collections.length > 0) {
      carouselRef.current.focus();
    }
  }, [collections]);

  if (collections.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-on-surface-variant text-lg">No collections found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Mobile: Column layout */}
      <div className="block md:hidden space-y-6">
        {collections.map((collection) => (
          <CollectionCard key={collection.id} collection={collection} />
        ))}
      </div>

      {/* Desktop: Carousel layout */}
      <div className="hidden md:flex flex-1 items-center">
        <Carousel
          ref={carouselRef}
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full mx-auto h-[calc(100vh-12rem)] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
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

        {/* Keyboard navigation hint */}
        <div className="fixed bottom-4 right-4 bg-surface border border-outline rounded-lg p-3 text-sm text-on-surface-variant shadow-lg">
          <div className="flex items-center gap-2">
            <span>Use</span>
            <kbd className="px-2 py-1 bg-surface-variant rounded text-xs">←</kbd>
            <kbd className="px-2 py-1 bg-surface-variant rounded text-xs">→</kbd>
            <span>to navigate</span>
          </div>
        </div>
      </div>
    </div>
  );
}
