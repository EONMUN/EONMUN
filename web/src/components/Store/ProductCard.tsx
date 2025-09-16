"use client"

import React from 'react';
import { LinkComponent } from '../LinkComponent';
import { FrostedGlass } from '../ui/FrostedGlass';
import { ShoppingCart, Eye } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import CustomImage from '@/components/Image';

interface ProductCardProps {
  artwork: {
    id: number;
    title: string;
    slug: string;
    description?: string;
    year?: number;
    default_image: {
      url: string;
      alternativeText?: string;
    };
    collections?: Array<{
      id: number;
      name: string;
    }>;
    price?: number;
    available?: boolean;
  };
}

export function ProductCard({ artwork }: ProductCardProps) {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart({
      id: artwork.id,
      title: artwork.title,
      price: artwork.price || 0,
      imageUrl: artwork.default_image?.url || '',
      quantity: 1
    });
  };

  return (
    <FrostedGlass className="group overflow-hidden hover:shadow-xl transition-all duration-300">
      <LinkComponent href={`/artworks/${artwork.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
          {artwork.default_image?.url && (
            <CustomImage
              src={artwork.default_image.url}
              alt={artwork.default_image?.alternativeText || artwork.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )}
          {!artwork.available && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold text-lg">SOLD</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <LinkComponent
              href={`/artworks/${artwork.slug}`}
              className="p-2 bg-white/90 dark:bg-black/90 rounded-lg hover:bg-white dark:hover:bg-black transition-colors"
            >
              <Eye className="w-5 h-5" />
            </LinkComponent>
            {artwork.available && (
              <button
                onClick={handleAddToCart}
                className="p-2 bg-white/90 dark:bg-black/90 rounded-lg hover:bg-white dark:hover:bg-black transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-1 line-clamp-1">{artwork.title}</h3>
          {artwork.year && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{artwork.year}</p>
          )}
          {artwork.collections && artwork.collections.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {artwork.collections.slice(0, 2).map((collection) => (
                <span
                  key={collection.id}
                  className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded"
                >
                  {collection.name}
                </span>
              ))}
            </div>
          )}
          <div className="flex justify-between items-center mt-3">
            <span className="text-xl font-bold">
              ${artwork.price?.toLocaleString() || '0'}
            </span>
            <span className={`text-sm ${artwork.available ? 'text-green-600' : 'text-red-600'}`}>
              {artwork.available ? 'Available' : 'Sold'}
            </span>
          </div>
        </div>
      </LinkComponent>
    </FrostedGlass>
  );
}