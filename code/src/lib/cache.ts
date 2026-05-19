// Single source of truth for the SSR cache TTLs. The legacy Next.js app
// uses `revalidate = 60` for fast-moving listings (posts feed, store) and
// `revalidate = 300` for stable detail pages — replicate that here.
import type { AstroGlobal } from "astro";

const STANDARD = "public, s-maxage=300, stale-while-revalidate=600";
const SHORT = "public, s-maxage=60, stale-while-revalidate=300";

export function setEdgeCache(astro: AstroGlobal, variant: "standard" | "short" = "standard") {
	astro.response.headers.set(
		"Cache-Control",
		variant === "short" ? SHORT : STANDARD,
	);
}
