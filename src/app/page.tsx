import { cache } from "react";
import HomePageArtworkCarousel from "@/components/HomePageArtworkCarousel";
import { getHomePageData } from "@/actions/home";
import {
  buildSocialMetadata,
  SITE_DEFAULT_DESCRIPTION,
  SITE_NAME,
} from "@/utils/metadata";

// Edge-cache the homepage for 5 min. Carousel slides change only when an
// admin edits them, so serving cached HTML keeps Turso pressure off the
// Worker under bursts. Was force-dynamic until e70e2ab established the
// pattern on /artworks/[slug] post-PR #74.
export const revalidate = 300;

// Wrap in React cache so generateMetadata and the page component share a
// single DB fetch per request instead of issuing duplicate queries.
const getCachedHomePageData = cache(getHomePageData);

export async function generateMetadata() {
  // Use the first homepage slide as the OG image when available so the
  // shared preview matches what visitors see on the landing page.
  const { slides } = await getCachedHomePageData();
  const heroImage = slides[0]?.defaultImageUrl ?? null;

  return buildSocialMetadata({
    title: SITE_NAME,
    description: SITE_DEFAULT_DESCRIPTION,
    image: heroImage,
    path: "/",
    type: "website",
  });
}

export default async function Home() {
  const { slides } = await getCachedHomePageData();

  return (
    <div className="absolute inset-0 w-full h-screen">
      <HomePageArtworkCarousel artworks={slides} />
    </div>
  );
}
