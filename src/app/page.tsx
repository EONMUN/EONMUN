import HomePageArtworkCarousel from "@/components/HomePageArtworkCarousel";
import { getHomePageData } from "@/actions/home";

// Force dynamic rendering - disable build-time caching
export const dynamic = 'force-dynamic';

export default async function Home() {
  const { slides } = await getHomePageData();

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 w-screen h-[100dvh] bg-black overflow-hidden">
      <HomePageArtworkCarousel artworks={slides} />
    </div>
  );
}
