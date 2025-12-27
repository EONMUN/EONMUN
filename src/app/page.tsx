import HomePageArtworkCarousel from "@/components/HomePageArtworkCarousel";
import { getHomePageData } from "@/actions/home";

export default async function Home() {
  const { slides } = await getHomePageData();

  return (
    <div className="absolute inset-0 w-full h-dvh">
      <HomePageArtworkCarousel artworks={slides} />
    </div>
  );
}
