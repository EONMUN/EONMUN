"use client"

import React from "react";
import { LinkComponent } from "../LinkComponent";
import { SITE_NAME, SOCIAL_TWITTER, SOCIAL_INSTAGRAM } from "@/utils/site";
import { FrostedGlass } from "../ui/FrostedGlass";
import { Twitter, Instagram } from "lucide-react";
import ThemeToggle from "../ThemeToggle";
import { usePathname } from "next/navigation";


export function Header() {
  const pathname = usePathname();
  const isHome =  pathname === '/';

  
  const NavigationContent = () => (
    <>
      <LinkComponent 
        href="/collections" 
        className={`text-xs sm:text-sm transition-colors`}
      >
        Collections
      </LinkComponent>
      <LinkComponent 
        href="/about" 
        className={`text-xs sm:text-sm transition-colors`}
      >
        About
      </LinkComponent>
      <LinkComponent 
        href="/" 
        className={`text-xs sm:text-sm transition-colors`}
      >
        Store
      </LinkComponent>
      <LinkComponent
        href={`https://x.com/${SOCIAL_TWITTER}`}
        className={`flex items-center justify-center transition-colors`}
      >
        <Twitter className="w-3 h-3" />
      </LinkComponent>
      <LinkComponent
        href={`https://instagram.com/${SOCIAL_INSTAGRAM}`}
        className={`flex items-center justify-center transition-colors`}
      >
        <Instagram className="w-3 h-3" />
      </LinkComponent>
      {!isHome && <ThemeToggle />}
    </>
  );

  return (
    <nav className="sticky top-0 z-50 p-2 flex justify-between items-center gap-2 bg-transparent backdrop-blur-sm">
      <LinkComponent href="/" className="flex items-center group tracking-[0.1em] sm:tracking-[0.363636em] text-lg sm:text-2xl lg:text-3xl font-bold transition-colors">
          {SITE_NAME}
      </LinkComponent>

      {isHome ? (
        <FrostedGlass
          className="navbar flex flex-wrap gap-2 sm:gap-4 uppercase justify-between p-2 sm:p-4 rounded-lg font-bold tracking-wider sm:tracking-widest w-full sm:w-auto items-center"
          variant="dark"
        >
          <NavigationContent />
        </FrostedGlass>
      ) : (
        <div   className="flex flex-wrap gap-2 sm:gap-4 uppercase justify-between p-2 sm:p-4 font-bold tracking-wider sm:tracking-widest w-full sm:w-auto items-center">
          <NavigationContent />
        </div>
      )}
    </nav>
  );
}
