'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from '@/components/Image';
import { searchCollectionsAdmin } from '@/actions/admin/collection';
import type { Collection, CollectionWithDefault } from '@/models/collections';

export interface SelectedCollection {
  collection: Collection;
  isDefault: boolean;
}

interface CollectionSelectorProps {
  selectedCollections: SelectedCollection[];
  onChange: (collections: SelectedCollection[]) => void;
}

export default function CollectionSelector({
  selectedCollections,
  onChange,
}: CollectionSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Collection[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      setShowDropdown(true);

      if (!query.trim()) {
        // Show all collections when empty
        setIsSearching(true);
        try {
          const result = await searchCollectionsAdmin('');
          const selectedIds = new Set(selectedCollections.map((sc) => sc.collection.id));
          const filteredResults = result.data.filter(
            (collection) => !selectedIds.has(collection.id)
          );
          setSearchResults(filteredResults);
        } catch (err) {
          console.error('Error fetching collections:', err);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
        return;
      }

      setIsSearching(true);
      try {
        const result = await searchCollectionsAdmin(query);
        // Filter out already selected collections
        const selectedIds = new Set(selectedCollections.map((sc) => sc.collection.id));
        const filteredResults = result.data.filter(
          (collection) => !selectedIds.has(collection.id)
        );
        setSearchResults(filteredResults);
      } catch (err) {
        console.error('Error searching collections:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [selectedCollections]
  );

  const handleAddCollection = (collection: Collection) => {
    onChange([...selectedCollections, { collection, isDefault: false }]);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleRemoveCollection = (collectionId: number) => {
    onChange(selectedCollections.filter((sc) => sc.collection.id !== collectionId));
  };

  const handleToggleDefault = (collectionId: number) => {
    onChange(
      selectedCollections.map((sc) =>
        sc.collection.id === collectionId
          ? { ...sc, isDefault: !sc.isDefault }
          : sc
      )
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0) {
        handleAddCollection(searchResults[0]);
      }
    }
    if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-on-surface">
        Collections
      </label>

      {/* Selected collections list */}
      {selectedCollections.length > 0 && (
        <div className="space-y-2">
          {selectedCollections.map(({ collection, isDefault }) => (
            <div
              key={collection.id}
              className="flex items-center gap-3 p-2 bg-surface-variant/50 rounded-lg border border-outline/50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-on-surface truncate">
                  {collection.name}
                </p>
                {collection.description && (
                  <p className="text-xs text-on-surface-variant truncate">
                    {collection.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={() => handleToggleDefault(collection.id)}
                    className="w-4 h-4 text-primary bg-surface border-outline rounded focus:ring-primary focus:ring-2"
                  />
                  <span className="text-on-surface-variant">Default</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleRemoveCollection(collection.id)}
                  className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search input with dropdown */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => handleSearch(searchQuery)}
          onKeyDown={handleKeyDown}
          placeholder="Search collections..."
          className="w-full px-4 py-2 bg-surface text-on-surface border border-outline rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
        />

        {/* Dropdown */}
        {showDropdown && (
          <div
            ref={dropdownRef}
            className="absolute z-10 w-full mt-1 bg-surface border border-outline rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            {isSearching && (
              <div className="px-4 py-2 text-sm text-on-surface-variant">
                Searching...
              </div>
            )}

            {!isSearching && searchResults.length > 0 && (
              <ul>
                {searchResults.map((collection) => (
                  <li key={collection.id}>
                    <button
                      type="button"
                      onClick={() => handleAddCollection(collection)}
                      className="w-full px-4 py-2 text-left hover:bg-primary-container/30 flex items-center justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-on-surface truncate">
                          {collection.name}
                        </p>
                        {collection.description && (
                          <p className="text-xs text-on-surface-variant truncate">
                            {collection.description}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-on-surface-variant flex-shrink-0 ml-2">
                        Add
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {!isSearching && searchResults.length === 0 && (
              <div className="px-4 py-2 text-sm text-on-surface-variant">
                {searchQuery ? 'No collections found' : 'No more collections available'}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedCollections.length === 0 && (
        <p className="text-xs text-on-surface-variant">
          No collections selected. Search to add this artwork to collections.
        </p>
      )}
    </div>
  );
}
