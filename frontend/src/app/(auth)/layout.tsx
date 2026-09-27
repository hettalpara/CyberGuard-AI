import type { ReactNode } from "react";
import { Shield } from "lucide-react";
import CyberIllustration from "@/components/auth/CyberIllustration";
import { ThemeToggle } from "@/components/common/theme-toggle";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen w-full overflow-hidden md:grid md:grid-cols-2">
      {/* ─── Left Panel: Cyber Illustration (hidden on mobile) ─── */}
      <section className="relative hidden flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#07101f] via-[#0b1729] to-[#0e1d32] px-12 py-12 text-white md:flex border-r border-[var(--line)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(52,120,255,0.25),_transparent_60%)]" />
        <div className="relative z-10 flex w-full max-w-xl flex-1 items-center justify-center">
          <CyberIllustration />
        </div>
        <div className="relative z-10 mt-4 max-w-md text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(52,120,255,0.18)] border border-[rgba(52,120,255,0.3)]">
            <Shield className="h-5 w-5 text-[#3478ff]" />
          </div>
          <p className="text-base font-semibold leading-relaxed text-slate-100">
            Protect yourself from cyber threats with AI-powered security.
          </p>
        </div>
      </section>

      {/* ─── Right Panel: Auth Form ─── */}
      <section className="relative flex h-full items-center justify-center overflow-y-auto px-4 py-6 sm:px-8 bg-[var(--bg)] transition-colors duration-200">
        {/* Global Theme Toggle in top-right corner */}
        <div className="absolute top-5 right-5 z-20">
          <ThemeToggle showLabel />
        </div>

        <div className="w-full max-w-md my-auto py-8">
          {children}
        </div>
      </section>
    </div>
  );
}
