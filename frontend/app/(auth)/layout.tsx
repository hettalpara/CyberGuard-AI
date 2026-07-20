import type { ReactNode } from "react";
import { Shield } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-background relative overflow-hidden px-4">
      {/* Cybersecurity background grid patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Floating neon accent blur */}
      <div className="absolute top-[-10%] left-[5%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Identity */}
        <div className="flex flex-col items-center mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <Shield className="h-8 w-8 text-primary animate-pulse" />
            <span className="text-2xl font-bold tracking-tight text-gradient-cyber">CyberGuard AI</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            AI-Powered Cyber Incident Assistance & Analysis Portal
          </p>
        </div>

        {/* Auth form Card Container */}
        <div className="bg-card border border-border shadow-2xl rounded-lg p-6 md:p-8 cyber-glow-border">
          {children}
        </div>
      </div>
    </div>
  );
}
