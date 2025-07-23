import React from "react";
import { LinkComponent } from "../LinkComponent";
import { SITE_NAME, SOCIAL_TWITTER, SOCIAL_INSTAGRAM } from "@/utils/site";
import { FrostedGlass } from "../ui/FrostedGlass";
import { Twitter, Instagram } from "lucide-react";
import ThemeToggle from "../ThemeToggle";
// import { NotificationsDrawer } from './NotificationsDrawer'

interface HeaderProps {
  homepage?: boolean;
}

export function Header({ homepage = false }: HeaderProps) {
  // Use semantic color tokens for better theme compatibility
  const textColor = homepage ? "text-white" : "text-on-background";
  const linkHoverColor = homepage ? "hover:text-white/80" : "hover:text-primary";
  
  const NavigationContent = () => (
    <>
      <LinkComponent 
        href="/collections" 
        className={`${textColor} ${linkHoverColor} text-xs sm:text-sm transition-colors`}
      >
        Collections
      </LinkComponent>
      <LinkComponent 
        href="/about" 
        className={`${textColor} ${linkHoverColor} text-xs sm:text-sm transition-colors`}
      >
        About
      </LinkComponent>
      <LinkComponent 
        href="/" 
        className={`${textColor} ${linkHoverColor} text-xs sm:text-sm transition-colors`}
      >
        Store
      </LinkComponent>
      <LinkComponent
        href={`https://x.com/${SOCIAL_TWITTER}`}
        className={`flex items-center justify-center ${textColor} ${linkHoverColor} transition-colors`}
      >
        <Twitter className="w-3 h-3" />
      </LinkComponent>
      <LinkComponent
        href={`https://instagram.com/${SOCIAL_INSTAGRAM}`}
        className={`flex items-center justify-center ${textColor} ${linkHoverColor} transition-colors`}
      >
        <Instagram className="w-3 h-3" />
      </LinkComponent>
      <ThemeToggle />
    </>
  );

  return (
    <header className="z-50 p-2 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
      <LinkComponent href="/" className="flex items-center group">
        <h1 className={`tracking-[0.1em] sm:tracking-[0.363636em] text-lg sm:text-2xl lg:text-3xl font-bold ${textColor} transition-colors ${homepage ? 'group-hover:text-white/90' : 'group-hover:text-primary'}`}>
          {SITE_NAME}
        </h1>
      </LinkComponent>

      {homepage ? (
        <FrostedGlass
          className="navbar flex flex-wrap gap-2 sm:gap-4 uppercase justify-between p-2 sm:p-4 rounded-lg font-bold tracking-wider sm:tracking-widest w-full sm:w-auto items-center"
          variant="dark"
        >
          <NavigationContent />
        </FrostedGlass>
      ) : (
        <nav className="flex flex-wrap gap-2 sm:gap-4 uppercase justify-between p-2 sm:p-4 font-bold tracking-wider sm:tracking-widest w-full sm:w-auto items-center">
          <NavigationContent />
        </nav>
      )}
    </header>
  );
}
