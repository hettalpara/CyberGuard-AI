"use client";

import React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Bell, ShieldCheck, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="h-16 border-b border-border bg-card/65 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
      {/* System Status Indicators */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 rounded-full text-xs font-semibold">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Core Firewalls: Shielded</span>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary border border-primary/25 rounded-full text-xs font-semibold">
          <Activity className="h-3.5 w-3.5 animate-pulse" />
          <span>Latency: 14ms</span>
        </div>
      </div>

      {/* Action triggers */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Dark/Light mode selector */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Toggle Theme"
        >
          {mounted && resolvedTheme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        {/* Notifications panel trigger */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 w-9 text-muted-foreground hover:text-foreground relative cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary animate-ping" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>System Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="p-4 text-center text-sm text-muted-foreground">
              No new threat reports detected.
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="relative h-9 w-9 rounded-full cursor-pointer overflow-hidden border border-border">
            <Avatar className="h-9 w-9">
              <AvatarImage src="/avatar-placeholder.jpg" alt="User avatar" />
              <AvatarFallback className="bg-primary/20 text-primary font-semibold">AD</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Security Analyst</p>
                <p className="text-xs leading-none text-muted-foreground">analyst@cyberguard.ai</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Account Profile</DropdownMenuItem>
            <DropdownMenuItem>Security Access Log</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
