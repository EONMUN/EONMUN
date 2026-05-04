import HomePageArtworkCarousel from "@/components/HomePageArtworkCarousel";
import { getHomePageData } from "@/actions/home";
import {
  buildSocialMetadata,
  SITE_DEFAULT_DESCRIPTION,
  SITE_NAME,
} from "@/utils/metadata";

// Force dynamic rendering - disable build-time caching
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  // Use the first homepage slide as the OG image when available so the
  // shared preview matches what visitors see on the landing page.
  const { slides } = await getHomePageData();
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
  const { slides } = await getHomePageData();

  return (
    <div className="absolute inset-0 w-full h-screen">
      <HomePageArtworkCarousel artworks={slides} />
    </div>
  );
}
