interface ImageProps {
  src: string;
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

export default function Image({ src, className = "" }: ImageProps) {
  console.log(src);
  // Handle URL resolution for different environments
  

  const imageUrl = getImageUrl(src);

  return (
    <img
      src={imageUrl}
      className={className}
    />
  );
} 