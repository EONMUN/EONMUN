import HomePageArtworkCarousel from "@/components/HomePageArtworkCarousel";
import { getHomePageData } from "@/actions/home";

// Enable ISR - revalidate every hour
export const revalidate = 3600;

export default async function Home() {
  const { slides } = await getHomePageData();

  return (
    <div className="absolute inset-0 w-full h-screen">
      <HomePageArtworkCarousel artworks={slides} />
    </div>
  );
}
