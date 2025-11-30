'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  searchFacetsAdmin,
  createFacetInlineAdmin,
} from '@/actions/admin/facet';
import type { Facet } from '@/models/facets';

interface FacetSelectorProps {
  type: string;
  label: string;
  selectedFacets: Facet[];
  onChange: (facets: Facet[]) => void;
  placeholder?: string;
}

export default function FacetSelector({
  type,
  label,
  selectedFacets,
  onChange,
  placeholder = 'Search or create...',
}: FacetSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Facet[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
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
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const result = await searchFacetsAdmin(query, type);
        // Filter out already selected facets
        const selectedIds = new Set(selectedFacets.map((f) => f.id));
        const filteredResults = result.data.filter(
          (facet) => !selectedIds.has(facet.id)
        );
        setSearchResults(filteredResults);
      } catch (err) {
        console.error('Error searching facets:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [type, selectedFacets]
  );

  const handleAddFacet = (facet: Facet) => {
    onChange([...selectedFacets, facet]);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleRemoveFacet = (facetId: number) => {
    onChange(selectedFacets.filter((f) => f.id !== facetId));
  };

  const handleCreateNew = async () => {
    if (!searchQuery.trim()) return;

    setIsCreating(true);
    try {
      const result = await createFacetInlineAdmin(searchQuery.trim(), type);
      if (result.success && result.data) {
        onChange([...selectedFacets, result.data]);
        setSearchQuery('');
        setSearchResults([]);
        setShowDropdown(false);
      }
    } catch (err) {
      console.error('Error creating facet:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0) {
        handleAddFacet(searchResults[0]);
      } else if (searchQuery.trim()) {
        handleCreateNew();
      }
    }
    if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  // Check if exact match exists in results
  const exactMatchExists = searchResults.some(
    (f) => f.name.toLowerCase() === searchQuery.toLowerCase()
  );

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-on-surface">
        {label}
      </label>

      {/* Selected facets as tags */}
      {selectedFacets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedFacets.map((facet) => (
            <span
              key={facet.id}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-container text-on-primary-container rounded-full text-sm"
            >
              {facet.name}
              <button
                type="button"
                onClick={() => handleRemoveFacet(facet.id)}
                className="hover:bg-on-primary-container/10 rounded-full p-0.5"
                aria-label={`Remove ${facet.name}`}
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </span>
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
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-2 bg-surface text-on-surface border border-outline rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
        />

        {/* Dropdown */}
        {showDropdown && (searchQuery || searchResults.length > 0) && (
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
                {searchResults.map((facet) => (
                  <li key={facet.id}>
                    <button
                      type="button"
                      onClick={() => handleAddFacet(facet)}
                      className="w-full px-4 py-2 text-left text-sm text-on-surface hover:bg-primary-container/30 flex items-center justify-between"
                    >
                      <span>{facet.name}</span>
                      <span className="text-xs text-on-surface-variant">
                        Add
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Create new option */}
            {!isSearching &&
              searchQuery.trim() &&
              !exactMatchExists && (
                <button
                  type="button"
                  onClick={handleCreateNew}
                  disabled={isCreating}
                  className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-primary-container/30 flex items-center gap-2 border-t border-outline"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  {isCreating ? (
                    'Creating...'
                  ) : (
                    <>
                      Create &ldquo;{searchQuery.trim()}&rdquo;
                    </>
                  )}
                </button>
              )}

            {!isSearching &&
              searchQuery &&
              searchResults.length === 0 &&
              exactMatchExists === false && (
                <div className="px-4 py-2 text-sm text-on-surface-variant">
                  Press Enter to create
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
