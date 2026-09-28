import type { ReactNode } from "react";
import { Shield } from "lucide-react";
import CyberIllustration from "@/components/auth/CyberIllustration";
import { ThemeToggle } from "@/components/common/theme-toggle";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen w-full overflow-hidden md:grid md:grid-cols-2 bg-[var(--background)] text-[var(--foreground)]">
      {/* ─── Left Panel: Cyber Illustration (hidden on mobile) ─── */}
      <section
        className="relative hidden flex-col items-center justify-between overflow-hidden px-8 py-8 md:flex h-full border-r border-[var(--border)] transition-colors duration-200"
        style={{
          background: "radial-gradient(circle at 50% 20%, rgba(52,120,255,0.15), transparent 70%), var(--card)"
        }}
      >
        <div className="relative z-10 flex w-full max-w-xl flex-1 items-center justify-center min-h-0">
          <CyberIllustration />
        </div>
        <div
          className="relative z-10 mt-2 max-w-md text-center -translate-y-[15px]"
          style={{ transform: "translateY(-15px)" }}
        >
          <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-[var(--primary)]">
            <Shield className="h-5 w-5" />
          </div>
          <p className="text-sm sm:text-base font-semibold leading-relaxed text-[var(--foreground)]">
            Protect yourself from cyber threats with AI-powered security.
          </p>
        </div>
      </section>

      {/* ─── Right Panel: Auth Form ─── */}
      <section className="relative flex h-full items-center justify-center overflow-hidden px-4 py-4 sm:px-8 bg-[var(--background)] text-[var(--foreground)] transition-colors duration-200">
        {/* Global Theme Toggle in top-right corner */}
        <div className="absolute top-5 right-5 z-20">
          <ThemeToggle showLabel />
        </div>

        <div className="w-full max-w-md my-auto">
          {children}
        </div>
      </section>
    </div>
  );
}
