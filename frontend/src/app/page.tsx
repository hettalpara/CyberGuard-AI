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
  Lock,
  Shield,
  Activity,
  Fingerprint,
  Scale
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/common/theme-toggle";

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
      desc: "Instant URL inspection combining cryptographic SSL/TLS verification, Google Safe Browsing, URLhaus malware feeds, and 70+ VirusTotal antivirus engines."
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
      icon: Fingerprint,
      title: "Evidence Integrity & Hashes",
      desc: "Preserves verified NIST SHA-256 cryptographic hashes and chain-of-custody logs for legal admissibility under IT Act and Section 65B electronic evidence frameworks."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col font-sans transition-colors">
      {/* Top Header */}
      <header className="h-14 border-b border-border bg-card/95 backdrop-blur-xs sticky top-0 z-40 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-primary-blue/15 text-primary-blue rounded-md border border-primary-blue/30">
            <Shield className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-1.5 font-mono">
            <span className="font-bold text-sm tracking-tight text-text-primary">CyberGuard</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-primary-blue/15 text-primary-blue border border-primary-blue/30">
              AI SOC
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <ThemeToggle />
          <Link href="/login">
            <Button
              variant="outline"
              size="sm"
              className="border-border text-text-primary hover:bg-muted text-xs h-8 px-3 rounded-lg font-semibold cursor-pointer"
            >
              Sign In
            </Button>
          </Link>
          <Link href="/analyzer">
            <Button
              size="sm"
              className="bg-primary-blue hover:bg-primary-blue/90 text-white text-xs h-8 px-3.5 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Launch Scanner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 sm:px-6 py-16 sm:py-24 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-blue/10 text-primary-blue border border-primary-blue/20 rounded-full text-xs font-mono font-semibold mb-6">
          <Zap className="w-3.5 h-3.5" />
          <span>Multi-Source Threat Intelligence & Incident Assistance</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-mono font-bold tracking-tight text-text-primary max-w-3xl mx-auto leading-tight">
          Next-Generation Cyber Crime Assistance Platform
        </h1>

        <p className="text-text-secondary text-xs sm:text-sm max-w-2xl mx-auto mt-4 leading-relaxed font-mono">
          Multi-vector inspection synthesizing Google Safe Browsing, VirusTotal, URLhaus malware intelligence, local lexical heuristics, and Gemini AI defensive analysis.
        </p>

        {/* Hero URL Input Form */}
        <form
          onSubmit={handleHeroSubmit}
          className="mt-8 max-w-2xl mx-auto flex flex-col sm:flex-row gap-2 bg-card p-2 border border-border rounded-xl shadow-sm"
        >
          <div className="flex-1 flex items-center gap-2 px-3">
            <Search className="w-4 h-4 text-text-secondary shrink-0" />
            <Input
              value={heroUrl}
              onChange={(e) => setHeroUrl(e.target.value)}
              placeholder="https://example.com/login"
              className="border-none shadow-none text-xs font-mono focus:ring-0 focus-visible:ring-0 h-10 text-text-primary bg-transparent"
            />
          </div>
          <Button
            type="submit"
            className="bg-primary-blue hover:bg-primary-blue/90 text-white font-mono font-bold text-xs h-10 px-5 rounded-lg shrink-0 cursor-pointer shadow-xs"
          >
            Analyze URL Now
          </Button>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono text-text-secondary">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" /> SSL / TLS Protocol
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" /> Multi-Source Intelligence
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" /> Deterministic Risk Scoring
          </span>
        </div>
      </section>

      {/* Feature Capabilities Grid */}
      <section className="px-4 sm:px-6 py-12 bg-card-elevated border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-xl sm:text-2xl font-mono font-bold text-text-primary tracking-tight">
              Enterprise SOC Architecture
            </h2>
            <p className="text-text-secondary text-xs sm:text-sm mt-1">
              Rigorous cyber forensic inspection pipeline built for security researchers and SOC teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featureCards.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <Card
                  key={idx}
                  className="border-border bg-card shadow-xs p-5 rounded-xl hover:border-primary-blue/50 transition-colors"
                >
                  <div className="p-2.5 bg-primary-blue/10 text-primary-blue rounded-lg w-fit mb-3 border border-primary-blue/20">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-mono font-bold text-sm text-text-primary mb-1.5">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed font-sans">
                    {feat.desc}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-4 sm:px-6 py-12 max-w-5xl mx-auto text-center w-full">
        <div className="p-8 bg-card text-text-primary rounded-2xl border border-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono font-bold text-primary-blue">
              Defensive Cyber Operations
            </span>
            <h3 className="text-lg font-mono font-bold text-text-primary">
              Ready to investigate a suspicious web domain or link?
            </h3>
            <p className="text-xs text-text-secondary font-mono">
              Access the live analysis dashboard with real-time multi-engine consensus and Gemini AI explanations.
            </p>
          </div>
          <Link href="/analyzer" className="shrink-0">
            <Button className="bg-primary-blue hover:bg-primary-blue/90 text-white font-mono font-bold text-xs px-5 py-2.5 rounded-lg cursor-pointer shadow-xs">
              Launch URL Scanner
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-card py-6 px-6 text-center text-xs font-mono text-text-secondary">
        CyberGuard AI • AI Cyber Crime Assistance Platform • Department of Computer Engineering
      </footer>
    </div>
  );
}
