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
  Fingerprint,
  Scale
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MAIN_NAV, SETTINGS_NAV } from "@/constants/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "Dashboard": LayoutDashboard,
  "URL Scanner": Search,
  "Reports": FileText,
  "Scan History": History,
  "AI Assistant": MessageSquare,
  "Recovery Guide": LifeBuoy,
  "Evidence": Fingerprint,
  "Cyber Law Info": Scale,
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
  const displayRole = user?.role ? (user.role === "student" ? "Cyber Student / Analyst" : String(user.role).toUpperCase()) : "Security Analyst";
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
              "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue",
              isActive
                ? "bg-primary-blue/15 text-primary-blue font-semibold border-l-2 border-primary-blue pl-[10px]"
                : "text-text-secondary hover:text-text-primary hover:bg-muted"
            )}
          >
            <IconComponent
              className={cn(
                "h-4 w-4 shrink-0 transition-colors",
                isActive ? "text-primary-blue" : "text-text-secondary group-hover:text-text-primary"
              )}
            />
            {(!isCollapsed || isMobileOpen) && (
              <span className="truncate">{item.label}</span>
            )}
          </Link>

          {/* Floating Tooltip when collapsed on desktop */}
          {isCollapsed && !isMobileOpen && (
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-card text-text-primary text-[11px] font-semibold rounded-md border border-border shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
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
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-sidebar text-text-primary border-b border-border sticky top-0 z-40 w-full">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="p-1.5 bg-primary-blue/15 text-primary-blue rounded-md border border-primary-blue/30">
            <Shield className="h-4 w-4" />
          </div>
          <span className="font-bold tracking-tight text-sm font-mono text-text-primary">CyberGuard AI</span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted text-text-secondary border border-border">SOC</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMobile}
          aria-label={isMobileOpen ? "Close menu" : "Open menu"}
          className="text-text-secondary hover:text-text-primary hover:bg-muted h-8 w-8"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "bg-sidebar text-text-primary border-r border-sidebar-border flex flex-col h-screen fixed lg:sticky top-0 left-0 z-50 transition-all duration-200 ease-in-out",
          isCollapsed ? "w-[68px]" : "w-60",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-sidebar-border">
          <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-1.5 bg-primary-blue/15 text-primary-blue rounded-md border border-primary-blue/30 shrink-0">
              <Shield className="h-4 w-4" />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold tracking-tight text-xs font-mono text-text-primary">CyberGuard AI</span>
                  <span className="text-[9px] uppercase font-mono font-bold px-1 py-0.2 rounded bg-primary-blue/15 text-primary-blue border border-primary-blue/30">SOC</span>
                </div>
                <span className="text-[10px] text-text-secondary truncate">AI Cyber Crime Assistance Platform</span>
              </div>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hidden lg:flex h-6 w-6 text-text-secondary hover:text-text-primary hover:bg-muted rounded"
            aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <ChevronLeft className={cn("h-3.5 w-3.5 transition-transform", isCollapsed && "rotate-180")} />
          </Button>
        </div>

        {/* Live Status indicator */}
        {(!isCollapsed || isMobileOpen) && (
          <div className="px-4 py-2 bg-muted/60 border-b border-sidebar-border flex items-center justify-between text-[11px] text-text-secondary">
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-mono text-[10px] uppercase font-medium">THREAT ENGINE READY</span>
            </span>
          </div>
        )}

        {/* Main Navigation */}
        <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto">
          {renderNavItems(MAIN_NAV)}

          {/* Divider */}
          <div className="pt-2 pb-1">
            <div className="h-px bg-sidebar-border w-full" />
          </div>

          {/* Settings Nav */}
          {renderNavItems(SETTINGS_NAV)}
        </nav>

        {/* User Account / Bottom Section */}
        <div className="p-2.5 border-t border-sidebar-border space-y-1 bg-muted/30">
          {/* User profile link */}
          <Link
            href="/profile"
            onClick={() => setIsMobileOpen(false)}
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-muted transition",
              pathname === "/profile" && "bg-muted text-text-primary"
            )}
            title={isCollapsed ? displayName : undefined}
          >
            <Avatar className="h-7 w-7 rounded-md border border-border shrink-0">
              <AvatarFallback className="bg-primary-blue/20 text-primary-blue text-[10px] font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold text-text-primary truncate">{displayName}</span>
                <span className="text-[10px] text-text-secondary truncate font-mono">{displayRole}</span>
              </div>
            )}
          </Link>

          {/* Logout button */}
          <Button
            variant="ghost"
            className={cn(
              "w-full flex items-center justify-start gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-danger hover:bg-danger/10 hover:text-danger transition h-8 cursor-pointer",
              isCollapsed && !isMobileOpen && "justify-center px-0"
            )}
            onClick={handleLogout}
            title={isCollapsed ? "Log Out" : undefined}
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            {(!isCollapsed || isMobileOpen) && <span>Logout</span>}
          </Button>
        </div>
      </aside>
    </>
  );
}
