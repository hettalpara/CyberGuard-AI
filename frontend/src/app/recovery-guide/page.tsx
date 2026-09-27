"use client";

import React, { useState } from "react";
import { 
  ShieldAlert, 
  Smartphone, 
  Mail, 
  CreditCard, 
  ShoppingBag, 
  CheckCircle2, 
  Lightbulb,
  PhoneCall,
  ExternalLink,
  Shield,
  LifeBuoy
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function RecoveryGuidePage() {
  const categories = [
    {
      id: "phishing",
      title: "1. Phishing Attack Recovery",
      icon: ShieldAlert,
      desc: "Deceptive websites or spoofed URL links designed to harvest credentials and personal identity data.",
      steps: [
        "Disconnect the compromised device from Wi-Fi or mobile network immediately.",
        "Change passwords for all affected accounts using a separate secure device.",
        "Enable Two-Factor Authentication (2FA / MFA) across your email and financial portals.",
        "Audit active sessions and revoke unknown device access privileges."
      ],
      tips: [
        "Always inspect domain spelling carefully in the browser address bar before submitting logins.",
        "Never click links inside unexpected SMS or unsolicited email messages."
      ]
    },
    {
      id: "upi-fraud",
      title: "2. UPI / QR Code Fraud Recovery",
      icon: Smartphone,
      desc: "Unauthorized money transfers, fake buyer payment requests, or malicious QR code traps.",
      steps: [
        "Contact your bank customer support immediately to block your UPI ID / handle.",
        "Dial 1930 (National Cyber Crime Helpline) within the golden hour window.",
        "File a dispute report inside your payment app (GPay, PhonePe, Paytm).",
        "Document transaction reference IDs, timestamp, and fraudulent phone numbers."
      ],
      tips: [
        "Entering your UPI PIN is ONLY required to SEND money, never to RECEIVE money.",
        "Never scan QR codes sent by unknown online buyers or remote callers."
      ]
    },
    {
      id: "email-hacked",
      title: "3. Email Account Compromised",
      icon: Mail,
      desc: "Unauthorized logins, password changes, or suspicious bulk emails originating from your address.",
      steps: [
        "Use official account recovery flows (SMS / secondary email) to regain access.",
        "Terminate all active sessions in your email account security settings.",
        "Check email forwarding rules to ensure attackers have not configured secret mail forwards.",
        "Update secondary phone numbers and security recovery questions."
      ],
      tips: [
        "Use a unique 16+ character passphrase for your primary master email account.",
        "Never reuse your email password on secondary shopping or social media sites."
      ]
    },
    {
      id: "bank-fraud",
      title: "4. Bank & Card Fraud Recovery",
      icon: CreditCard,
      desc: "Unapproved debit/credit card transactions or unauthorized internet banking access.",
      steps: [
        "Block credit/debit cards instantly via mobile banking app or helpline.",
        "Inform your bank branch and file an official chargeback dispute form.",
        "File an official complaint at cybercrime.gov.in with transaction receipts.",
        "Obtain a police FIR copy if requested by bank fraud department."
      ],
      tips: [
        "Never share OTPs, CVV numbers, or card PINs with anyone claiming to be bank staff.",
        "Set strict daily limit caps on international and online card transactions."
      ]
    },
    {
      id: "shopping-scam",
      title: "5. Online Shopping Scam Recovery",
      icon: ShoppingBag,
      desc: "Fake e-commerce portals, non-delivery of purchased goods, or counterfeit storefronts.",
      steps: [
        "Contact your credit card provider or bank to dispute the merchant charge.",
        "Report the fake store URL to Google Safe Browsing and CyberGuard AI.",
        "Keep screenshot evidence of order confirmations, URLs, and payment records.",
        "File a consumer fraud complaint with National Consumer Helpline (1915)."
      ],
      tips: [
        "Check domain age in WHOIS — fraudulent e-commerce sites are usually only days old.",
        "Look for verified payment gateway seals and clear business physical address details."
      ]
    }
  ];

  const [activeCategory, setActiveCategory] = useState("phishing");
  const selected = categories.find((c) => c.id === activeCategory) || categories[0];
  const Icon = selected.icon;

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-[#0B0F19]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
            
            {/* Page Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-mono font-bold text-[10px] rounded border border-emerald-300 dark:border-emerald-800">
                  INCIDENT RESPONSE PLAYBOOKS
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Step-by-Step Triage & Protocols
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-mono font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Incident Recovery Guide
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                Structured response actions, immediate containment procedures, and emergency helpline protocols.
              </p>
            </div>

            {/* Helpline Banner */}
            <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-400 rounded-lg shrink-0">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-red-900 dark:text-red-300">
                    National Cyber Crime Helpline: 1930
                  </h4>
                  <p className="text-[11px] text-red-700 dark:text-red-400 mt-0.5">
                    For financial fraud, report within the first golden hour to maximize fund freezing probability.
                  </p>
                </div>
              </div>
              <a
                href="https://cybercrime.gov.in"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shrink-0 transition"
              >
                <span>cybercrime.gov.in</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Category Navigation Tabs */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const CatIcon = cat.icon;
                const isActive = cat.id === activeCategory;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-semibold transition border cursor-pointer ${
                      isActive
                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs"
                        : "bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <CatIcon className="w-3.5 h-3.5" />
                    <span>{cat.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Playbook Content Card */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm overflow-hidden">
              <CardHeader className="py-4 px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-800 shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100">
                      {selected.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                      {selected.desc}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Step-by-Step Triage Actions */}
                <div className="space-y-3 font-mono">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span>Immediate Containment Steps</span>
                  </h3>

                  <div className="space-y-2">
                    {selected.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg flex items-start gap-3"
                      >
                        <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                          Step {idx + 1}
                        </span>
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preventative Security Tips */}
                <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-2 font-mono">
                  <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5 uppercase">
                    <Lightbulb className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Preventative Safeguards</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-emerald-800 dark:text-emerald-300 font-sans">
                    {selected.tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
