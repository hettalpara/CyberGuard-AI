"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.location.href = "/dashboard";
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center px-4 font-sans">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 bg-[#10B981] text-white rounded-2xl mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#1F2937]">CyberGuard AI</h1>
          <p className="text-xs text-slate-500 mt-1">Smart Phishing URL Analysis & Cyber Crime Platform</p>
        </div>

        {/* Login Card */}
        <Card className="border-[#E5E7EB] bg-white shadow-sm p-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-[#1F2937]">Sign In to Your Account</CardTitle>
            <CardDescription className="text-xs text-slate-500">Enter your credentials to access the URL scanner dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="analyst@cyberguard.ai"
                    className="pl-9 bg-slate-50 border-[#E5E7EB] h-10 text-xs rounded-xl focus:ring-[#10B981]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9 bg-slate-50 border-[#E5E7EB] h-10 text-xs rounded-xl focus:ring-[#10B981]"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#10B981] hover:bg-[#059669] text-white text-xs h-10 rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                {isLoading ? "Signing In..." : "Sign In to Dashboard"} <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-[#E5E7EB] text-center text-xs text-slate-500">
              Don't have an account?{" "}
              <Link href="/register" className="font-bold text-[#10B981] hover:underline">
                Create Account
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
