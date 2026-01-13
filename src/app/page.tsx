import HomePageArtworkCarousel from "@/components/HomePageArtworkCarousel";
import { getHomePageData } from "@/actions/home";

// Force dynamic rendering - disable build-time caching
export const dynamic = 'force-dynamic';

export default async function Home() {
  const { slides } = await getHomePageData();

  return (
    <div className="absolute inset-0 w-full h-screen">
      <HomePageArtworkCarousel artworks={slides} />
    </div>
  );
}
