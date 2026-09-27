"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

/**
 * Enterprise SOC Modern Theme Toggle Switch: [ 🌙 ━━━● ] / [ ●━━━ ☀ ]
 * Fully accessible, smooth animated transition, persisted in localStorage.
 */
export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  const toggleTheme = () => {
    const nextTheme = isDark ? "light" : "dark";
    setTheme(nextTheme);
    try {
      localStorage.setItem("cyberguard-theme", nextTheme);
      if (nextTheme === "light") {
        document.documentElement.classList.add("light");
      } else {
        document.documentElement.classList.remove("light");
      }
    } catch {}
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleTheme();
    }
  };

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "Currently in Dark Mode. Click for Light Mode." : "Currently in Light Mode. Click for Dark Mode."}
        onClick={toggleTheme}
        onKeyDown={handleKeyDown}
        className={cn(
          "group relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full p-0.5",
          "border border-border transition-colors duration-300 ease-in-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isDark 
            ? "bg-[#0E1D32] hover:bg-[#132742]" 
            : "bg-[#E2E8F0] hover:bg-[#CBD5E1]"
        )}
      >
        {/* Track icons */}
        <div className="absolute inset-0 flex items-center justify-between px-1.5 pointer-events-none select-none">
          <Moon className={cn("h-3.5 w-3.5 transition-opacity", isDark ? "text-primary-blue opacity-100" : "opacity-30 text-slate-400")} />
          <Sun className={cn("h-3.5 w-3.5 transition-opacity", !isDark ? "text-amber-500 opacity-100" : "opacity-30 text-slate-500")} />
        </div>

        {/* Sliding Thumb */}
        <span
          className={cn(
            "pointer-events-none flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-[#07101F] shadow-md ring-0",
            "border border-slate-300 dark:border-[#1B2B42]",
            "transform transition-transform duration-300 ease-in-out",
            isDark ? "translate-x-7" : "translate-x-0"
          )}
        >
          {isDark ? (
            <Moon className="h-3 w-3 text-primary-blue" />
          ) : (
            <Sun className="h-3 w-3 text-amber-500" />
          )}
        </span>
      </button>

      {showLabel && (
        <span className="text-xs font-mono font-medium text-text-secondary select-none">
          {isDark ? "Dark" : "Light"}
        </span>
      )}
    </div>
  );
}

/**
 * Segmented Theme Selector for Settings Page: [ Dark ] [ Light ]
 */
export function ThemeSegmentedControl({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  const applyTheme = (targetTheme: "dark" | "light") => {
    setTheme(targetTheme);
    try {
      localStorage.setItem("cyberguard-theme", targetTheme);
      if (targetTheme === "light") {
        document.documentElement.classList.add("light");
      } else {
        document.documentElement.classList.remove("light");
      }
    } catch {}
  };

  return (
    <div className={cn("inline-flex items-center p-1 rounded-lg border border-border bg-card-elevated", className)}>
      <button
        type="button"
        onClick={() => applyTheme("dark")}
        aria-pressed={isDark}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer",
          isDark
            ? "bg-primary-blue text-white shadow-xs"
            : "text-text-secondary hover:text-text-primary hover:bg-muted"
        )}
      >
        <Moon className="h-3.5 w-3.5" />
        <span>Dark Mode</span>
      </button>

      <button
        type="button"
        onClick={() => applyTheme("light")}
        aria-pressed={!isDark}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer",
          !isDark
            ? "bg-primary-blue text-white shadow-xs"
            : "text-text-secondary hover:text-text-primary hover:bg-muted"
        )}
      >
        <Sun className="h-3.5 w-3.5" />
        <span>Light Mode</span>
      </button>
    </div>
  );
}
