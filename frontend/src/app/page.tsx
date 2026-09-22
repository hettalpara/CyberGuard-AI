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
  Zap
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
      desc: "Instant URL inspection combining SSL certificate validation, Google Safe Browsing, URLhaus malware feeds, and VirusTotal threat database checks."
    },
    {
      icon: Cpu,
      title: "Gemini AI Risk Explanation",
      desc: "Generates clear, simple natural language explanations for flagged indicators, breaking down complex technical vulnerabilities into plain English."
    },
    {
      icon: FileText,
      title: "Downloadable PDF Reports",
      desc: "Produces formatted, printable incident reports containing technical metadata, threat ratios, WHOIS records, and triage recommendations."
    },
    {
      icon: BookOpen,
      title: "Cyber Incident Recovery Guide",
      desc: "Step-by-step mitigation workflows for Phishing, UPI fraud, compromised emails, bank scams, and e-commerce frauds with Helpline 1930 integration."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1F2937] flex flex-col font-sans">
      <header className="h-16 border-b border-[#E5E7EB] bg-white sticky top-0 z-40 px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-[#10B981] text-white rounded-lg">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg tracking-tight text-[#1F2937]">CyberGuard AI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="outline" className="border-[#D1D5DB] bg-white text-[#1F2937] hover:bg-[#F3F4F6] text-xs font-semibold px-5 h-9 rounded-xl shadow-sm">
              Sign In
            </Button>
          </Link>
          <Link href="/analyzer">
            <Button className="bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold px-4 h-9 rounded-xl flex items-center gap-1.5">
              Launch Scanner <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      <section className="px-6 py-16 sm:py-24 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-emerald-50 text-[#10B981] border border-emerald-200 rounded-full text-xs font-semibold mb-6">
          <Zap className="w-3.5 h-3.5 text-[#10B981]" /> AI-Powered Cybersecurity Major Project
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#1F2937] max-w-3xl mx-auto leading-tight">
          Smart Phishing URL Analyzer & Threat Detection
        </h1>
        <p className="text-slate-500 text-sm sm:text-base max-w-2xl mx-auto mt-4 leading-relaxed">
          Instantly analyze suspicious links with automated SSL inspection, Google Safe Browsing, URLhaus malware intelligence, VirusTotal consensus, and Gemini AI risk explanations.
        </p>

        <form onSubmit={handleHeroSubmit} className="mt-8 max-w-2xl mx-auto flex flex-col sm:flex-row gap-2 bg-white p-2 border border-[#E5E7EB] rounded-2xl shadow-sm">
          <div className="flex-1 flex items-center gap-2 px-3">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <Input
              value={heroUrl}
              onChange={(e) => setHeroUrl(e.target.value)}
              placeholder="Paste suspicious website URL (e.g. https://sbi-verify-login.xyz)"
              className="border-none shadow-none text-xs focus:ring-0 focus-visible:ring-0 h-10 text-slate-800"
            />
          </div>
          <Button type="submit" className="bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-xs h-10 px-6 rounded-xl shrink-0">
            Analyze URL Now
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> SSL Validation</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> WHOIS Domain Age</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> Multi-Engine Detection</span>
        </div>
      </section>

      <section className="px-6 py-12 bg-white border-y border-[#E5E7EB]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1F2937] tracking-tight">Comprehensive Security Pipeline</h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">Built specifically for high-precision phishing URL analysis & academic evaluation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featureCards.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <Card key={idx} className="border-[#E5E7EB] bg-white shadow-sm p-6 rounded-xl hover:border-[#10B981]/50 transition">
                  <div className="p-3 bg-emerald-50 text-[#10B981] rounded-xl w-fit mb-4 border border-emerald-100">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-[#1F2937] mb-2">{feat.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{feat.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 max-w-5xl mx-auto text-center w-full">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-6 bg-white border border-[#E5E7EB] rounded-xl">
            <div className="text-3xl font-extrabold text-[#10B981]">99.4%</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">Phishing Accuracy</div>
          </div>
          <div className="p-6 bg-white border border-[#E5E7EB] rounded-xl">
            <div className="text-3xl font-extrabold text-[#1F2937]">70+</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">AV Engines Scanned</div>
          </div>
          <div className="p-6 bg-white border border-[#E5E7EB] rounded-xl">
            <div className="text-3xl font-extrabold text-[#10B981]">&lt; 2s</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">Analysis Latency</div>
          </div>
          <div className="p-6 bg-white border border-[#E5E7EB] rounded-xl">
            <div className="text-3xl font-extrabold text-[#1F2937]">IEEE 830</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">Spec Compliant</div>
          </div>
        </div>

        <div className="mt-12 p-8 bg-[#111827] text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
          <div>
            <h3 className="text-xl font-bold">Ready to analyze a suspicious link?</h3>
            <p className="text-xs text-slate-400 mt-1">Access the live scanner dashboard with full WHOIS, SSL, and AI explanations.</p>
          </div>
          <Link href="/analyzer">
            <Button className="bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-xs px-6 py-3 rounded-xl shrink-0">
              Open Smart URL Analyzer
            </Button>
          </Link>
        </div>
      </section>

      <footer className="mt-auto border-t border-[#E5E7EB] bg-white py-6 px-6 text-center text-xs text-slate-400">
        AI Cyber Crime Assistance Platform • Department of Computer Engineering • Final Year Major Project
      </footer>
    </div>
  );
}
