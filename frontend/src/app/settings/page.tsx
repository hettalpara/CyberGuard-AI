"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Save, CheckCircle2, Shield, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [privacySharing, setPrivacySharing] = useState(false);
  const [autoScan, setAutoScan] = useState(true);
  const [language, setLanguage] = useState("English");
  const [themeMode, setThemeMode] = useState("Light Flat");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (theme === "dark") {
      setThemeMode("Dark Mode");
    } else {
      setThemeMode("Light Flat");
    }

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
  }, [theme]);

  const handleThemeChange = (newMode: string) => {
    setThemeMode(newMode);
    if (newMode === "Dark Mode") {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  };

  const handleSave = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "cyberguard_settings",
        JSON.stringify({
          notifications,
          privacySharing,
          autoScan,
          language,
          themeMode,
        })
      );
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-[#0B0F19]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
            
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-mono font-bold text-[10px] rounded border border-emerald-300 dark:border-emerald-800">
                  SYSTEM CONFIGURATION
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Environment & Operational Parameters
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-mono font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Platform Settings
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                Configure preferences for interface theme, threat notifications, privacy telemetry, and engine execution.
              </p>
            </div>

            <div className="space-y-6">
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm overflow-hidden">
                <CardHeader className="py-4 px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
                  <div className="flex items-center gap-2">
                    <SettingsIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Platform Preferences
                    </CardTitle>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-5 text-xs">
                  {/* Theme */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="font-mono font-bold block text-xs text-slate-900 dark:text-slate-100">
                        Theme Mode
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        Visual appearance theme for the cybersecurity console.
                      </span>
                    </div>
                    <select
                      value={themeMode}
                      onChange={(e) => handleThemeChange(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      <option value="Light Flat">Light Mode</option>
                      <option value="Dark Mode">Dark Mode (SOC)</option>
                    </select>
                  </div>

                  {/* Notifications */}
                  <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="font-mono font-bold block text-xs text-slate-900 dark:text-slate-100">
                        Threat Alert Banners
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        Receive high-priority alerts when high or critical threats are detected.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications}
                      onChange={(e) => setNotifications(e.target.checked)}
                      className="h-4 w-4 accent-emerald-600 rounded cursor-pointer"
                    />
                  </div>

                  {/* Security */}
                  <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="font-mono font-bold block text-xs text-slate-900 dark:text-slate-100">
                        Automatic Threat Engine Queries
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        Query Google Safe Browsing, VirusTotal, and URLhaus in parallel upon submission.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoScan}
                      onChange={(e) => setAutoScan(e.target.checked)}
                      className="h-4 w-4 accent-emerald-600 rounded cursor-pointer"
                    />
                  </div>

                  {/* Privacy */}
                  <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="font-mono font-bold block text-xs text-slate-900 dark:text-slate-100">
                        Anonymized Community Intelligence
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        Share anonymized indicators to improve collective threat detection models.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={privacySharing}
                      onChange={(e) => setPrivacySharing(e.target.checked)}
                      className="h-4 w-4 accent-emerald-600 rounded cursor-pointer"
                    />
                  </div>

                  {/* Language */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                    <div>
                      <span className="font-mono font-bold block text-xs text-slate-900 dark:text-slate-100">
                        Incident Report Language
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        Language synthesized for Gemini AI narrative explanations and incident reports.
                      </span>
                    </div>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi (हिंदी)</option>
                      <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex items-center gap-3 font-mono">
                <Button 
                  onClick={handleSave} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-5 h-9 rounded-lg font-bold flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Configuration</span>
                </Button>
                {saved && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
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
