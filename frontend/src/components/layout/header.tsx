"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { 
  Sun, 
  Moon, 
  Bell, 
  ShieldCheck, 
  User as UserIcon, 
  Settings, 
  LogOut,
  ChevronRight,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";

const PAGE_TITLES: Record<string, { title: string; subtitle?: string }> = {
  "/dashboard": { title: "SOC Overview", subtitle: "Real-time threat posture & scans" },
  "/analyzer": { title: "URL Security Analysis", subtitle: "Multi-vector threat intelligence inspection" },
  "/reports": { title: "Incident Reports", subtitle: "Official forensic documentation & exports" },
  "/history": { title: "Scan History", subtitle: "Timeline of past URL investigations" },
  "/assistant": { title: "AI Security Assistant", subtitle: "Defensive triage & cybercrime guidance" },
  "/recovery-guide": { title: "Incident Recovery Guide", subtitle: "Mitigation workflows & helpline protocols" },
  "/profile": { title: "Analyst Profile", subtitle: "Account credentials & security settings" },
  "/settings": { title: "System Preferences", subtitle: "Threat preferences & UI configurations" },
};

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const displayName = user?.name || user?.fullName || "Security Analyst";
  const displayEmail = user?.email || "analyst@cyberguard.ai";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "SA";

  const currentRouteMeta = PAGE_TITLES[pathname] || {
    title: pathname.replace("/", "").replace(/-/g, " ").toUpperCase() || "CyberGuard",
  };

  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-xs sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Page Title & Breadcrumb */}
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-mono">Platform</span>
            <ChevronRight className="w-3 h-3 text-slate-500" />
            <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
              {currentRouteMeta.title}
            </span>
          </div>
        </div>
      </div>

      {/* Right Actions: System status, Theme switch, Notifications, User Profile */}
      <div className="flex items-center gap-2.5 ml-auto">
        {/* Live System Engine Status */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-[11px] font-mono text-slate-600 dark:text-slate-300">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Threat Engines: Synced</span>
        </div>

        {/* Theme switch */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-md h-8 w-8"
          aria-label="Toggle Theme"
        >
          {mounted && resolvedTheme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {/* System Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex items-center justify-center rounded-md text-xs transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 h-8 w-8 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 relative cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-lg rounded-lg text-xs">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 px-3 py-2">
                SECURITY ALERTS
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-800" />
            <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
              No unresolved high-severity security incidents.
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="relative h-8 w-8 rounded-md cursor-pointer overflow-hidden border border-slate-200 dark:border-slate-800 focus:outline-none">
            <Avatar className="h-8 w-8 rounded-md">
              <AvatarFallback className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-lg rounded-lg p-1 text-xs">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal px-2 py-1.5">
                <div className="flex flex-col space-y-0.5">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{displayName}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">{displayEmail}</p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-800" />
            <Link href="/profile">
              <DropdownMenuItem className="cursor-pointer rounded text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" /> Analyst Profile
              </DropdownMenuItem>
            </Link>
            <Link href="/settings">
              <DropdownMenuItem className="cursor-pointer rounded text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2">
                <Settings className="w-3.5 h-3.5 text-slate-400" /> Settings
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-800" />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="cursor-pointer rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 font-medium"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
