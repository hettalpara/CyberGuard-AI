"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  KeyRound, 
  RefreshCw, 
  MonitorCheck, 
  PhoneCall, 
  AlertTriangle,
  Lock,
  Smartphone
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";

const playbooks = [
  {
    title: "Secure affected accounts",
    desc: "Change passwords from a trusted device and enable MFA where available. Revoke untrusted OAuth application permissions.",
    icon: KeyRound,
    steps: [
      "Access account settings from a known clean device",
      "Update master password to a 16+ character passphrase",
      "Enroll in hardware security keys or authenticator apps (TOTP)",
      "Terminate all other active browser and mobile sessions"
    ]
  },
  {
    title: "Review active sessions",
    desc: "Sign out of unknown sessions and review account security activity across email, cloud, and banking providers.",
    icon: RefreshCw,
    steps: [
      "Review authorized third-party applications and API tokens",
      "Check recent sign-in IP addresses and geographic locations",
      "Audit recovery email addresses and backup mobile numbers",
      "Verify email forwarding rules or mailbox filter additions"
    ]
  },
  {
    title: "Check device security",
    desc: "Run trusted security checks and install available updates to eliminate persistent keyloggers or malicious payloads.",
    icon: MonitorCheck,
    steps: [
      "Run complete endpoint antivirus scan using Microsoft Defender or equivalent",
      "Inspect browser extensions and remove unrecognized add-ons",
      "Apply operating system security patches and firmware updates",
      "Clear browser cache, cookies, and active session tokens"
    ]
  },
  {
    title: "Preserve evidence",
    desc: "Keep relevant URLs, timestamps, screenshots and generated reports intact for reporting to cyber authorities.",
    icon: ShieldCheck,
    steps: [
      "Record full destination URLs and redirect chains",
      "Preserve unmodified raw emails including full headers",
      "Export PDF forensic incident reports from CyberGuard AI",
      "Compute SHA-256 evidence hashes in the Evidence vault"
    ]
  },
  {
    title: "Financial fraud containment",
    desc: "Immediately notify banking institutions and card issuers if card numbers, PINs, or UPI details were exposed.",
    icon: Lock,
    steps: [
      "Call bank customer care to freeze compromised debit/credit cards",
      "Block UPI IDs or reset UPI PIN via official banking apps",
      "Call National Cyber Crime Helpline at 1930 within the Golden Hour",
      "Register an official complaint on cybercrime.gov.in"
    ]
  },
  {
    title: "SIM swap & mobile verification",
    desc: "Monitor mobile carrier signals and prevent unauthorized telecom account takeovers.",
    icon: Smartphone,
    steps: [
      "Verify that your phone retains normal cellular network service",
      "Contact telecom operator immediately if no-signal persists unexpectedly",
      "Protect your carrier account with a customer service PIN",
      "Switch critical 2FA away from SMS to hardware keys or TOTP"
    ]
  }
];

export default function RecoveryPage() {
  const [selectedBook, setSelectedBook] = useState<number | null>(null);

  return (
    <ProtectedRoute>
      <div className="app-cg">
        <Sidebar />
        <div className="main-cg">
          <Header />
          <main className="content-cg">
            
            {/* Page Title */}
            <div className="page-title-cg">
              <div>
                <h1>Recovery Guide</h1>
                <p>Practical defensive steps after a suspicious URL or cyber incident.</p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <a 
                  href="tel:1930" 
                  className="btn-cg"
                  style={{ color: "var(--amber)", borderColor: "rgba(245,165,36,.3)" }}
                >
                  <PhoneCall size={14} />
                  <span>Helpline 1930</span>
                </a>
                <Link href="/analyzer" className="btn-cg primary">
                  Analyze URL
                </Link>
              </div>
            </div>

            {/* Emergency Hotline Notice */}
            <div className="notice-cg" style={{ marginBottom: 14 }}>
              <AlertTriangle size={14} style={{ verticalAlign: "middle", marginRight: 7 }} />
              <strong>Financial Incident Notice:</strong> If funds were stolen or unauthorized transactions occurred, dial <strong>1930</strong> immediately (Citizen Financial Cyber Fraud Reporting System) to freeze funds.
            </div>

            {/* 2-Column Playbooks Grid */}
            <div className="grid-cg grid2-cg">
              {playbooks.map((pb, idx) => {
                const Icon = pb.icon;
                const isSelected = selectedBook === idx;

                return (
                  <div className="card-cg" key={pb.title}>
                    <div className="card-body-cg" style={{ display: "flex", gap: 14 }}>
                      <div className="finding-icon-cg" style={{ width: 34, height: 34, borderRadius: 9 }}>
                        <Icon size={18} style={{ color: "var(--blue)" }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: 13, margin: "0 0 6px", color: "var(--text)" }}>
                          {pb.title}
                        </h3>
                        <p style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 10px" }}>
                          {pb.desc}
                        </p>

                        <button
                          type="button"
                          onClick={() => setSelectedBook(isSelected ? null : idx)}
                          className="btn-cg"
                          style={{ padding: "4px 8px", fontSize: 10 }}
                        >
                          {isSelected ? "Hide Checklist" : "View Steps"}
                        </button>

                        {isSelected && (
                          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 10, color: "var(--text)", lineHeight: 1.7 }}>
                              {pb.steps.map((st, sIdx) => (
                                <li key={sIdx}>{st}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
