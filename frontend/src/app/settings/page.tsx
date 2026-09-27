"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Save, 
  CheckCircle2, 
  ExternalLink
} from "lucide-react";
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
  const [activeSection, setActiveSection] = useState<string | null>("Appearance");

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

  const sections = [
    { id: "Profile", title: "Profile", desc: "Manage your user identity, analyst role, and account credentials." },
    { id: "Appearance", title: "Appearance", desc: "Configure dark/light visual theme and cybersecurity console palette." },
    { id: "Notifications", title: "Notifications", desc: "Manage high-severity threat alert banners and scan completion updates." },
    { id: "Security", title: "Security", desc: "Manage automated multi-provider queries, telemetry, and reporting language." },
  ];

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
                <h1>Settings</h1>
                <p>Application preferences and account configuration.</p>
              </div>
              <button 
                onClick={handleSave} 
                className="btn-cg primary"
                style={{ gap: 6 }}
              >
                <Save size={13} />
                <span>Save Changes</span>
              </button>
            </div>

            {saved && (
              <div className="notice-cg" style={{ borderColor: "rgba(22,199,132,.3)", color: "var(--green)", background: "rgba(22,199,132,.07)", marginBottom: 14 }}>
                <CheckCircle2 size={14} style={{ verticalAlign: "middle", marginRight: 7 }} />
                Preferences updated and persisted successfully!
              </div>
            )}

            {/* Main Settings Card */}
            <div className="card-cg">
              <div className="card-head-cg">
                <div>
                  <h3>Platform Configuration</h3>
                  <p>Customize your workspace parameters</p>
                </div>
              </div>

              <div className="card-body-cg" style={{ padding: 0 }}>
                {sections.map((sec) => {
                  const isOpen = activeSection === sec.id;

                  return (
                    <div key={sec.id} style={{ borderBottom: "1px solid var(--line)" }}>
                      <div 
                        className="finding-cg" 
                        style={{ padding: "14px 17px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                        onClick={() => setActiveSection(isOpen ? null : sec.id)}
                      >
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: 13, margin: "0 0 3px", color: "var(--text)" }}>{sec.title}</h4>
                          <p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>{sec.desc}</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <button 
                            type="button" 
                            className="btn-cg" 
                            style={{ padding: "5px 10px", fontSize: 10 }}
                          >
                            {isOpen ? "Close" : "Configure"}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Content for each section */}
                      {isOpen && (
                        <div style={{ padding: "14px 17px", background: "var(--panel-2)", borderTop: "1px solid var(--line)" }}>
                          {sec.id === "Profile" && (
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                              <div>
                                <strong style={{ fontSize: 12, display: "block" }}>{user?.name || user?.fullName || "Talpara Het"}</strong>
                                <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace" }}>{user?.email || "het@cyberguard.ai"}</span>
                                <div style={{ marginTop: 4 }}>
                                  <span className="badge-cg blue">{user?.role ? (user.role === "student" ? "24DCS132" : String(user.role).toUpperCase()) : "24DCS132"}</span>
                                </div>
                              </div>
                              <Link href="/profile" className="btn-cg">
                                Open Profile Page <ExternalLink size={12} />
                              </Link>
                            </div>
                          )}

                          {sec.id === "Appearance" && (
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                              <div>
                                <span style={{ fontSize: 12, fontWeight: 600, display: "block" }}>Theme Mode</span>
                                <span style={{ fontSize: 10, color: "var(--muted)" }}>Switch between Dark Cybersecurity SOC palette and Light Mode.</span>
                              </div>
                              <ThemeSegmentedControl />
                            </div>
                          )}

                          {sec.id === "Notifications" && (
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <span style={{ fontSize: 12, fontWeight: 600, display: "block" }}>Threat Alert Banners</span>
                                <span style={{ fontSize: 10, color: "var(--muted)" }}>Display banner notifications for high and critical findings.</span>
                              </div>
                              <input
                                type="checkbox"
                                checked={notifications}
                                onChange={(e) => setNotifications(e.target.checked)}
                                style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--blue)" }}
                              />
                            </div>
                          )}

                          {sec.id === "Security" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                  <span style={{ fontSize: 12, fontWeight: 600, display: "block" }}>Automatic Multi-Engine Queries</span>
                                  <span style={{ fontSize: 10, color: "var(--muted)" }}>Query Google Safe Browsing, VirusTotal, and URLhaus in parallel.</span>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={autoScan}
                                  onChange={(e) => setAutoScan(e.target.checked)}
                                  style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--blue)" }}
                                />
                              </div>

                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                  <span style={{ fontSize: 12, fontWeight: 600, display: "block" }}>Telemetry Sharing</span>
                                  <span style={{ fontSize: 10, color: "var(--muted)" }}>Share anonymized IOC indicators to community feeds.</span>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={privacySharing}
                                  onChange={(e) => setPrivacySharing(e.target.checked)}
                                  style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--blue)" }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
