"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Save, 
  CheckCircle2, 
  Settings as SettingsIcon,
  Palette,
  Bell,
  ShieldCheck,
  User as UserIcon,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { ThemeSegmentedControl } from "@/components/common/theme-toggle";
import { useAuth } from "@/context/auth-context";

export default function SettingsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [privacySharing, setPrivacySharing] = useState(false);
  const [autoScan, setAutoScan] = useState(true);
  const [language, setLanguage] = useState("English");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("cyberguard_settings");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.notifications !== undefined) setNotifications(parsed.notifications);
          if (parsed.privacySharing !== undefined) setPrivacySharing(parsed.privacySharing);
          if (parsed.autoScan !== undefined) setAutoScan(parsed.autoScan);
          if (parsed.language) setLanguage(parsed.language);
        } catch {}
      }
    }
  }, []);

  const handleSave = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "cyberguard_settings",
        JSON.stringify({
          notifications,
          privacySharing,
          autoScan,
          language,
        })
      );
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col lg:flex-row bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
            
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-primary-blue/10 text-primary-blue font-mono font-bold text-[10px] rounded border border-primary-blue/20">
                  SYSTEM CONFIGURATION
                </span>
                <span className="text-[11px] font-mono text-text-secondary">
                  SOC Operational Preferences
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-mono font-bold text-text-primary tracking-tight">
                Settings
              </h1>
              <p className="text-text-secondary text-xs sm:text-sm mt-0.5">
                Manage your profile, visual appearance, real-time alert notifications, and security analysis parameters.
              </p>
            </div>

            <div className="space-y-5">
              {/* Profile Card */}
              <Card className="border-border bg-card shadow-xs overflow-hidden">
                <CardHeader className="py-3.5 px-5 border-b border-border bg-card-elevated/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-primary-blue" />
                      <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider text-text-primary">
                        Profile & Identity
                      </CardTitle>
                    </div>
                    <Link 
                      href="/profile" 
                      className="text-xs text-primary-blue hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      Manage Account <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="font-semibold text-text-primary">{user?.name || user?.fullName || "Security Analyst"}</p>
                      <p className="text-text-secondary font-mono text-[11px]">{user?.email || "analyst@cyberguard.ai"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-text-secondary border border-border">
                        Role: {user?.role ? (user.role === "student" ? "Cyber Student / Analyst" : String(user.role).toUpperCase()) : "Security Analyst"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Appearance Section */}
              <Card className="border-border bg-card shadow-xs overflow-hidden">
                <CardHeader className="py-3.5 px-5 border-b border-border bg-card-elevated/40">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-primary-blue" />
                    <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider text-text-primary">
                      Appearance
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs text-text-secondary">
                    Configure interface color theme. Synchronized globally across all platform modules.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="font-semibold text-text-primary block">
                        Platform Theme
                      </span>
                      <span className="text-text-secondary text-[11px]">
                        Switch between Dark Cybersecurity SOC theme and high-contrast Light mode.
                      </span>
                    </div>
                    {/* Synchronized Theme Segmented Control [ Dark ] [ Light ] */}
                    <ThemeSegmentedControl />
                  </div>
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card className="border-border bg-card shadow-xs overflow-hidden">
                <CardHeader className="py-3.5 px-5 border-b border-border bg-card-elevated/40">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary-blue" />
                    <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider text-text-primary">
                      Notifications
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-text-primary block">
                        Threat Alert Banners
                      </span>
                      <span className="text-text-secondary text-[11px]">
                        Display urgent alert banners when high or critical risk URLs are analyzed.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications}
                      onChange={(e) => setNotifications(e.target.checked)}
                      className="h-4 w-4 accent-primary-blue rounded cursor-pointer"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Security & Analysis */}
              <Card className="border-border bg-card shadow-xs overflow-hidden">
                <CardHeader className="py-3.5 px-5 border-b border-border bg-card-elevated/40">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary-blue" />
                    <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider text-text-primary">
                      Security Engine Preferences
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div>
                      <span className="font-semibold text-text-primary block">
                        Automatic Multi-Engine Queries
                      </span>
                      <span className="text-text-secondary text-[11px]">
                        Query Google Safe Browsing, VirusTotal, and URLhaus in parallel upon scan submission.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoScan}
                      onChange={(e) => setAutoScan(e.target.checked)}
                      className="h-4 w-4 accent-primary-blue rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div>
                      <span className="font-semibold text-text-primary block">
                        Telemetry & Threat Sharing
                      </span>
                      <span className="text-text-secondary text-[11px]">
                        Contribute anonymized IOC indicators to community defensive intelligence feeds.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={privacySharing}
                      onChange={(e) => setPrivacySharing(e.target.checked)}
                      className="h-4 w-4 accent-primary-blue rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                    <div>
                      <span className="font-semibold text-text-primary block">
                        Incident Report Synthesis Language
                      </span>
                      <span className="text-text-secondary text-[11px]">
                        Select language format for synthesized AI explanations and incident briefs.
                      </span>
                    </div>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="bg-card-elevated border border-border rounded-lg px-3 py-1.5 text-xs font-mono font-medium text-text-primary cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-blue"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi (हिंदी)</option>
                      <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex items-center gap-3 font-mono pt-2">
                <Button 
                  onClick={handleSave} 
                  className="bg-primary-blue hover:bg-primary-blue/90 text-white text-xs px-5 h-9 rounded-lg font-bold flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Preferences</span>
                </Button>
                {saved && (
                  <span className="text-xs text-success font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Configuration updated!</span>
                  </span>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
