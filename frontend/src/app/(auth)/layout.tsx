import type { ReactNode } from "react";
import { Shield } from "lucide-react";
import Link from "next/link";
import CyberIllustration from "@/components/auth/CyberIllustration";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    /* Force light color-scheme so dark mode does NOT affect auth pages */
    <div
      className="h-screen w-full overflow-hidden md:grid md:grid-cols-2"
      data-theme="light"
      style={{ colorScheme: "light" }}
    >
      {/* ─── Left Panel: Cyber Illustration (hidden on mobile) ─── */}
      <section className="relative hidden flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#0f172a] via-[#0f172a] to-[#1e293b] px-12 py-12 text-white md:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_transparent_60%)]" />
        <div className="relative z-10 flex w-full max-w-xl flex-1 items-center justify-center">
          <CyberIllustration />
        </div>
        <div className="relative z-10 mt-4 max-w-md text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(37,99,235,0.2)]">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <p className="text-base font-semibold leading-relaxed text-white">
            Protect yourself from cyber threats with AI-powered security.
          </p>
        </div>
      </section>

      {/* ─── Right Panel: Auth Form ─── */}
      <section className="flex h-full items-center justify-center overflow-y-auto bg-white px-4 py-6 sm:px-8">
        <div className="w-full max-w-md rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.12)] sm:p-7">
          {/* Brand Identity */}
          <div className="mb-5 flex flex-col items-center text-center">
            <Link href="/" className="inline-flex flex-col items-center gap-1.5">
              <div className="mb-1.5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#2563eb] shadow-sm">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide text-[#2563eb]">
                AI Cyber Crime Assistant
              </span>
            </Link>
          </div>

          {/* Auth form content (login / register / etc.) */}
          {children}
        </div>
      </section>
    </div>
  );
}
