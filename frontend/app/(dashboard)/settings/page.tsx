"use client";

import React, { useState } from "react";
import { useTheme } from "next-themes";
import { 
  Settings, 
  Sun, 
  Moon, 
  Laptop, 
  Bell, 
  ShieldAlert, 
  Lock, 
  Globe, 
  Info, 
  Save, 
  Loader2, 
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  
  // Local state for notification checks
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    pushNotifications: false,
    criticalThreatsOnly: true
  });

  // Local state for privacy checks
  const [privacy, setPrivacy] = useState({
    logHistory: true,
    shareThreatData: false
  });

  const [language, setLanguage] = useState("en");

  const handleSaveSettings = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success("Security platform configuration saved.");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gradient-cyber">Platform Configuration</h1>
        <p className="text-sm text-muted-foreground">
          Manage system notification outputs, privacy controls, translation parameters, and UI themes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Columns - Theme & Language */}
        <div className="space-y-6">
          {/* Theme Selector */}
          <Card className="border-border bg-card/65 cyber-glow-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Sun className="h-4.5 w-4.5 text-primary" /> Core Application Theme
              </CardTitle>
              <CardDescription className="text-xs">Adjust interface display parameters</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-3">
              {[
                { id: "light", label: "Light", icon: Sun },
                { id: "dark", label: "Dark", icon: Moon },
                { id: "system", label: "System", icon: Laptop }
              ].map((t) => {
                const isActive = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-md border text-xs font-semibold cursor-pointer transition-all gap-1.5",
                      isActive 
                        ? "bg-primary/10 text-primary border-primary/40 shadow-sm" 
                        : "text-muted-foreground hover:text-foreground bg-accent/20 border-border"
                    )}
                  >
                    <t.icon className="h-4.5 w-4.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Language Settings */}
          <Card className="border-border bg-card/65 cyber-glow-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Globe className="h-4.5 w-4.5 text-primary" /> Regional & Translation
              </CardTitle>
              <CardDescription className="text-xs">Translate platform labels and reporting forms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground" htmlFor="lang">Platform Language</label>
                <select
                  id="lang"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full h-9 rounded-md bg-accent/20 border border-border text-xs px-3 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="en" className="bg-card">English (US)</option>
                  <option value="es" className="bg-card">Español (ES)</option>
                  <option value="fr" className="bg-card">Français (FR)</option>
                  <option value="hi" className="bg-card">हिन्दी (IN)</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* About Section */}
          <Card className="border-border bg-card/65 cyber-glow-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Info className="h-4.5 w-4.5 text-primary" /> System Specification
              </CardTitle>
              <CardDescription className="text-xs">Software parameters and university project license</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground leading-relaxed">
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span>Platform Version</span>
                <span className="font-semibold text-foreground">0.1.0 (Alpha Build)</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span>UI Engine Core</span>
                <span className="font-semibold text-foreground">Next.js 16 (Turbopack)</span>
              </div>
              <p className="pt-2 text-[10px]">
                CyberGuard AI is developed as a Major University Project in Cybersecurity Diagnostics & Response Automation.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Columns - Notifications & Privacy */}
        <div className="space-y-6">
          {/* Notifications config */}
          <Card className="border-border bg-card/65 cyber-glow-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Bell className="h-4.5 w-4.5 text-primary" /> Notification Dispatchers
              </CardTitle>
              <CardDescription className="text-xs">Toggle target channels for security alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              {[
                { key: "emailAlerts", label: "Incident Dispatch Emails", desc: "Receive formal details when new threat logs are registered" },
                { key: "pushNotifications", label: "Push Notification logs", desc: "Receive immediate browser prompts during active scans" },
                { key: "criticalThreatsOnly", label: "Restrict to Critical alerts", desc: "Mute warning items unless scoring surpasses risk index 70" }
              ].map((notif) => (
                <div 
                  key={notif.key} 
                  onClick={() => setNotifications({ ...notifications, [notif.key]: !notifications[notif.key as keyof typeof notifications] })}
                  className="flex items-start justify-between cursor-pointer group"
                >
                  <div className="space-y-0.5 max-w-[80%]">
                    <div className="font-semibold group-hover:text-primary transition-colors">{notif.label}</div>
                    <div className="text-[10px] text-muted-foreground">{notif.desc}</div>
                  </div>
                  <div className={cn(
                    "w-9 h-5 rounded-full p-0.5 transition-colors relative mt-1 shrink-0",
                    notifications[notif.key as keyof typeof notifications] ? "bg-primary" : "bg-accent/40"
                  )}>
                    <div className={cn(
                      "w-4 h-4 rounded-full bg-card shadow-sm transition-transform",
                      notifications[notif.key as keyof typeof notifications] && "translate-x-4"
                    )} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Privacy and log audit storage */}
          <Card className="border-border bg-card/65 cyber-glow-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Lock className="h-4.5 w-4.5 text-primary" /> Privacy & Audit Vault
              </CardTitle>
              <CardDescription className="text-xs">Manage threat telemetry storage limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              {[
                { key: "logHistory", label: "Persist Scan History Vault", desc: "Allow local storage index mapping to track threat trends" },
                { key: "shareThreatData", label: "Share Anonymous Telemetry", desc: "Contribute identified threat domains to security threat datasets" }
              ].map((priv) => (
                <div 
                  key={priv.key} 
                  onClick={() => setPrivacy({ ...privacy, [priv.key]: !privacy[priv.key as keyof typeof privacy] })}
                  className="flex items-start justify-between cursor-pointer group"
                >
                  <div className="space-y-0.5 max-w-[80%]">
                    <div className="font-semibold group-hover:text-primary transition-colors">{priv.label}</div>
                    <div className="text-[10px] text-muted-foreground">{priv.desc}</div>
                  </div>
                  <div className={cn(
                    "w-9 h-5 rounded-full p-0.5 transition-colors relative mt-1 shrink-0",
                    privacy[priv.key as keyof typeof privacy] ? "bg-primary" : "bg-accent/40"
                  )}>
                    <div className={cn(
                      "w-4 h-4 rounded-full bg-card shadow-sm transition-transform",
                      privacy[priv.key as keyof typeof privacy] && "translate-x-4"
                    )} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Global Save Actions Footer */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
        <Button 
          onClick={handleSaveSettings} 
          disabled={isSaving}
          className="h-10 px-6 font-semibold shadow-md cyber-glow-border relative overflow-hidden"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              Saving parameters...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-1.5" />
              Commit Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
