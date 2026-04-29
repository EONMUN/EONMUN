import type { Metadata, Viewport } from "next";
import { Abel } from "next/font/google";
import { GoogleTagManager } from "@next/third-parties/google";
import "./globals.css";
import { Header } from "@/components/Layout/Header";
import AuthProvider from "@/components/AuthProvider";
import PostHogIdentifier from "@/components/PostHogIdentifier";

const abel = Abel({
  variable: "--font-abel",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "EONMUN",
  description: "EONMUN Artwork",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

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
