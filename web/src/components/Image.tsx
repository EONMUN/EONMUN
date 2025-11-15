interface ImageProps {
  src: string;
  className?: string;
  alt?: string;
}

export default function Image({ src, className = "", alt = "" }: ImageProps) {
  if (!src) {
    return null;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
    />
  );
} 