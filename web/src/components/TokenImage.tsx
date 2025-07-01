"use client";
import { use, Suspense } from 'react';
import Arweave from 'arweave';

const arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https'
});

// Cache for promises to prevent infinite re-renders
const imagePromiseCache = new Map<string, Promise<string>>();

interface TokenImageProps {
  imageUrl: string | undefined;
  alt: string;
  className?: string;
}

interface TokenImageWrapperProps {
  imageUrl: string | undefined;
  alt: string;
  className?: string;
}

// Function to extract Arweave ID from ar:// format only
function extractArweaveId(uri: string): string | null {
  if (!uri || !uri.startsWith('ar://')) {
    return null;
  }
  return uri.substring(5); // Remove 'ar://' prefix
}

// Function that returns a cached promise for the image URL
function getCachedArweaveImage(arweaveId: string): Promise<string> {
  // Check if we already have a promise for this ID
  if (imagePromiseCache.has(arweaveId)) {
    return imagePromiseCache.get(arweaveId)!;
  }

  // Create new promise and cache it
  const promise = fetchArweaveImage(arweaveId);
  imagePromiseCache.set(arweaveId, promise);
  return promise;
}

// Function that actually fetches from Arweave
async function fetchArweaveImage(arweaveId: string): Promise<string> {
  try {
    const res = await arweave.api.get(arweaveId);
    return res.url;
  } catch (error) {
    // Remove failed promise from cache so it can be retried
    imagePromiseCache.delete(arweaveId);
    throw new Error(`Failed to fetch image from Arweave: ${error}`);
  }
}

// Main TokenImage component that uses suspense
export function TokenImage({ imageUrl, alt, className = "w-full h-full object-cover" }: TokenImageProps) {
  // Check if we have a valid ar:// URL
  if (!imageUrl || !imageUrl.startsWith('ar://')) {
    return <TokenImagePlaceholder message="No valid ar:// image URL provided" />;
  }

  const arweaveId = extractArweaveId(imageUrl);
  if (!arweaveId) {
    return <TokenImagePlaceholder message="Invalid Arweave URL format" />;
  }

  // Use React's use hook with cached promise to prevent infinite re-renders
  const fetchedImageUrl = use(getCachedArweaveImage(arweaveId));

  return (
    <div className="aspect-square">
      <img 
        src={fetchedImageUrl} 
        alt={alt}
        className={className}
        onError={() => {
          throw new Error('Failed to display image');
        }}
      />
    </div>
  );
}

// Loading component for suspense
export function TokenImageLoading() {
  return (
    <div className="aspect-square flex items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center space-y-2">
        <div className="loading loading-spinner loading-lg text-blue-600"></div>
        <span className="text-sm text-gray-600">Loading image from Arweave...</span>
      </div>
    </div>
  );
}

// Placeholder component for when no valid image URL is provided
export function TokenImagePlaceholder({ message }: { message: string }) {
  return (
    <div className="aspect-square flex items-center justify-center bg-gray-100 text-gray-500">
      <div className="text-center">
        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
}

// Main wrapper component that combines suspense and the TokenImage
export function TokenImageWrapper({ imageUrl, alt, className }: TokenImageWrapperProps) {
  // If imageUrl is undefined, show loading state directly (metadata is still loading)
  if (imageUrl === undefined) {
    return <TokenImageLoading />;
  }

  return (
    <Suspense fallback={<TokenImageLoading />}>
      <TokenImage imageUrl={imageUrl} alt={alt} className={className} />
    </Suspense>
  );
} 