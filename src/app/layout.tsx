import type { Metadata, Viewport } from "next";
import { Abel } from "next/font/google";
import { GoogleTagManager } from "@next/third-parties/google";
import "./globals.css";
import { Header } from "@/components/Layout/Header";
import AuthProvider from "@/components/AuthProvider";
import PostHogIdentifier from "@/components/PostHogIdentifier";
import {
  DEFAULT_OG_IMAGE,
  SITE_DEFAULT_DESCRIPTION,
  SITE_NAME,
  getSiteUrl,
} from "@/utils/metadata";

const abel = Abel({
  variable: "--font-abel",
  subsets: ["latin"],
  weight: ["400"],
});

// metadataBase resolves any relative metadata URLs (e.g. og:image) to
// absolute URLs at render time. Without it Next.js logs warnings and
// scrapers reject the tags. Page-level generateMetadata supplies full
// titles via @/utils/metadata so no title template is set here — that
// avoids the "Title - EONMUN - EONMUN" doubling that occurs when a
// page builder (like buildSocialMetadata) already includes the suffix.
export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: SITE_NAME,
  description: SITE_DEFAULT_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DEFAULT_DESCRIPTION,
    images: [{ url: DEFAULT_OG_IMAGE, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// NOTE: previously this layout exported `dynamic = "force-dynamic"`, which
// opted every route in the app out of edge caching by default. That was
// the root cause behind the /artworks/[slug] 500 storm after PR #74 —
// every concurrent visitor hammered Turso through the module-scoped libSQL
// singleton instead of being served cached HTML from the edge. Each route
// now opts into its own revalidate cadence; admin routes still set
// force-dynamic explicitly where fresh data + auth checks are required.

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <GoogleTagManager gtmId="GTM-WPDKWVN5" />
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${abel.className} antialiased`}>
        <AuthProvider>
          <PostHogIdentifier />
          <Header />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
