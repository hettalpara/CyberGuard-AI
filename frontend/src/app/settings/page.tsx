"use client";

import React, { useState } from "react";
import { Settings as SettingsIcon, Bell, Shield, Lock, Globe, Save, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [privacySharing, setPrivacySharing] = useState(false);
  const [autoScan, setAutoScan] = useState(true);
  const [language, setLanguage] = useState("English");
  const [themeMode, setThemeMode] = useState("Light Flat");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-[#1F2937] tracking-tight">Platform Settings</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">Configure preferences for theme, threat notifications, privacy, security, and language.</p>
          </div>

          <div className="space-y-6">
            {/* General & Security Preferences */}
            <Card className="border-[#E5E7EB] bg-white shadow-sm">
              <CardHeader className="pb-3 border-b border-[#E5E7EB]">
                <CardTitle className="text-sm font-bold text-[#1F2937]">Platform Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs text-slate-700 pt-4">
                {/* Theme */}
                <div className="flex items-center justify-between py-2 border-b border-[#E5E7EB]">
                  <div>
                    <span className="font-bold block text-sm text-[#1F2937]">Theme Style</span>
                    <span className="text-slate-500">Visual appearance theme for application interface.</span>
                  </div>
                  <select
                    value={themeMode}
                    onChange={(e) => setThemeMode(e.target.value)}
                    className="bg-slate-50 border border-[#E5E7EB] rounded-xl px-3 py-1.5 text-xs text-slate-700 font-semibold"
                  >
                    <option value="Light Flat">Light Flat (Default)</option>
                    <option value="Dark Mode">Dark Mode</option>
                  </select>
                </div>

                {/* Notifications */}
                <div className="flex items-center justify-between py-2 border-b border-[#E5E7EB]">
                  <div>
                    <span className="font-bold block text-sm text-[#1F2937]">Threat Notifications</span>
                    <span className="text-slate-500">Receive alert notifications for high-risk phishing URL detections.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications}
                    onChange={(e) => setNotifications(e.target.checked)}
                    className="h-4 w-4 accent-[#10B981] rounded"
                  />
                </div>

                {/* Security */}
                <div className="flex items-center justify-between py-2 border-b border-[#E5E7EB]">
                  <div>
                    <span className="font-bold block text-sm text-[#1F2937]">Automatic Safe Browsing API Check</span>
                    <span className="text-slate-500">Run background checks on external API threat endpoints automatically.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoScan}
                    onChange={(e) => setAutoScan(e.target.checked)}
                    className="h-4 w-4 accent-[#10B981] rounded"
                  />
                </div>

                {/* Privacy */}
                <div className="flex items-center justify-between py-2 border-b border-[#E5E7EB]">
                  <div>
                    <span className="font-bold block text-sm text-[#1F2937]">Privacy & Telemetry Sharing</span>
                    <span className="text-slate-500">Share anonymized URL threat metadata to improve community threat intelligence.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacySharing}
                    onChange={(e) => setPrivacySharing(e.target.checked)}
                    className="h-4 w-4 accent-[#10B981] rounded"
                  />
                </div>

                {/* Language */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <span className="font-bold block text-sm text-[#1F2937]">Language / Display Region</span>
                    <span className="text-slate-500">Select language for Gemini AI report explanation generation.</span>
                  </div>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-slate-50 border border-[#E5E7EB] rounded-xl px-3 py-1.5 text-xs text-slate-700 font-semibold"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi (हिंदी)</option>
                    <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex items-center gap-3">
              <Button onClick={handleSave} className="bg-[#10B981] hover:bg-[#059669] text-white text-xs px-6 h-10 rounded-xl font-semibold flex items-center gap-2">
                <Save className="w-4 h-4" /> Save Settings
              </Button>
              {saved && <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Settings saved successfully!</span>}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
