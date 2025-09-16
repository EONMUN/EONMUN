"use client"

import React, { useState, useEffect } from 'react';
import { getArtworks } from '@/utils/get-artworks';
import { ProductCard } from '@/components/Store/ProductCard';
import { StoreFilters } from '@/components/Store/StoreFilters';
import { FrostedGlass } from '@/components/ui/FrostedGlass';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface Artwork {
  id: number;
  title: string;
  slug: string;
  description: string;
  year: number;
  default_image: {
    url: string;
    alternativeText?: string;
  };
  collections: Array<{
    id: number;
    name: string;
  }>;
  price?: number;
  available?: boolean;
}

export default function StorePage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [filteredArtworks, setFilteredArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const { cart, isCartOpen, setIsCartOpen } = useCart();

  useEffect(() => {
    async function fetchArtworks() {
      try {
        const data = await getArtworks();
        const artworksWithPrices = data.map((artwork: Artwork) => ({
          ...artwork,
          price: Math.floor(Math.random() * 9000) + 1000,
          available: Math.random() > 0.3
        }));
        setArtworks(artworksWithPrices);
        setFilteredArtworks(artworksWithPrices);
      } catch (error) {
        console.error('Failed to fetch artworks:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchArtworks();
  }, []);

  useEffect(() => {
    let filtered = [...artworks];

    if (selectedCollection !== 'all') {
      filtered = filtered.filter(artwork => 
        artwork.collections?.some(c => c.name === selectedCollection)
      );
    }

    filtered = filtered.filter(artwork => {
      const price = artwork.price || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'oldest':
        filtered.sort((a, b) => (a.year || 0) - (b.year || 0));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => (b.year || 0) - (a.year || 0));
        break;
    }

    setFilteredArtworks(filtered);
  }, [selectedCollection, sortBy, priceRange, artworks]);

  const collections = Array.from(
    new Set(artworks.flatMap(a => a.collections?.map(c => c.name) || []))
  );

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Store</h1>
        <button
          onClick={() => setIsCartOpen(!isCartOpen)}
          className="relative p-3 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <ShoppingCart className="w-6 h-6" />
          {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cartItemCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64">
          <StoreFilters
            collections={collections}
            selectedCollection={selectedCollection}
            onCollectionChange={setSelectedCollection}
            sortBy={sortBy}
            onSortChange={setSortBy}
            priceRange={priceRange}
            onPriceRangeChange={setPriceRange}
          />
        </aside>

        <main className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <FrostedGlass key={i} className="h-96 animate-pulse" />
              ))}
            </div>
          ) : filteredArtworks.length === 0 ? (
            <FrostedGlass className="p-8 text-center">
              <p className="text-lg">No artworks found matching your criteria.</p>
            </FrostedGlass>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredArtworks.map((artwork) => (
                <ProductCard key={artwork.id} artwork={artwork} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}