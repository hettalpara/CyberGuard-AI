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
  ExternalLink
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
      desc: "Deceptive websites or spoofed URL links designed to harvest login credentials and personal identity data.",
      steps: [
        "Disconnect the compromised device from Wi-Fi or mobile network immediately.",
        "Change passwords for all affected accounts using a separate secure device.",
        "Enable Two-Factor Authentication (2FA) across your email and financial portals.",
        "Audit active sessions and revoke unknown device access privileges."
      ],
      tips: [
        "Always inspect domain spelling carefully in the browser address bar before logging in.",
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
        "Dial 1930 (National Cyber Crime Helpline) within the first golden hour.",
        "File a dispute report inside your payment app (GPay, PhonePe, Paytm).",
        "Document transaction reference IDs, date/time, and fraudulent phone numbers."
      ],
      tips: [
        "Remember: Entering your UPI PIN is ONLY required to SEND money, never to RECEIVE money.",
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
        "Check email forwarding rules to ensure attackers haven't set up secret copy forwards.",
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
      <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-[#1F2937] tracking-tight">Cyber Incident Recovery Guide</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Step-by-step triage actions, recovery workflows, and safety tips for common cyber crime incidents.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((cat) => {
              const CatIcon = cat.icon;
              const isActive = cat.id === activeCategory;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition border ${
                    isActive
                      ? "bg-[#10B981] text-white border-[#10B981] shadow-sm"
                      : "bg-white text-slate-700 border-[#E5E7EB] hover:bg-slate-50"
                  }`}
                >
                  <CatIcon className="w-4 h-4" />
                  <span>{cat.title}</span>
                </button>
              );
            })}
          </div>

          <Card className="border-[#E5E7EB] bg-white shadow-sm mb-8">
            <CardHeader className="border-b border-[#E5E7EB]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-[#10B981] rounded-xl border border-emerald-100">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-lg font-extrabold text-[#1F2937]">{selected.title}</CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">{selected.desc}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-xs font-bold text-[#10B981] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Priority Recovery Steps
                </h3>
                <div className="space-y-3">
                  {selected.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl border border-[#E5E7EB] bg-slate-50/70">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#10B981] text-white text-[11px] font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-xs text-slate-700 font-semibold">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5E7EB]">
                <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" /> Essential Safety Tips
                </h3>
                <div className="space-y-2.5">
                  {selected.tips.map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                      <span className="text-amber-500 font-bold">•</span>
                      <span className="font-medium">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3 text-emerald-900">
              <PhoneCall className="w-5 h-5 text-[#10B981] shrink-0" />
              <div>
                <span className="font-bold">National Cyber Crime Helpline: 1930</span>
                <span className="text-emerald-700 block">Report financial cyber frauds immediately within the golden hour.</span>
              </div>
            </div>
            <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="bg-[#10B981] hover:bg-[#059669] text-white text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shrink-0 font-semibold">
                cybercrime.gov.in <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </a>
          </div>
        </main>
      </div>
    </div>
    </ProtectedRoute>
  );
}
