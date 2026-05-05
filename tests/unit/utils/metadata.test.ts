// Tests for src/utils/metadata.ts — Open Graph + Twitter Card helper.
// Maps to engineering issue Req 1 (helper) and Req 3-5 (per-page derivations).
//
// CRITICAL: og:image and twitter:image MUST be absolute URLs. Twitter Card
// validator and most scrapers reject relative paths, which is the failure
// mode this helper exists to prevent.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  DEFAULT_OG_IMAGE,
  SITE_DEFAULT_DESCRIPTION,
  SITE_NAME,
  buildSocialMetadata,
  getSiteUrl,
} from "@/utils/metadata";

const ORIGINAL_APP_URL = process.env.NEXT_PUBLIC_APP_URL;

describe("getSiteUrl", () => {
  beforeAll(() => {
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  afterAll(() => {
    if (ORIGINAL_APP_URL !== undefined)
      process.env.NEXT_PUBLIC_APP_URL = ORIGINAL_APP_URL;
    else delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it("falls back to https://eonmun.com when no env vars set", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(getSiteUrl()).toBe("https://eonmun.com");
  });

  it("uses NEXT_PUBLIC_APP_URL when set", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";
    expect(getSiteUrl()).toBe("https://app.example.com");
  });
});

describe("buildSocialMetadata", () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_APP_URL = "https://eonmun.test";
  });

  afterAll(() => {
    if (ORIGINAL_APP_URL === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = ORIGINAL_APP_URL;
  });

  it("emits openGraph and twitter blocks with absolute URLs (Req 1)", () => {
    const meta = buildSocialMetadata({
      title: "Test Post - EONMUN",
      description: "A test post excerpt",
      image: "/uploads/cover.png",
      path: "/posts/test-post",
      type: "article",
    });

    expect(meta.title).toBe("Test Post - EONMUN");
    expect(meta.description).toBe("A test post excerpt");

    // og:url and canonical MUST be absolute
    expect(meta.alternates?.canonical).toBe(
      "https://eonmun.test/posts/test-post",
    );
    const og = meta.openGraph as Record<string, unknown>;
    expect(og.url).toBe("https://eonmun.test/posts/test-post");
    expect(og.type).toBe("article");
    expect(og.siteName).toBe(SITE_NAME);
    expect(og.title).toBe("Test Post - EONMUN");
    expect(og.description).toBe("A test post excerpt");

    // og:image MUST be absolute (relative paths break Twitter validator)
    const ogImages = og.images as Array<{ url: string; alt: string }>;
    expect(ogImages[0].url).toBe("https://eonmun.test/uploads/cover.png");
    expect(ogImages[0].alt).toBe("Test Post - EONMUN");

    // twitter:card MUST be summary_large_image so previews render full-bleed
    const tw = meta.twitter as Record<string, unknown>;
    expect(tw.card).toBe("summary_large_image");
    expect(tw.title).toBe("Test Post - EONMUN");
    expect(tw.description).toBe("A test post excerpt");
    const twImages = tw.images as string[];
    expect(twImages[0]).toBe("https://eonmun.test/uploads/cover.png");
  });

  it("falls back to DEFAULT_OG_IMAGE when image is null (Req 3)", () => {
    // Posts without a cover image still need a valid og:image, otherwise
    // shares render with no preview card at all.
    const meta = buildSocialMetadata({
      title: "No Cover - EONMUN",
      description: "desc",
      image: null,
      path: "/posts/no-cover",
      type: "article",
    });
    const og = meta.openGraph as Record<string, unknown>;
    const ogImages = og.images as Array<{ url: string }>;
    expect(ogImages[0].url).toBe(`https://eonmun.test${DEFAULT_OG_IMAGE}`);
  });

  it("passes through absolute image URLs unchanged", () => {
    // R2/CDN-hosted post covers are already absolute. Wrapping them in a
    // second URL constructor would produce double-prefixed garbage like
    // https://eonmun.test/https://cdn.example.com/foo.png.
    const meta = buildSocialMetadata({
      title: "Absolute - EONMUN",
      description: "desc",
      image: "https://cdn.example.com/cover.png",
      path: "/posts/absolute",
      type: "article",
    });
    const og = meta.openGraph as Record<string, unknown>;
    const ogImages = og.images as Array<{ url: string }>;
    expect(ogImages[0].url).toBe("https://cdn.example.com/cover.png");
  });

  it("omits publishedTime when not provided (Req 3)", () => {
    const meta = buildSocialMetadata({
      title: "Draft - EONMUN",
      description: "desc",
      path: "/posts/draft",
      type: "article",
    });
    const og = meta.openGraph as Record<string, unknown>;
    expect("publishedTime" in og).toBe(false);
  });

  it("includes publishedTime as og:article:published_time (Req 3)", () => {
    const iso = "2026-04-01T12:34:56.000Z";
    const meta = buildSocialMetadata({
      title: "Dated - EONMUN",
      description: "desc",
      path: "/posts/dated",
      type: "article",
      publishedTime: iso,
    });
    const og = meta.openGraph as Record<string, unknown>;
    expect(og.publishedTime).toBe(iso);
  });

  it("defaults og:type to website when not specified (Req 4)", () => {
    const meta = buildSocialMetadata({
      title: SITE_DEFAULT_DESCRIPTION,
      description: "desc",
      path: "/",
    });
    const og = meta.openGraph as Record<string, unknown>;
    expect(og.type).toBe("website");
  });
});
