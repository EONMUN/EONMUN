import type { NextConfig } from "next";

const nextConfig = (phase: string): NextConfig => {
  return {
    env: {
      NEXT_PHASE: phase,
    },
    /* config options here */
    async rewrites() {
      return [
        {
          source: "/ingest/static/:path*",
          destination: "https://us-assets.i.posthog.com/static/:path*",
        },
        {
          source: "/ingest/:path*",
          destination: "https://us.i.posthog.com/:path*",
        },
        {
          source: "/ingest/decide",
          destination: "https://us.i.posthog.com/decide",
        },
      ];
    },
    skipTrailingSlashRedirect: true,
    serverExternalPackages: ['@libsql/isomorphic-ws'],
  };
};

export default nextConfig;

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
initOpenNextCloudflareForDev();