"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Search, UserRound } from "lucide-react";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { useAuth } from "@/context/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const q = query.trim();
    if (q.includes(".") || q.startsWith("http")) {
      router.push(`/analyzer?url=${encodeURIComponent(q)}`);
    } else {
      router.push(`/history?search=${encodeURIComponent(q)}`);
    }
    setQuery("");
  };

  const displayName = user?.name || user?.fullName || "Talpara Het";
  const displayEmail = user?.email || "het@cyberguard.ai";

  return (
    <header className="header-cg">
      {/* Global Search Bar */}
      <form onSubmit={handleSearch} className="search-cg">
        <Search size={16} />
        <input 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search scans, reports, URLs..." 
        />
      </form>

      {/* Header Actions */}
      <div className="header-right-cg">
        {/* Dark/Light Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger className="cursor-pointer text-inherit hover:text-white transition-colors relative" aria-label="Notifications">
            <Bell size={18} />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 bg-[var(--panel)] border-[var(--line)] p-0 rounded-lg shadow-xl text-xs">
            <div className="px-3.5 py-2.5 border-b border-[var(--line)] font-bold text-[var(--text)]">
              SECURITY NOTIFICATIONS
            </div>
            <div className="p-3 text-[11px] text-[var(--muted)] space-y-2">
              <div className="p-2 rounded bg-[var(--panel-2)] border border-[var(--line)]">
                <span className="font-semibold text-[var(--text)] block">Threat Intelligence Active</span>
                <span>All threat feeds synchronized.</span>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger className="cursor-pointer focus:outline-none" aria-label="User profile">
            <div className="avatar-cg" style={{ width: 30, height: 30 }}>
              <UserRound size={15} />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 bg-[var(--panel)] border-[var(--line)] p-1 rounded-lg shadow-xl text-xs">
            <DropdownMenuLabel className="px-2.5 py-1.5 font-normal">
              <strong className="block text-[var(--text)]">{displayName}</strong>
              <span className="text-[10px] text-[var(--muted)]">{displayEmail}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[var(--line)]" />
            <Link href="/profile">
              <DropdownMenuItem className="cursor-pointer text-[var(--text)] hover:bg-[var(--panel-2)]">
                Profile
              </DropdownMenuItem>
            </Link>
            <Link href="/settings">
              <DropdownMenuItem className="cursor-pointer text-[var(--text)] hover:bg-[var(--panel-2)]">
                Settings
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator className="bg-[var(--line)]" />
            <DropdownMenuItem 
              onClick={logout}
              className="cursor-pointer text-red-400 hover:bg-red-950/20"
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
