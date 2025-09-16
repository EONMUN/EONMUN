"use client"

import React from 'react';
import { FrostedGlass } from '../ui/FrostedGlass';
import { Filter, ChevronDown } from 'lucide-react';

interface StoreFiltersProps {
  collections: string[];
  selectedCollection: string;
  onCollectionChange: (collection: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
}

export function StoreFilters({
  collections,
  selectedCollection,
  onCollectionChange,
  sortBy,
  onSortChange,
  priceRange,
  onPriceRangeChange
}: StoreFiltersProps) {
  const handlePriceChange = (index: 0 | 1, value: string) => {
    const numValue = parseInt(value) || 0;
    const newRange: [number, number] = [...priceRange];
    newRange[index] = numValue;
    if (index === 0 && numValue <= priceRange[1]) {
      onPriceRangeChange(newRange);
    } else if (index === 1 && numValue >= priceRange[0]) {
      onPriceRangeChange(newRange);
    }
  };

  return (
    <FrostedGlass className="p-6 sticky top-20">
      <div className="flex items-center gap-2 mb-6">
        <Filter className="w-5 h-5" />
        <h2 className="text-lg font-semibold">Filters</h2>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-3">Collection</label>
          <div className="space-y-2">
            <button
              onClick={() => onCollectionChange('all')}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                selectedCollection === 'all'
                  ? 'bg-black/10 dark:bg-white/10'
                  : 'hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              All Collections
            </button>
            {collections.map((collection) => (
              <button
                key={collection}
                onClick={() => onCollectionChange(collection)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedCollection === collection
                    ? 'bg-black/10 dark:bg-white/10'
                    : 'hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {collection}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-3">Sort By</label>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="w-full px-3 py-2 pr-8 rounded-lg bg-white/50 dark:bg-black/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 appearance-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-3">Price Range</label>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400">Min Price</label>
              <input
                type="number"
                min="0"
                value={priceRange[0]}
                onChange={(e) => handlePriceChange(0, e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-black/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400">Max Price</label>
              <input
                type="number"
                min="0"
                value={priceRange[1]}
                onChange={(e) => handlePriceChange(1, e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-black/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700"
                placeholder="10000"
              />
            </div>
            <div className="text-sm text-center text-gray-600 dark:text-gray-400">
              ${priceRange[0].toLocaleString()} - ${priceRange[1].toLocaleString()}
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            onCollectionChange('all');
            onSortChange('newest');
            onPriceRangeChange([0, 10000]);
          }}
          className="w-full px-4 py-2 text-sm rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          Reset Filters
        </button>
      </div>
    </FrostedGlass>
  );
}