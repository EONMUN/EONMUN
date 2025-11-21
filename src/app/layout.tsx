import type { Metadata } from "next";
import { Abel  } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Layout/Header";

const abel = Abel ({
  variable: "--font-abel",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "EONMUN",
  description: "EONMUN Artwork",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />

      </head>
      <body
        className={`${abel.className} antialiased`}
      >
          <Header />
          <main >{children}</main>
      </body>
    </html>
  );
}
