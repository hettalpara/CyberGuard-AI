"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Shield, 
  ChevronLeft, 
  Menu, 
  LayoutDashboard, 
  Search, 
  MessageSquare, 
  FileText, 
  History, 
  LifeBuoy, 
  User, 
  Settings,
  LogOut,
  X,
  Radio
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MAIN_NAV, USER_NAV } from "@/constants/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "Dashboard": LayoutDashboard,
  "URL Scanner": Search,
  "Smart URL Analyzer": Search,
  "AI Assistant": MessageSquare,
  "Reports": FileText,
  "Scan History": History,
  "Recovery Guide": LifeBuoy,
  "Settings": Settings,
  "Profile": User,
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  const handleLogout = async () => {
    await logout();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  const displayName = user?.name || user?.fullName || "Security Analyst";
  const displayEmail = user?.email || "analyst@cyberguard.ai";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "SA";

  const renderNavItems = (navItems: typeof MAIN_NAV) => {
    return navItems.map((item) => {
      const IconComponent = iconMap[item.label] || Shield;
      const isActive =
        pathname === item.href ||
        (item.href !== "/dashboard" && pathname.startsWith(item.href));

      return (
        <div key={item.href} className="relative group">
          <Link
            href={item.href}
            onClick={() => setIsMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all select-none",
              isActive
                ? "bg-emerald-500/15 text-emerald-400 font-semibold border-l-2 border-emerald-400 pl-[10px]"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
            )}
          >
            <IconComponent
              className={cn(
                "h-4 w-4 shrink-0 transition-colors",
                isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-200"
              )}
            />
            {(!isCollapsed || isMobileOpen) && (
              <span className="truncate">{item.label}</span>
            )}
          </Link>

          {/* Floating Tooltip when collapsed on desktop */}
          {isCollapsed && !isMobileOpen && (
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-slate-100 text-[11px] font-semibold rounded-md border border-slate-700 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
              {item.label}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#0B0F19] text-white border-b border-slate-800 sticky top-0 z-40 w-full">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/15 text-emerald-400 rounded-md border border-emerald-500/30">
            <Shield className="h-4 w-4" />
          </div>
          <span className="font-bold tracking-tight text-sm text-white font-mono">CyberGuard AI</span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">SOC</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMobile}
          aria-label={isMobileOpen ? "Close menu" : "Open menu"}
          className="text-slate-300 hover:text-white hover:bg-slate-800 h-8 w-8"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "bg-[#0B0F19] text-slate-200 border-r border-slate-800/80 flex flex-col h-screen fixed lg:sticky top-0 left-0 z-50 transition-all duration-200 ease-in-out",
          isCollapsed ? "w-[68px]" : "w-60",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-slate-800/80">
          <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-1.5 bg-emerald-500/15 text-emerald-400 rounded-md border border-emerald-500/30 shrink-0">
              <Shield className="h-4 w-4" />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold tracking-tight text-xs text-white font-mono">CYBERGUARD</span>
                  <span className="text-[9px] uppercase font-mono font-bold px-1 py-0.2 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">AI</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">SOC Defense Platform</span>
              </div>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hidden lg:flex h-6 w-6 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded"
            aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <ChevronLeft className={cn("h-3.5 w-3.5 transition-transform", isCollapsed && "rotate-180")} />
          </Button>
        </div>

        {/* Live Status indicator */}
        {(!isCollapsed || isMobileOpen) && (
          <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-mono text-[10px]">THREAT ENGINE ONLINE</span>
            </span>
          </div>
        )}

        {/* Main Navigation */}
        <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
          {renderNavItems(MAIN_NAV)}
        </nav>

        {/* User Account / Bottom Section */}
        <div className="p-2.5 border-t border-slate-800/80 space-y-1 bg-[#090D15]">
          {/* User profile link */}
          <Link
            href="/profile"
            onClick={() => setIsMobileOpen(false)}
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800/60 transition",
              pathname === "/profile" && "bg-slate-800/80 text-white"
            )}
            title={isCollapsed ? displayName : undefined}
          >
            <Avatar className="h-7 w-7 rounded-md border border-slate-700 shrink-0">
              <AvatarFallback className="bg-emerald-950 text-emerald-400 text-[10px] font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold text-slate-200 truncate">{displayName}</span>
                <span className="text-[10px] text-slate-500 truncate font-mono">{displayEmail}</span>
              </div>
            )}
          </Link>

          {/* Logout button */}
          <Button
            variant="ghost"
            className={cn(
              "w-full flex items-center justify-start gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-400/90 hover:bg-red-950/30 hover:text-red-300 transition h-8",
              isCollapsed && !isMobileOpen && "justify-center px-0"
            )}
            onClick={handleLogout}
            title={isCollapsed ? "Log Out" : undefined}
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            {(!isCollapsed || isMobileOpen) && <span>Sign Out</span>}
          </Button>
        </div>
      </aside>
    </>
  );
}
