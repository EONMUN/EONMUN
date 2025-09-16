import type { Metadata } from "next";
import { Abel  } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Layout/Header";
import { CartProvider } from "@/context/CartContext";
import { ShoppingCart } from "@/components/Store/ShoppingCart";

const abel = Abel ({
  variable: "--font-abel",
  subsets: ["latin"],
  weight: ["400"],
});

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
        <CartProvider>
          <Header />
          <main >{children}</main>
          <ShoppingCart />
        </CartProvider>
      </body>
    </html>
  );
}
