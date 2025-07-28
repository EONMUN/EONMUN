import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Layout/Header";

// Use system fonts for now to avoid network issues
const abel = {
  className: "font-sans",
  variable: "--font-abel",
};

export const metadata: Metadata = {
  title: "EONMUN",
  description: "EONMUN Artwork",
  viewport: {
    // width: "device-width",
    // initialScale: 1,
    // maximumScale: 1,
    // userScalable: false,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="manifest.json" />
        
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
