"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldAlert, 
  Search, 
  Mail, 
  CreditCard, 
  UserX, 
  Smartphone, 
  ShoppingBag, 
  AlertTriangle, 
  CheckCircle2, 
  ListChecks, 
  HelpCircle,
  PhoneCall,
  Clock,
  ArrowRight,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// Mock recovery guide data
const recoveryGuides = [
  {
    id: "phishing",
    title: "Phishing Attack Triage",
    icon: ShieldAlert,
    desc: "Deceptive attempts to steal sensitive credentials, identity data, or access keys through spoofed websites, emails, or text links.",
    immediate: [
      "Disconnect compromised devices from local Wi-Fi or networks immediately.",
      "Clear browser DNS caches, temporary cookies, and active session logins.",
      "Change keys and passwords on affected services from a separate, trusted device."
    ],
    steps: [
      { id: 1, text: "Audit compromised entities (emails, banks, social accounts)." },
      { id: 2, text: "Rotate active login credentials and terminate foreign active sessions." },
      { id: 3, text: "Deploy Multi-Factor Authentication (MFA/2FA) keys globally." },
      { id: 4, text: "Inspect account history logs for unauthorized access modifications." }
    ],
    tips: [
      "Always inspect domain names carefully for typos (e.g. paypa1.com instead of paypal.com).",
      "Do not open attachment payloads ending in double extensions (e.g. document.pdf.exe).",
      "Use password managers to ensure auto-fill matches verified domains only."
    ]
  },
  {
    id: "upi-fraud",
    title: "UPI / QR Code Fraud Triage",
    icon: Smartphone,
    desc: "Unauthorized money withdrawals or requests executing malicious QR code redirects, transaction links, or fake customer service channels.",
    immediate: [
      "Do not enter your UPI PIN on any request or link received via WhatsApp/SMS.",
      "Contact your bank or payment app support immediately to block the UPI account.",
      "Dial the National Cyber Crime Helpline (1930) within the golden hour."
    ],
    steps: [
      { id: 1, text: "Lock active UPI handles inside your banking applications." },
      { id: 2, text: "Document transaction transaction hashes, messages, and fraud phone numbers." },
      { id: 3, text: "File an official transaction dispute report inside the payment app." },
      { id: 4, text: "Report the fraud transaction beneficiary details to bank authorities." }
    ],
    tips: [
      "UPI PIN is only required to SEND money, never to RECEIVE funds.",
      "Inspect beneficiary names carefully before completing transactions.",
      "Enable transaction limits inside your bank application settings."
    ]
  },
  {
    id: "email-hack",
    title: "Email Account Compromise",
    icon: Mail,
    desc: "Unauthorized takeover of critical email accounts, potentially exposing connected services, passwords reset paths, and identity logs.",
    immediate: [
      "Navigate to the account recovery portal of your provider (Google, Microsoft, etc.).",
      "Check alternate recovery email addresses and backup phone numbers for changes.",
      "Select 'Log out of all other active sessions' within settings immediately."
    ],
    steps: [
      { id: 1, text: "Recover access using verification codes or backup security keys." },
      { id: 2, text: "Inspect email forwarding rules to check if copies are sent to attackers." },
      { id: 3, text: "Rotate passwords of all high-priority linked bank or social profiles." },
      { id: 4, text: "Audit inbox sent folders for spam messages sent from your handle." }
    ],
    tips: [
      "Setup independent secondary recovery options and backup security codes.",
      "Use unique, complex passwords separate from other public services.",
      "Enable hardware security keys (e.g. YubiKey) for critical email accounts."
    ]
  },
  {
    id: "social-hack",
    title: "Social Media Account Theft",
    icon: UserX,
    desc: "Takeover of profiles on platforms like Instagram, WhatsApp, or LinkedIn, often used to solicit money from your connections.",
    immediate: [
      "Alert close contacts via alternative platforms to ignore requests for money.",
      "Submit a support ticket through official recovery centers (e.g., instagram.com/hacked).",
      "Revoke access for third-party applications linked to your social accounts."
    ],
    steps: [
      { id: 1, text: "Attempt credential recovery using native recovery links." },
      { id: 2, text: "Verify if verification numbers or backup options have been modified." },
      { id: 3, text: "Notify platform support with identity records if takeover is completed." },
      { id: 4, text: "Audit active active session locations and terminate rogue connections." }
    ],
    tips: [
      "Never share two-factor verification codes or links with anyone.",
      "Avoid clicking login verification links sent by unknown profiles.",
      "Turn on login alerts to receive notifications for new login attempts."
    ]
  },
  {
    id: "bank-fraud",
    title: "Bank / Card Account Fraud",
    icon: CreditCard,
    desc: "Unauthorized transactions on your savings, credit card, or net banking profiles, including identity cloning and credit limits abuse.",
    immediate: [
      "Call your bank customer support immediately or use NetBanking to block the card.",
      "Freeze credit cards, debit cards, and net banking user access profiles.",
      "Alert the national helpline portal (1930) immediately to lock transaction routing."
    ],
    steps: [
      { id: 1, text: "Execute permanent block requests on compromised credit cards." },
      { id: 2, text: "Download official bank statements showing target transaction IDs." },
      { id: 3, text: "Draft a formal dispute claim document within 3 days for zero-liability." },
      { id: 4, text: "Submit incident records to local police or cyber crime cells." }
    ],
    tips: [
      "Keep transaction limits set to minimum values inside mobile banking apps.",
      "Never disclose card pins, CVVs, expiry dates, or OTP values.",
      "Inspect bank alerts regularly for minor unrecognized test transactions."
    ]
  },
  {
    id: "shopping-scam",
    title: "E-Commerce / Shopping Scam",
    icon: ShoppingBag,
    desc: "Fake websites, payment options, or classified listings selling counterfeit products or harvesting payment credentials.",
    immediate: [
      "Contact your credit card issuer to request a chargeback transaction dispute.",
      "Block payment channels used to execute the transaction immediately.",
      "Save screenshots of checkout profiles, order confirmations, and domains."
    ],
    steps: [
      { id: 1, text: "Call the bank to dispute unauthorized payment transfers." },
      { id: 2, text: "Gather seller website URLs, receipt copies, and chat threads." },
      { id: 3, text: "File an official scam report on national consumer portals." },
      { id: 4, text: "Submit domain analysis data to registrar abuse desks for takedown." }
    ],
    tips: [
      "Verify seller ratings, domain ages, and reviews before checking out.",
      "Avoid purchasing from domains offering prices that look too good to be true.",
      "Use virtual credit cards with limited balance caps for online checkouts."
    ]
  }
];

