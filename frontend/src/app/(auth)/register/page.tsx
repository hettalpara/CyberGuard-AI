"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2, Shield } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { AuthInput } from "@/components/auth/auth-input";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);

    try {
      await register({
        name: fullName,
        email,
        password,
      });

      setSuccess("Analyst account registered successfully. Redirecting to sign in...");
      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Registration failed. Please check inputs and try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Brand Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 text-[var(--blue)] rounded-xl mb-3 border border-blue-500/20">
          <Shield className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
          CYBERGUARD AI
        </h1>
        <p className="text-xs text-[var(--muted)] mt-1.5">
          Register New SOC Security Analyst Profile
        </p>
      </div>

      {/* Register Card */}
      <div className="card-cg" style={{ padding: 0 }}>
        <div className="card-head-cg">
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text)" }}>
              Create Analyst Credentials
            </h3>
            <p style={{ fontSize: 11, color: "var(--muted)", margin: "4px 0 0" }}>
              Provision access to URL threat analyzers, forensic reports, and AI assistant.
            </p>
          </div>
        </div>

        <div className="card-body-cg" style={{ padding: "24px" }}>
          {error && (
            <div className="notice-cg" style={{ borderColor: "rgba(239,68,68,0.3)", color: "var(--red)", background: "rgba(239,68,68,0.08)", marginBottom: 18 }}>
              <AlertCircle size={14} style={{ verticalAlign: "middle", marginRight: 7 }} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="notice-cg" style={{ borderColor: "rgba(22,199,132,0.3)", color: "var(--green)", background: "rgba(22,199,132,0.08)", marginBottom: 18 }}>
              <CheckCircle2 size={14} style={{ verticalAlign: "middle", marginRight: 7 }} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthInput
              label="Full Name"
              type="text"
              required
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Security Analyst"
              icon={<User size={15} />}
            />

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
              label="Master Password (8+ characters)"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock size={15} />}
              showPasswordToggle
            />

            <AuthInput
              label="Confirm Password"
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock size={15} />}
              showPasswordToggle
            />

            <button
              type="submit"
              disabled={isLoading}
              className="btn-cg primary w-full justify-center"
              style={{ height: 44, fontSize: 12, fontWeight: 700, marginTop: 12, borderRadius: 8 }}
            >
              {isLoading ? "Provisioning Profile..." : "Register Analyst Profile"}
              <ArrowRight size={14} />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[var(--line)] text-center text-xs text-[var(--muted)]">
            Already registered?{" "}
            <Link href="/login" className="font-bold text-[var(--blue)] hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
