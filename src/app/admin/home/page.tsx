import {
  getHomePageArtworksAdmin,
  getAvailableArtworksForHomeAdmin,
} from "@/actions/admin/home";
import HomePageOrderManager from "./HomePageOrderManager";

export default async function AdminHomePage() {
  const [homeArtworksResult, availableArtworksResult] = await Promise.all([
    getHomePageArtworksAdmin(),
    getAvailableArtworksForHomeAdmin(),
  ]);

  const homeArtworks = homeArtworksResult.data ?? [];
  const availableArtworks = availableArtworksResult.data ?? [];

  // Filter out artworks that are already on the home page from available list
  const homeArtworkIds = new Set(homeArtworks.map((a) => a.id));
  const notOnHomePage = availableArtworks.filter(
    (a) => !homeArtworkIds.has(a.id),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">
          Home Page Settings
        </h1>
        <p className="text-on-surface-variant mt-1">
          Manage which artworks appear on the home page carousel and their
          order.
        </p>
      </div>

      <HomePageOrderManager
        initialHomeArtworks={homeArtworks}
        availableArtworks={notOnHomePage}
      />
    </div>
  );
}
