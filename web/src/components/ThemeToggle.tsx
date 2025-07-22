"use client";

import { useState, useEffect } from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

export default function ThemeToggle() {
  const [colorScheme, setColorScheme] = useState<"light" | "dark" | undefined>();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const storedColorScheme = localStorage.getItem("color-scheme");
    if (storedColorScheme) {
      setColorScheme(storedColorScheme as "light" | "dark");
      document.documentElement.classList.add(storedColorScheme);
    } else {
      const systemPreference = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      setColorScheme(systemPreference);
      document.documentElement.classList.add(systemPreference);
    }
  }, []);

  const toggleDarkMode = () => {
    if (!colorScheme) return;
    
    const newColorScheme = colorScheme === "light" ? "dark" : "light";
    setColorScheme(newColorScheme);
    document.documentElement.classList.add(newColorScheme);
    document.documentElement.classList.remove(colorScheme);
    localStorage.setItem("color-scheme", newColorScheme);
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted || !colorScheme) {
    return (
      <div className="p-2 rounded-full bg-primary-container text-on-primary-container w-9 h-9" />
    );
  }

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-full bg-primary-container text-on-primary-container hover:bg-primary-container/80 transition-colors"
      aria-label="Toggle dark mode"
    >
      {colorScheme === "light" ? (
        <MoonIcon className="h-5 w-5" />
      ) : (
        <SunIcon className="h-5 w-5" />
      )}
    </button>
  );
} 