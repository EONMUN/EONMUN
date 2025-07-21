"use client";

import React, { PropsWithChildren } from "react";
import { usePathname } from "next/navigation";
import { Header } from "./Header";

interface LayoutProps extends PropsWithChildren {
  isHomepage?: boolean;
}

export function Layout({ children, isHomepage }: LayoutProps) {
  const pathname = usePathname();
  
  // If isHomepage prop is not explicitly provided, detect it from pathname
  const isHome = isHomepage !== undefined ? isHomepage : pathname === '/';

  if (isHome) {
    // Homepage layout - header overlays the content
    return (
      <div className="relative min-h-screen">
        <div className="absolute top-0 left-0 right-0 z-50">
          <Header homepage={true} />
        </div>
        {children}
      </div>
    );
  }

  // Regular pages layout - header and main content
  return (
    <div className="flex flex-col min-h-screen">
      <Header homepage={false} />
      <main className="grow px-4 py-8 container mx-auto">{children}</main>
      {/* <Footer /> */}
    </div>
  );
}
