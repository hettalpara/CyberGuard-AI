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

// Map Lucide icons dynamically to names from navigation keys
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "Dashboard": LayoutDashboard,
  "URL Analyzer": Search,
  "AI Assistant": MessageSquare,
  "Reports": FileText,
  "History": History,
  "Recovery Guide": LifeBuoy,
  "Profile": User,
  "Settings": Settings,
};

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

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
            "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all relative group",
            isActive 
              ? "text-primary bg-accent/40" 
              : "text-muted-foreground hover:text-foreground hover:bg-accent/20"
          )}
        >
          {isActive && (
            <motion.div
              layoutId="activeIndicator"
              className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
          <IconComponent className="h-5 w-5 shrink-0" />
          <AnimatePresence mode="wait">
            {(!isCollapsed || isMobileOpen) && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="truncate"
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>
          {isCollapsed && !isMobileOpen && (
            <div className="absolute left-full ml-3 px-2 py-1 bg-popover text-popover-foreground text-xs rounded border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap shadow-md">
              {item.label}
            </div>
          )}
        </Link>
      );
    });
  };

  return (
    <>
      {/* Mobile Top Header */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border sticky top-0 z-40 w-full">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary animate-pulse" />
          <span className="font-bold tracking-tight text-gradient-cyber">CyberGuard AI</span>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleMobile} aria-label="Toggle Menu">
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Base container */}
      <motion.aside
        className={cn(
          "bg-card border-r border-border flex flex-col h-screen fixed lg:sticky top-0 left-0 z-50 transition-all",
          isCollapsed ? "w-20" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        animate={{ width: isCollapsed ? 80 : 256 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between p-4 h-16 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
            <Shield className="h-6 w-6 text-primary shrink-0 animate-pulse" />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-bold tracking-tight text-gradient-cyber whitespace-nowrap"
                >
                  CyberGuard AI
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hidden lg:flex h-7 w-7 text-muted-foreground"
            aria-label="Collapse Sidebar"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {renderNavItems(MAIN_NAV)}
        </nav>

        {/* User Account/Settings Section */}
        <div className="p-3 border-t border-border space-y-1.5">
          {renderNavItems(USER_NAV)}
          <Button
            variant="ghost"
            className={cn(
              "w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive",
              isCollapsed && "lg:justify-center lg:px-0"
            )}
            onClick={() => console.log("Logging out...")}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {(!isCollapsed || isMobileOpen) && <span>Log Out</span>}
          </Button>
        </div>
      </motion.aside>
    </>
  );
}
