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
  
  // For local development, prefix with Strapi URL
  if (process.env.NODE_ENV === 'development') {
    return `http://localhost:1337${url}`;
  }
  
  // For production, use the URL as provided by Strapi
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