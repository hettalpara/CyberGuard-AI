"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Bell, 
  ShieldCheck, 
  User as UserIcon, 
  Settings, 
  LogOut,
  ChevronRight,
  Search,
  ExternalLink
} from "lucide-react";
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
import { ThemeToggle } from "@/components/common/theme-toggle";

const PAGE_TITLES: Record<string, { title: string; subtitle?: string }> = {
  "/dashboard": { title: "Security Overview", subtitle: "Monitor URL analysis, threat intelligence and incident activity" },
  "/analyzer": { title: "URL Security Analysis", subtitle: "Multi-vector threat intelligence and AI-powered security analysis" },
  "/reports": { title: "Incident Reports", subtitle: "Official forensic documentation & downloadable reports" },
  "/history": { title: "Scan History", subtitle: "Timeline and repository of historical security investigations" },
  "/assistant": { title: "AI Security Assistant", subtitle: "Defensive triage, scam response and forensic consultation" },
  "/recovery-guide": { title: "Incident Recovery Guide", subtitle: "Immediate containment protocols and defensive playbooks" },
  "/evidence": { title: "Forensic Evidence", subtitle: "Cryptographic hash verification and chain-of-custody logging" },
  "/cyber-law": { title: "Cyber Law & Reporting", subtitle: "Statutory frameworks, IT Act provisions and reporting guidelines" },
  "/profile": { title: "Analyst Profile", subtitle: "Account credentials and security privileges" },
  "/settings": { title: "Settings", subtitle: "System configurations and appearance preferences" },
};

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [quickQuery, setQuickQuery] = useState("");

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickQuery.trim()) return;
    const trimmed = quickQuery.trim();
    // If it looks like a URL or domain, route straight to analyzer with query
    if (trimmed.includes(".") || trimmed.startsWith("http")) {
      router.push(`/analyzer?url=${encodeURIComponent(trimmed)}`);
    } else {
      router.push(`/history?search=${encodeURIComponent(trimmed)}`);
    }
    setQuickQuery("");
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
    <header className="h-14 border-b border-border bg-card/95 backdrop-blur-xs sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 transition-colors">
      {/* Page Title & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-text-secondary font-mono">Platform</span>
          <ChevronRight className="w-3.5 h-3.5 text-text-secondary/60" />
          <span className="font-semibold text-text-primary font-mono truncate">
            {currentRouteMeta.title}
          </span>
        </div>
      </div>

      {/* Center / Global Search Bar */}
      <div className="hidden lg:flex items-center flex-1 max-w-md mx-6">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary pointer-events-none" />
          <input
            type="text"
            value={quickQuery}
            onChange={(e) => setQuickQuery(e.target.value)}
            placeholder="Quick analyze URL or search scans..."
            className="w-full h-8 pl-8 pr-12 text-xs bg-muted/60 border border-border rounded-md text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary-blue focus:border-primary-blue transition-colors"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[9px] font-mono font-medium text-text-secondary bg-card border border-border rounded pointer-events-none">
            ↵ Enter
          </kbd>
        </form>
      </div>

      {/* Right Actions: System status, Theme switch, Notifications, User Profile */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Live Threat Intelligence Status */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-muted/50 border border-border rounded-md text-[11px] font-mono text-text-secondary">
          <ShieldCheck className="h-3.5 w-3.5 text-success" />
          <span>Providers: Online</span>
        </div>

        {/* Global Dark / Light Theme Toggle Switch */}
        <div className="flex items-center border-l border-border pl-3">
          <ThemeToggle />
        </div>

        {/* System Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex items-center justify-center rounded-md text-xs transition-colors hover:bg-muted h-8 w-8 text-text-secondary hover:text-text-primary relative cursor-pointer"
            aria-label="Security notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-success ring-2 ring-card" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-card border-border shadow-xl rounded-lg text-xs p-0 overflow-hidden">
            <div className="px-3.5 py-2.5 border-b border-border bg-muted/40 flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-text-primary">SECURITY NOTIFICATIONS</span>
              <span className="text-[10px] text-text-secondary font-mono">SOC FEEDS</span>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-start gap-2.5 p-2 rounded bg-muted/40 border border-border/60">
                <span className="h-2 w-2 rounded-full bg-success mt-1 shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-[11px] font-semibold text-text-primary">Threat Intelligence Active</p>
                  <p className="text-[10px] text-text-secondary">Safe Browsing, VirusTotal & URLhaus feeds are synchronized.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-2 rounded bg-muted/40 border border-border/60">
                <span className="h-2 w-2 rounded-full bg-primary-blue mt-1 shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-[11px] font-semibold text-text-primary">AI Advisory Ready</p>
                  <p className="text-[10px] text-text-secondary">Gemini security synthesis is operational for threat triage.</p>
                </div>
              </div>
            </div>
            <div className="px-3.5 py-2 border-t border-border bg-muted/20 text-center">
              <Link href="/analyzer" className="text-[11px] text-primary-blue hover:underline inline-flex items-center gap-1 font-medium">
                Run security scan <ExternalLink className="h-2.5 w-2.5" />
              </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="relative h-8 w-8 rounded-md cursor-pointer overflow-hidden border border-border focus:outline-none focus:ring-2 focus:ring-primary-blue">
            <Avatar className="h-8 w-8 rounded-md">
              <AvatarFallback className="bg-primary-blue/20 text-primary-blue font-bold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card border-border shadow-xl rounded-lg p-1 text-xs">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal px-2.5 py-2">
                <div className="flex flex-col space-y-0.5">
                  <p className="text-xs font-bold text-text-primary">{displayName}</p>
                  <p className="text-[11px] text-text-secondary truncate font-mono">{displayEmail}</p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-border" />
            <Link href="/profile">
              <DropdownMenuItem className="cursor-pointer rounded text-text-secondary hover:text-text-primary hover:bg-muted flex items-center gap-2">
                <UserIcon className="w-3.5 h-3.5 text-text-secondary" /> Profile
              </DropdownMenuItem>
            </Link>
            <Link href="/settings">
              <DropdownMenuItem className="cursor-pointer rounded text-text-secondary hover:text-text-primary hover:bg-muted flex items-center gap-2">
                <Settings className="w-3.5 h-3.5 text-text-secondary" /> Settings
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="cursor-pointer rounded text-danger hover:bg-danger/10 flex items-center gap-2 font-medium"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
