"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MAIN_NAV, USER_NAV } from "@/constants/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "Dashboard": LayoutDashboard,
  "Smart URL Analyzer": Search,
  "AI Assistant": MessageSquare,
  "Reports": FileText,
  "Scan History": History,
  "Recovery Guide": LifeBuoy,
  "Profile": User,
  "Settings": Settings,
};

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
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

  const renderNavItems = (navItems: typeof MAIN_NAV) => {
    return navItems.map((item) => {
      const IconComponent = iconMap[item.label] || Shield;
      const isActive = pathname === item.href;

      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setIsMobileOpen(false)}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative group",
            isActive 
              ? "text-white bg-[#10B981]" 
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          )}
        >
          <IconComponent className="h-4 w-4 shrink-0" />
          <AnimatePresence mode="wait">
            {(!isCollapsed || isMobileOpen) && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
                className="truncate"
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>
          {isCollapsed && !isMobileOpen && (
            <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[11px] rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap shadow-md">
              {item.label}
            </div>
          )}
        </Link>
      );
    });
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#111827] text-white border-b border-slate-800 sticky top-0 z-40 w-full">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-[#10B981]" />
          <span className="font-bold tracking-tight text-sm text-white">CyberGuard AI</span>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleMobile} aria-label="Toggle Menu" className="text-slate-300 hover:text-white hover:bg-slate-800">
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Base container */}
      <aside
        className={cn(
          "bg-[#111827] text-white border-r border-slate-800 flex flex-col h-screen fixed lg:sticky top-0 left-0 z-50 transition-all duration-300",
          isCollapsed ? "w-20" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between p-4 h-16 border-b border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-1.5 bg-[#10B981]/20 rounded-lg border border-[#10B981]/40 shrink-0">
              <Shield className="h-5 w-5 text-[#10B981]" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold tracking-tight text-sm text-white whitespace-nowrap">CyberGuard AI</span>
                <span className="text-[10px] text-emerald-400 font-medium whitespace-nowrap">Phishing URL Platform</span>
              </div>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hidden lg:flex h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Collapse Sidebar"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
          </Button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {renderNavItems(MAIN_NAV)}
        </nav>

        {/* User Account / Footer Actions */}
        <div className="p-3 border-t border-slate-800 space-y-1.5">
          {renderNavItems(USER_NAV)}
          <Button
            variant="ghost"
            className={cn(
              "w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300",
              isCollapsed && "lg:justify-center lg:px-0"
            )}
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {(!isCollapsed || isMobileOpen) && <span>Log Out</span>}
          </Button>
        </div>
      </aside>
    </>
  );
}
