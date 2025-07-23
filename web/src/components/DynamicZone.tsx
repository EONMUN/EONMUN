import Image from "@/components/Image";
import { DynamicZoneBlock } from "@/lib/strapi";

interface DynamicZoneProps {
  blocks?: DynamicZoneBlock[];
}

interface MediaComponentProps {
  file?: {
    url: string;
    alternativeText?: string;
    caption?: string;
  };
}

interface QuoteComponentProps {
  title?: string;
  body?: string;
}

interface RichTextComponentProps {
  body?: string;
}

interface SliderComponentProps {
  files?: Array<{
    url: string;
    alternativeText?: string;
    caption?: string;
  }>;
}

function MediaComponent({ file }: MediaComponentProps) {
  if (!file) return null;

  return (
    <div className="my-8">
      <Image
        src={file.url}
        alt={file.alternativeText || ""}
        className="w-full h-auto rounded-lg shadow-md"
      />
      {file.caption && (
        <p className="text-sm text-on-surface-variant mt-2 text-center italic">
          {file.caption}
        </p>
      )}
    </div>
  );
}

function QuoteComponent({ title, body }: QuoteComponentProps) {
  return (
    <blockquote className="border-l-4 border-primary pl-6 py-4 my-8 bg-surface rounded-r-lg">
      {title && (
        <h3 className="text-lg font-semibold text-on-surface mb-2">{title}</h3>
      )}
      {body && (
        <p className="text-on-surface-variant italic">{body}</p>
      )}
    </blockquote>
  );
}

function RichTextComponent({ body }: RichTextComponentProps) {
  if (!body) return null;

  return (
    <div 
      className="prose prose-lg max-w-none my-8 text-on-surface"
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}

function SliderComponent({ files }: SliderComponentProps) {
  if (!files || files.length === 0) return null;

  return (
    <div className="my-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.map((file, index) => (
          <div key={index} className="relative">
            <Image
              src={file.url}
              alt={file.alternativeText || `Slide ${index + 1}`}
              className="w-full h-64 object-cover rounded-lg shadow-md"
            />
            {file.caption && (
              <p className="text-sm text-on-surface-variant mt-2 text-center">
                {file.caption}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DynamicZone({ blocks }: DynamicZoneProps) {
  if (!blocks || blocks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-on-surface-variant">No content available.</p>
      </div>
    );
  }

  return (
    <div>
      {blocks.map((block) => {
        switch (block.__component) {
          case 'shared.media':
            return <MediaComponent key={block.id} file={block.file} />;
          case 'shared.quote':
            return <QuoteComponent key={block.id} title={block.title} body={block.body} />;
          case 'shared.rich-text':
            return <RichTextComponent key={block.id} body={block.body} />;
          case 'shared.slider':
            return <SliderComponent key={block.id} files={block.files} />;
          default:
            console.warn(`Unknown component type: ${block.__component}`);
            return null;
        }
      })}
    </div>
  );
} 