"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, AlertCircle, Shield } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { AuthInput } from "@/components/auth/auth-input";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Invalid analyst credentials. Please verify your email and password.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-4">
      {/* Brand Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center p-2.5 bg-blue-500/10 text-[var(--blue)] rounded-xl mb-2 border border-blue-500/20">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
          CYBERGUARD AI
        </h1>
        <p className="text-xs text-[var(--muted)] mt-1">
          SOC Cyber Crime Assistance & Threat Intelligence Platform
        </p>
      </div>

      {/* Login Card */}
      <div className="card-cg" style={{ padding: 0, background: "var(--card)", color: "var(--card-foreground)", border: "1px solid var(--border)", borderRadius: "12px" }}>
        <div className="card-head-cg" style={{ borderBottom: "1px solid var(--border)", padding: "12px 20px" }}>
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--foreground)" }}>
              Analyst Authentication
            </h3>
            <p style={{ fontSize: 11, color: "var(--muted)", margin: "2px 0 0" }}>
              Enter credentials to access the security analysis console.
            </p>
          </div>
        </div>

        <div className="card-body-cg" style={{ padding: "18px 24px" }}>
          {error && (
            <div className="notice-cg" style={{ borderColor: "rgba(239,68,68,0.3)", color: "var(--red)", background: "rgba(239,68,68,0.08)", marginBottom: 14 }}>
              <AlertCircle size={14} style={{ verticalAlign: "middle", marginRight: 7 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <AuthInput
              label="Work Email Address"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="analyst@cyberguard.ai"
              icon={<Mail size={15} />}
            />

            <AuthInput
              label="Master Password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock size={15} />}
              showPasswordToggle
            />

            <button
              type="submit"
              disabled={isLoading}
              className="btn-cg primary w-full justify-center"
              style={{ height: 42, fontSize: 12, fontWeight: 700, marginTop: 10, borderRadius: 8 }}
            >
              {isLoading ? "Authenticating..." : "Sign In to Console"}
              <ArrowRight size={14} />
            </button>
          </form>

          <div className="mt-4 pt-3 border-t border-[var(--line)] text-center text-xs text-[var(--muted)]">
            Need an analyst account?{" "}
            <Link href="/register" className="font-bold text-[var(--blue)] hover:underline">
              Register Credentials
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
