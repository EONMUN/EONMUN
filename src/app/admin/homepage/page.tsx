import { getHomepageArtworks } from "@/models/homepage-artworks";
import { findArtworks } from "@/models/artwork";
import HomepageArtworksManager from "./HomepageArtworksManager";

export const dynamic = "force-dynamic";

export default async function HomepageAdminPage() {
  // Get current homepage artworks
  const currentHomepageArtworks = await getHomepageArtworks();

  // Get all published artworks for selection
  const allArtworks = await findArtworks({ published: true });

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-on-background">
          Homepage Configuration
        </h1>
        <p className="text-on-surface-variant mt-2">
          Select and order artworks to display on the homepage carousel
        </p>
      </div>

      <HomepageArtworksManager
        currentArtworks={currentHomepageArtworks}
        allArtworks={allArtworks}
      />
    </div>
  );
}