export default function RecoveryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGuideId, setActiveGuideId] = useState("phishing");
  const [completedSteps, setCompletedSteps] = useState<Record<string, number[]>>({});

  const handleStepToggle = (guideId: string, stepId: number) => {
    setCompletedSteps((prev) => {
      const guideSteps = prev[guideId] ?? [];
      const updated = guideSteps.includes(stepId)
        ? guideSteps.filter((id) => id !== stepId)
        : [...guideSteps, stepId];
      return { ...prev, [guideId]: updated };
    });
  };

  const activeGuide = recoveryGuides.find((g) => g.id === activeGuideId) ?? recoveryGuides[0];

  // Filter guides based on search
  const filteredGuides = recoveryGuides.filter((g) =>
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) || g.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gradient-cyber">Incident Recovery Guides</h1>
          <p className="text-sm text-muted-foreground">
            Step-by-step diagnostic and recovery guidelines to isolate and recover from cyber incidents.
          </p>
        </div>
        {/* National Helpline Alert */}
        <div className="flex items-center gap-3 bg-destructive/10 text-destructive border border-destructive/25 px-4 py-2 rounded-md text-xs font-semibold">
          <PhoneCall className="h-4 w-4 animate-bounce" />
          <div>
            <div>National Cyber Helpline: 1930</div>
            <div className="text-[10px] text-muted-foreground font-normal">Call immediately for financial frauds</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* LEFT NAV PANEL - Guides List */}
        <Card className="w-full lg:w-80 border-border bg-card/65 shrink-0 cyber-glow-border">
          <CardHeader className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
              <Input
                type="text"
                placeholder="Search incident guides..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-accent/20 border-border text-xs focus-visible:ring-primary"
              />
            </div>
          </CardHeader>
          <CardContent className="p-2 space-y-1">
            {filteredGuides.map((guide) => {
              const IconComp = guide.icon;
              const isActive = guide.id === activeGuideId;
              const completedCount = completedSteps[guide.id]?.length ?? 0;
              const progressPct = Math.round((completedCount / guide.steps.length) * 100);

              return (
                <div
                  key={guide.id}
                  onClick={() => setActiveGuideId(guide.id)}
                  className={cn(
                    "p-3 rounded-md cursor-pointer transition-all border flex flex-col gap-1.5",
                    isActive 
                      ? "bg-accent/40 text-primary border-primary/20" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/15 border-transparent"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 font-bold text-xs">
                      <IconComp className="h-4.5 w-4.5 text-primary shrink-0" />
                      <span>{guide.title}</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                  {progressPct > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-semibold text-muted-foreground">
                        <span>Recovery Progress</span>
                        <span>{progressPct}%</span>
                      </div>
                      <div className="w-full bg-accent/30 h-1 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${progressPct}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* MAIN VIEWER PANEL - Active Guide Detail */}
        <div className="flex-1 w-full space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeGuide.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Overview Details */}
              <Card className="border-border bg-card/65 cyber-glow-border">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                      <activeGuide.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">{activeGuide.title}</CardTitle>
                      <CardDescription className="text-xs">Comprehensive incident response checklist</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-4">
                  {activeGuide.desc}
                </CardContent>
              </Card>

              {/* Immediate Actions (Red Box alert) */}
              <Card className="border-destructive/20 bg-destructive/5 cyber-glow-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold text-destructive flex items-center gap-1.5 uppercase tracking-wider">
                    <AlertTriangle className="h-4.5 w-4.5" /> Immediate Emergency Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {activeGuide.immediate.map((act, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-destructive font-bold mt-0.5">•</span>
                      <span className="text-muted-foreground leading-relaxed">{act}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recovery Steps Checklist */}
              <Card className="border-border bg-card/65 cyber-glow-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <ListChecks className="h-4.5 w-4.5 text-primary" /> Incident Recovery Checklists
                  </CardTitle>
                  <CardDescription className="text-xs">Check off actions as you execute them to monitor progress</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activeGuide.steps.map((step) => {
                    const isCompleted = (completedSteps[activeGuide.id] ?? []).includes(step.id);
                    return (
                      <div 
                        key={step.id} 
                        onClick={() => handleStepToggle(activeGuide.id, step.id)}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded border cursor-pointer transition-all hover:bg-accent/10",
                          isCompleted ? "bg-accent/15 border-primary/20" : "bg-card border-border"
                        )}
                      >
                        <CheckCircle2 className={cn(
                          "h-5 w-5 shrink-0 mt-0.5 transition-colors",
                          isCompleted ? "text-primary fill-primary/10" : "text-muted-foreground"
                        )} />
                        <div className="text-xs leading-relaxed">
                          <span className="font-semibold text-primary mr-1.5">Step {step.id}:</span>
                          <span className={cn(isCompleted ? "line-through text-muted-foreground" : "text-foreground font-medium")}>
                            {step.text}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Long-term prevention safety tips */}
              <Card className="border-border bg-card/65 cyber-glow-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <HelpCircle className="h-4.5 w-4.5 text-primary" /> Long-Term Prevention Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs text-muted-foreground">
                  {activeGuide.tips.map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 leading-relaxed">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
