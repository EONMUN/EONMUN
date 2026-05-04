import type { Metadata } from "next";

/**
 * Resolve the canonical site URL for absolute metadata URLs.
 *
 * Order of precedence matches the existing sitemap convention
 * (see src/app/sitemap.ts): NEXT_PUBLIC_APP_URL is the primary OG/SEO
 * variable per .env.production.example; NEXT_PUBLIC_SITE_URL is the
 * legacy alias kept for compatibility.
 */
export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://eonmun.com"
  );
}

/**
 * Default OG/Twitter image used when a page has no specific cover image.
 *
 * TODO: replace with a 1200x630 hero image. The current asset is the
 * square android-chrome icon; OG and Twitter still render it but with
 * smaller summary cards instead of summary_large_image previews.
 */
export const DEFAULT_OG_IMAGE = "/android-chrome-512x512.png";

export const SITE_NAME = "EONMUN";
export const SITE_DEFAULT_TITLE = "EONMUN";
export const SITE_DEFAULT_DESCRIPTION =
  "Original artworks and collections by EONMUN.";

export interface SocialMetadataInput {
  title: string;
  description: string;
  /** Absolute or root-relative path. Falls back to the site default if undefined. */
  image?: string | null;
  /** Root-relative path (e.g. "/posts/foo"). Becomes canonical og:url. */
  path: string;
  /** og:type — "article" for blog posts, "website" otherwise. */
  type?: "website" | "article";
  /** Optional ISO timestamp for og:article:published_time. */
  publishedTime?: string;
}

/**
 * Build a Next.js Metadata object with full Open Graph and Twitter Card
 * coverage so shared links render with image, title, and description on
 * Twitter/X, Facebook, Slack, Discord, iMessage, and LinkedIn.
 */
export function buildSocialMetadata(input: SocialMetadataInput): Metadata {
  const siteUrl = getSiteUrl();
  const url = new URL(input.path, siteUrl).toString();
  const imagePath = input.image || DEFAULT_OG_IMAGE;
  // CRITICAL: og:image and twitter:image MUST be absolute URLs — relative
  // paths are rejected by Twitter Card validator and most scrapers.
  const imageUrl = imagePath.startsWith("http")
    ? imagePath
    : new URL(imagePath, siteUrl).toString();

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: input.type || "website",
      url,
      title: input.title,
      description: input.description,
      siteName: SITE_NAME,
      images: [
        {
          url: imageUrl,
          alt: input.title,
        },
      ],
      ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [imageUrl],
    },
  };
}
