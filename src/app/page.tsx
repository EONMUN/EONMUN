import HomePageArtworkCarousel from "@/components/HomePageArtworkCarousel";
import { getHomePageData } from "@/actions/home";

// Curated homepage carousel — admin updates trigger revalidatePath('/'); 60s TTL is the safety net.
export const revalidate = 60;

export default async function Home() {
  const { slides } = await getHomePageData();

  return (
    <div className="absolute inset-0 w-full h-screen">
      <HomePageArtworkCarousel artworks={slides} />
    </div>
  );
}
