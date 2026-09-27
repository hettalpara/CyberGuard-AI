"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Shield, 
  LayoutDashboard, 
  Link2, 
  FileText, 
  History, 
  Bot, 
  LifeBuoy, 
  FolderLock, 
  Scale, 
  Settings, 
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/analyzer", icon: Link2, label: "URL Scanner" },
  { href: "/reports", icon: FileText, label: "Reports" },
  { href: "/history", icon: History, label: "Scan History" },
  { href: "/assistant", icon: Bot, label: "AI Assistant" },
  { href: "/recovery-guide", icon: LifeBuoy, label: "Recovery Guide" },
  { href: "/evidence", icon: FolderLock, label: "Evidence" },
  { href: "/cyber-law", icon: Scale, label: "Cyber Law Info" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  const displayName = user?.name || user?.fullName || "Talpara Het";
  const displayRole = user?.role ? (user.role === "student" ? "24DCS132" : String(user.role).toUpperCase()) : "24DCS132";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "T";

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[var(--sidebar-bg)] border-b border-[var(--line)] sticky top-0 z-40 w-full">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="logo-cg" style={{ width: 28, height: 28, borderRadius: 8 }}>
            <Shield size={16} />
          </div>
          <strong style={{ fontSize: 14 }}>CyberGuard AI</strong>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="btn-cg"
          style={{ padding: "6px 8px" }}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside className={`sidebar-cg ${mobileOpen ? "open" : ""}`}>
        <div className="brand-cg">
          <div className="logo-cg">
            <Shield size={21} />
          </div>
          <div>
            <strong>CyberGuard AI</strong>
            <span>AI Cyber Crime Assistance Platform</span>
          </div>
        </div>

        <nav className="nav-cg">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href === "/dashboard" && pathname === "/") ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={isActive ? "active" : ""}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="section-cg">System</div>
          <Link 
            href="/settings"
            onClick={() => setMobileOpen(false)}
            className={pathname === "/settings" ? "active" : ""}
          >
            <Settings size={17} />
            <span>Settings</span>
          </Link>
        </nav>

        {/* User Profile Card */}
        <Link 
          href="/profile" 
          onClick={() => setMobileOpen(false)}
          className="profile-cg"
          style={{ textDecoration: "none" }}
        >
          <div className="avatar-cg">{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong style={{ fontSize: 11, display: "block", color: "var(--text)" }} className="truncate">
              {displayName}
            </strong>
            <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 3 }}>
              {displayRole}
            </div>
          </div>
          <span style={{ color: "var(--muted)", fontSize: 14 }}>›</span>
        </Link>

        {/* Logout action */}
        <div 
          onClick={handleLogout}
          style={{
            padding: "0 18px 18px",
            fontSize: 11,
            color: "var(--muted)",
            display: "flex",
            gap: 9,
            alignItems: "center",
            cursor: "pointer"
          }}
          className="hover:text-red-400 transition-colors"
        >
          <LogOut size={15} /> 
          <span>Logout</span>
        </div>
      </aside>
    </>
  );
}
