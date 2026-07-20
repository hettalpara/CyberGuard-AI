"use client";

import React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Laptop } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={cn("flex items-center border border-border rounded-md bg-accent/20 p-1 w-fit", className)}>
      {[
        { id: "light", label: "Light Theme", icon: Sun },
        { id: "dark", label: "Dark Theme", icon: Moon },
        { id: "system", label: "System Default", icon: Laptop }
      ].map((opt) => {
        const isActive = mounted && theme === opt.id;
        return (
          <Button
            key={opt.id}
            variant="ghost"
            size="icon"
            onClick={() => setTheme(opt.id)}
            className={cn(
              "h-7 w-7 rounded-sm text-muted-foreground",
              isActive && "bg-card text-primary shadow-sm"
            )}
            title={opt.label}
            aria-label={opt.label}
          >
            <opt.icon className="h-4 w-4" />
          </Button>
        );
      })}
    </div>
  );
}
