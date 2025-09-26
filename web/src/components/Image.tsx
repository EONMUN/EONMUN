import { StrapiImage } from '@/lib/strapi';

interface ImageProps {
  src?: string;
  image?: StrapiImage;
  className?: string;
  alt?: string;
}

const getImageUrl = (url: string): string => {
  // If URL is already absolute, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // For uploads, use the proxy endpoint
  if (url.startsWith('/uploads/')) {
    return url; // The proxy will handle this
  }
  
  // For other paths, use the original logic
  if (process.env.NODE_ENV === 'development') {
    return `http://localhost:1337${url}`;
  }
  
  return url;
};

export default function Image({ src, image, className = "", alt }: ImageProps) {
  // Determine the source URL - either from src prop or image prop
  const sourceUrl = src || image?.url;
  
  if (!sourceUrl) {
    return null;
  }

  console.log(sourceUrl);
  
  const imageUrl = getImageUrl(sourceUrl);
  const altText = alt || image?.alternativeText || "";

  return (
    <img
      src={imageUrl}
      alt={altText}
      className={className}
    />
  );
} 