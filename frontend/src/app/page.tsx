"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Search, 
  Cpu, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  BookOpen,
  Zap,
  Globe,
  Lock,
  Shield,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LandingPage() {
  const [heroUrl, setHeroUrl] = useState("");

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      const target = heroUrl.trim() ? `/analyzer?url=${encodeURIComponent(heroUrl)}` : "/analyzer";
      window.location.href = target;
    }
  };

  const featureCards = [
    {
      icon: Search,
      title: "Real-time Multi-Engine Scanning",
      desc: "Instant URL inspection combining cryptographic SSL/TLS verification, Google Safe Browsing, URLhaus malware telemetry, and 70+ VirusTotal antivirus engines."
    },
    {
      icon: Cpu,
      title: "Gemini AI Threat Assessment",
      desc: "Generates plain-language defensive summaries, key security indicators, and actionable mitigation guidance without overriding deterministic scoring."
    },
    {
      icon: FileText,
      title: "Forensic Incident Documentation",
      desc: "Produces formatted, court-ready incident records and downloadable PDF reports with complete technical metadata, engine detection ratios, and timestamped audit logs."
    },
    {
      icon: BookOpen,
      title: "Incident Recovery Workflows",
      desc: "Structured, step-by-step mitigation playbooks for phishing links, banking & UPI fraud, compromised emails, and immediate National Cyber Crime Helpline (1930) protocols."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-xs sticky top-0 z-40 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-md border border-emerald-500/30">
            <Shield className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-1.5 font-mono">
            <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100">CyberGuard</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
              AI SOC
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 font-mono">
          <Link href="/login">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs h-8 px-3 rounded-lg font-semibold"
            >
              Sign In
            </Button>
          </Link>
          <Link href="/analyzer">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3.5 rounded-lg font-semibold flex items-center gap-1.5"
            >
              <span>Launch Scanner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 sm:px-6 py-16 sm:py-24 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 rounded-full text-xs font-mono font-semibold mb-6">
          <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Multi-Source Threat Intelligence & Incident Assistance</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-mono font-black tracking-tight text-slate-900 dark:text-slate-100 max-w-3xl mx-auto leading-tight">
          Next-Generation Cyber Crime Assistance Platform
        </h1>

        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto mt-4 leading-relaxed font-mono">
          Multi-vector inspection synthesizing Google Safe Browsing, VirusTotal, URLhaus malware intelligence, local lexical heuristics, and Gemini AI defensive analysis.
        </p>

        {/* Hero URL Input Form */}
        <form
          onSubmit={handleHeroSubmit}
          className="mt-8 max-w-2xl mx-auto flex flex-col sm:flex-row gap-2 bg-white dark:bg-[#111827] p-2 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm"
        >
          <div className="flex-1 flex items-center gap-2 px-3">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <Input
              value={heroUrl}
              onChange={(e) => setHeroUrl(e.target.value)}
              placeholder="https://example.com/login"
              className="border-none shadow-none text-xs font-mono focus:ring-0 focus-visible:ring-0 h-10 text-slate-900 dark:text-slate-100 bg-transparent"
            />
          </div>
          <Button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs h-10 px-5 rounded-lg shrink-0"
          >
            Analyze URL Now
          </Button>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono text-slate-500">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> SSL / TLS Protocol
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Multi-Source Intelligence
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Deterministic Risk Scoring
          </span>
        </div>
      </section>

      {/* Feature Capabilities Grid */}
      <section className="px-4 sm:px-6 py-12 bg-white dark:bg-[#0B0F19] border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-xl sm:text-2xl font-mono font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Enterprise SOC Architecture
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Rigorous cyber forensic inspection pipeline built for security researchers and SOC teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featureCards.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <Card
                  key={idx}
                  className="border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#111827] shadow-sm p-5 rounded-xl hover:border-emerald-500/50 transition-colors"
                >
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg w-fit mb-3 border border-emerald-200 dark:border-emerald-800">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100 mb-1.5">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                    {feat.desc}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA & Academic Project Banner */}
      <section className="px-4 sm:px-6 py-12 max-w-5xl mx-auto text-center w-full">
        <div className="p-8 bg-slate-900 dark:bg-[#111827] text-white rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono font-bold text-emerald-400">
              Defensive Cyber Operations
            </span>
            <h3 className="text-lg font-mono font-bold text-white">
              Ready to investigate a suspicious web domain or link?
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Access the live analysis dashboard with real-time multi-engine consensus and Gemini AI explanations.
            </p>
          </div>
          <Link href="/analyzer" className="shrink-0">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs px-5 py-2.5 rounded-lg">
              Launch URL Scanner
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F19] py-6 px-6 text-center text-xs font-mono text-slate-500">
        CyberGuard AI • AI Cyber Crime Assistance Platform • Department of Computer Engineering
      </footer>
    </div>
  );
}
