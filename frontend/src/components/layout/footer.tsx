import React from "react";
import Link from "next/link";
import { Shield } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card/40 py-6 px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold tracking-tight text-gradient-cyber">CyberGuard AI</span>
        </div>
        <p className="text-xs text-muted-foreground">
          &copy; {currentYear} CyberGuard AI. All rights reserved. Platform optimized for federal and cyber response compliance.
        </p>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <Link href="/about" className="hover:underline">About</Link>
          <Link href="/contact" className="hover:underline">Support</Link>
          <a href="#" className="hover:underline">Security Policy</a>
        </div>
      </div>
    </footer>
  );
}
