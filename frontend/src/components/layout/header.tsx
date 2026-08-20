"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon, Bell, ShieldCheck, Activity, User as UserIcon, Settings, LogOut } from "lucide-react";
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

export function Header() {
  const router = useRouter();
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

  const displayName = user?.name || user?.fullName || "Analyst";
  const displayEmail = user?.email || "analyst@cyberguard.ai";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "CG";

  return (
    <header className="h-16 border-b border-[#E5E7EB] bg-white sticky top-0 z-30 flex items-center justify-between px-6">
      {/* Platform Status Indicators */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
          <ShieldCheck className="h-3.5 w-3.5 text-[#10B981]" />
          <span>Gemini AI Engine: Active</span>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-50 text-slate-600 border border-[#E5E7EB] rounded-full text-xs font-semibold">
          <Activity className="h-3.5 w-3.5 text-[#10B981]" />
          <span>Threat Databases: Synced</span>
        </div>
      </div>

      {/* Action controls */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Theme switch */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="text-slate-500 hover:text-slate-900 rounded-xl h-9 w-9"
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
            className="inline-flex items-center justify-center rounded-xl text-xs font-medium transition-colors hover:bg-slate-100 h-9 w-9 text-slate-500 hover:text-slate-900 relative cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#10B981]" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 bg-white border-[#E5E7EB] shadow-md rounded-xl">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs font-bold text-[#1F2937]">System Notifications</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-[#E5E7EB]" />
            <div className="p-4 text-center text-xs text-slate-500">
              No recent high-severity phishing threats detected.
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Avatar Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="relative h-9 w-9 rounded-full cursor-pointer overflow-hidden border border-[#E5E7EB] focus:outline-none">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-emerald-100 text-[#10B981] font-bold text-xs">{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white border-[#E5E7EB] shadow-md rounded-xl p-1 text-xs">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal px-2 py-1.5">
                <div className="flex flex-col space-y-0.5">
                  <p className="text-xs font-bold text-[#1F2937]">{displayName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{displayEmail}</p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-[#E5E7EB]" />
            <Link href="/profile">
              <DropdownMenuItem className="cursor-pointer rounded-lg text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" /> Account Profile
              </DropdownMenuItem>
            </Link>
            <Link href="/settings">
              <DropdownMenuItem className="cursor-pointer rounded-lg text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                <Settings className="w-3.5 h-3.5 text-slate-400" /> Settings
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator className="bg-[#E5E7EB]" />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="cursor-pointer rounded-lg text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
            >
              <LogOut className="w-3.5 h-3.5" /> Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
