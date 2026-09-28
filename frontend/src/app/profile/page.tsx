"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  UserRound, 
  Mail, 
  ShieldCheck, 
  Lock, 
  Calendar, 
  Activity, 
  FileText, 
  ScanSearch, 
  LogOut, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RefreshCw, 
  Shield, 
  Clock, 
  Copy, 
  Check,
  Bot,
  FolderLock
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/context/auth-context";
import { userService } from "@/services/user.service";
import { analyzerService, type DashboardStats, type ScanResultData } from "@/services/analyzer.service";
import { reportService } from "@/services/report.service";
import { assistantService } from "@/services/assistant.service";
import { ThemeSegmentedControl } from "@/components/common/theme-toggle";
import { formatDate, getRelativeTime } from "@/utils/date";
import { getInitials } from "@/utils/format";
import type { IncidentReport } from "@/types";

interface AnalystActivity {
  id: string;
  type: "scan" | "report" | "assistant";
  title: string;
  detail: string;
  timestamp: string;
  badge?: string;
  badgeColor?: "green" | "blue" | "amber" | "red";
}

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();

  // Profile Information State
  const [profileName, setProfileName] = useState(user?.name || "");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Security & Metrics Data State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [totalReports, setTotalReports] = useState<number | null>(null);
  const [assistantUsage, setAssistantUsage] = useState<number | null>(null);
  const [evidenceCount, setEvidenceCount] = useState<number | null>(null);
  const [activities, setActivities] = useState<AnalystActivity[]>([]);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

  // Change Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Danger Zone Sign Out Modal State
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // User ID copied indicator
  const [copiedId, setCopiedId] = useState(false);

  // Sync state with current authenticated user
  useEffect(() => {
    if (user?.name) {
      setProfileName(user.name);
      if (!isEditing) {
        setEditName(user.name);
      }
    }
  }, [user?.name, isEditing]);

  // Load fresh profile and live security activity
  const loadProfileAndActivityData = useCallback(async () => {
    setIsLoadingMetrics(true);
    try {
      // 1. Fetch latest profile
      const profilePromise = userService.getProfile().catch(() => null);

      // 2. Fetch stats, scans, reports, assistant data concurrently
      const statsPromise = analyzerService.getDashboardStats().catch(() => null);
      const scansPromise = analyzerService.getScanHistory({ page: 1, limit: 6 }).catch(() => null);
      const reportsPromise = reportService.getReports({ page: 1, limit: 6 }).catch(() => null);
      const assistantPromise = assistantService.getSessions().catch(() => null);

      const [profileRes, statsRes, scansRes, reportsRes, assistantRes] = await Promise.all([
        profilePromise,
        statsPromise,
        scansPromise,
        reportsPromise,
        assistantPromise
      ]);

      // Update user state if profile API returned updated info
      if (profileRes?.data?.success && profileRes.data.user) {
        setProfileName(profileRes.data.user.name);
        updateUser(profileRes.data.user);
      }

      // Handle stats
      if (statsRes?.data?.success && statsRes.data.stats) {
        setStats(statsRes.data.stats);
      }

      // Handle reports count
      if (reportsRes?.data) {
        const reportCount = reportsRes.data.pagination?.total ?? (Array.isArray(reportsRes.data.data) ? reportsRes.data.data.length : null);
        setTotalReports(reportCount);
      }

      // Handle assistant sessions
      if (assistantRes?.data?.data && Array.isArray(assistantRes.data.data)) {
        setAssistantUsage(assistantRes.data.data.length);
      } else {
        setAssistantUsage(null);
      }

      // Derive evidence count from local evidence storage or scans with findings
      if (typeof window !== "undefined") {
        try {
          const storedEvidence = localStorage.getItem("cyberguard_evidence_ledger");
          if (storedEvidence) {
            const parsed = JSON.parse(storedEvidence);
            if (Array.isArray(parsed)) {
              setEvidenceCount(parsed.length);
            }
          }
        } catch {
          setEvidenceCount(null);
        }
      }

      // Build chronological activity list
      const combinedActivities: AnalystActivity[] = [];

      // Add recent scans
      if (scansRes?.data?.data && Array.isArray(scansRes.data.data)) {
        scansRes.data.data.forEach((scan: ScanResultData) => {
          const level = (scan.riskLevel || "SAFE").toUpperCase();
          const badgeColor: "green" | "blue" | "amber" | "red" = 
            level === "SAFE" ? "green" :
            level === "LOW" ? "blue" :
            level === "MODERATE" || level === "MEDIUM" ? "amber" : "red";

          combinedActivities.push({
            id: `scan-${scan.id || (scan as any)._id}`,
            type: "scan",
            title: "URL analyzed",
            detail: scan.url,
            timestamp: (scan as any).createdAt || (scan as any).analyzedAt || new Date().toISOString(),
            badge: level,
            badgeColor
          });
        });
      }

      // Add recent reports
      if (reportsRes?.data?.data && Array.isArray(reportsRes.data.data)) {
        reportsRes.data.data.forEach((rep: IncidentReport) => {
          combinedActivities.push({
            id: `report-${rep._id || rep.reportId}`,
            type: "report",
            title: "Incident report created",
            detail: rep.reportId || rep.title || "Report generated",
            timestamp: rep.createdAt || new Date().toISOString(),
            badge: rep.status || "REPORTED",
            badgeColor: "blue"
          });
        });
      }

      // Sort by descending timestamp
      combinedActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(combinedActivities.slice(0, 6));

    } catch (err) {
      console.error("Error loading profile or security metrics:", err);
    } finally {
      setIsLoadingMetrics(false);
    }
  }, [updateUser]);

  useEffect(() => {
    loadProfileAndActivityData();
  }, [loadProfileAndActivityData]);

  // Handle Profile Edit Initiation
  const handleStartEdit = () => {
    setEditName(profileName || user?.name || "");
    setProfileFeedback(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditName(profileName || user?.name || "");
    setProfileFeedback(null);
    setIsEditing(false);
  };

  // Handle Save Profile
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setProfileFeedback(null);

    const trimmed = editName.trim();
    if (!trimmed) {
      setProfileFeedback({ type: "error", message: "Full Name cannot be empty." });
      return;
    }

    setIsSavingProfile(true);

    try {
      const { data } = await userService.updateProfile({ name: trimmed });
      if (data.success && data.user) {
        setProfileName(data.user.name);
        updateUser(data.user);
        setIsEditing(false);
        setProfileFeedback({ type: "success", message: "Profile updated successfully." });
        setTimeout(() => setProfileFeedback(null), 4000);
      } else {
        setProfileFeedback({ type: "error", message: data.message || "Unable to update profile." });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Unable to update profile.";
      setProfileFeedback({ type: "error", message: msg });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Password Change Modal Submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (!currentPassword) {
      setPasswordFeedback({ type: "error", message: "Current password is required." });
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setPasswordFeedback({ type: "error", message: "New password must be at least 8 characters long." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: "error", message: "New passwords do not match." });
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordFeedback({ type: "error", message: "New password must be different from current password." });
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const { data } = await userService.changePassword({
        currentPassword,
        newPassword,
      });

      if (data.success) {
        setPasswordFeedback({ type: "success", message: "Password updated successfully." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setIsPasswordModalOpen(false);
          setPasswordFeedback(null);
        }, 1500);
      } else {
        setPasswordFeedback({ type: "error", message: data.message || "Unable to update password." });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Unable to update password.";
      setPasswordFeedback({ type: "error", message: msg });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Handle Danger Zone Sign Out
  const handleConfirmSignOut = async () => {
    setIsSigningOut(true);
    try {
      await logout();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    } catch {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    } finally {
      setIsSigningOut(false);
    }
  };

  // Helper formatting
  const displayName = profileName || user?.name || "Security Analyst";
  const displayEmail = user?.email || "analyst@cyberguard.ai";
  const userInitials = getInitials(displayName) || "SA";

  let formattedRole = "Security Analyst";
  if (user?.role) {
    const r = String(user.role).toLowerCase();
    if (r === "analyst") formattedRole = "Security Analyst";
    else if (r === "admin") formattedRole = "Security Administrator";
    else if (r === "investigator") formattedRole = "Forensic Investigator";
    else if (r === "viewer") formattedRole = "Security Observer";
    else if (r === "student") formattedRole = "Security Cadet";
    else formattedRole = r.charAt(0).toUpperCase() + r.slice(1);
  }

  let memberSince = "Not available";
  if (user?.createdAt) {
    try {
      const date = new Date(user.createdAt);
      if (!isNaN(date.getTime())) {
        memberSince = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
      }
    } catch {
      memberSince = "Not available";
    }
  }

  let fullCreatedDate = "Not available";
  if (user?.createdAt) {
    try {
      fullCreatedDate = formatDate(user.createdAt);
    } catch {
      fullCreatedDate = "Not available";
    }
  }

  const userId = user?.id || (user as any)?._id || "Not available";

  const handleCopyUserId = () => {
    if (userId && userId !== "Not available") {
      navigator.clipboard.writeText(userId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Determine email verification if backend provided it
  const emailVerified = (user as any)?.emailVerified;

  return (
    <ProtectedRoute>
      <div className="app-cg">
        <Sidebar />
        <div className="main-cg">
          <Header />
          <main className="content-cg" style={{ maxWidth: 1320, margin: "0 auto", width: "100%", padding: "24px 28px" }}>
            
            {/* =========================================================================
                3. PAGE HEADER
                ========================================================================= */}
            <div className="page-title-cg" style={{ alignItems: "center", marginBottom: 20 }}>
              <div>
                <h1>Profile & Account</h1>
                <p>Manage your analyst profile, account information, security, and application preferences.</p>
              </div>

              <div>
                {!isEditing ? (
                  <button 
                    onClick={handleStartEdit} 
                    className="btn-cg primary"
                    style={{ gap: 7 }}
                    id="edit-profile-btn"
                  >
                    <UserRound size={14} />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: 9 }}>
                    <button 
                      onClick={handleCancelEdit} 
                      className="btn-cg"
                      disabled={isSavingProfile}
                    >
                      <X size={13} />
                      <span>Cancel</span>
                    </button>
                    <button 
                      onClick={() => handleSaveProfile()} 
                      className="btn-cg primary"
                      disabled={isSavingProfile}
                    >
                      {isSavingProfile ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" />
                          <span>Saving changes...</span>
                        </>
                      ) : (
                        <>
                          <Check size={14} />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Global Alerts */}
            {profileFeedback && (
              <div 
                className="notice-cg" 
                style={{ 
                  marginBottom: 16,
                  borderColor: profileFeedback.type === "success" ? "rgba(22,199,132,.35)" : "rgba(239,68,68,.35)",
                  background: profileFeedback.type === "success" ? "rgba(22,199,132,.08)" : "rgba(239,68,68,.08)",
                  color: profileFeedback.type === "success" ? "var(--green)" : "var(--red)"
                }}
              >
                {profileFeedback.type === "success" ? (
                  <CheckCircle2 size={15} style={{ verticalAlign: "middle", marginRight: 8 }} />
                ) : (
                  <AlertCircle size={15} style={{ verticalAlign: "middle", marginRight: 8 }} />
                )}
                <span>{profileFeedback.message}</span>
              </div>
            )}

            {/* =========================================================================
                4. PROFILE OVERVIEW & 5. AVATAR
                ========================================================================= */}
            <div className="card-cg" style={{ marginBottom: 18 }}>
              <div className="card-head-cg" style={{ padding: "14px 20px" }}>
                <div>
                  <span className="section-tag-cg">PROFILE OVERVIEW</span>
                  <h3 style={{ fontSize: 13, marginTop: 2 }}>Analyst Credential Card</h3>
                </div>
                {!isEditing && (
                  <button 
                    onClick={handleStartEdit} 
                    className="btn-cg"
                    style={{ fontSize: 11, padding: "6px 11px" }}
                  >
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>

              <div className="card-body-cg" style={{ padding: "24px 22px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
                  
                  {/* Left: Avatar + Identity Info */}
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    {/* Circular Avatar */}
                    {user?.avatarUrl ? (
                      <div
                        style={{ 
                          width: 72, 
                          height: 72, 
                          borderRadius: "50%", 
                          overflow: "hidden",
                          position: "relative",
                          border: "2px solid var(--blue)",
                          boxShadow: "0 4px 20px rgba(52, 120, 255, 0.25)"
                        }}
                      >
                        <Image 
                          src={user.avatarUrl} 
                          alt={displayName} 
                          fill
                          unoptimized
                          style={{ objectFit: "cover" }} 
                        />
                      </div>
                    ) : (
                      <div 
                        style={{ 
                          width: 72, 
                          height: 72, 
                          borderRadius: "50%", 
                          background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
                          border: "2px solid rgba(52, 120, 255, 0.4)",
                          boxShadow: "0 6px 24px rgba(52, 120, 255, 0.28)",
                          color: "#FFFFFF",
                          display: "grid",
                          placeItems: "center",
                          fontSize: 24,
                          fontWeight: 800,
                          letterSpacing: ".04em",
                          flexShrink: 0
                        }}
                      >
                        {userInitials}
                      </div>
                    )}

                    {/* Metadata details */}
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "var(--text)" }}>
                          {displayName}
                        </h2>
                        <span className="badge-cg green" style={{ fontSize: 9, padding: "3px 9px" }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16c784", display: "inline-block" }} />
                          ACTIVE
                        </span>
                      </div>

                      <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600, marginTop: 4 }}>
                        {formattedRole}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                        <Mail size={13} />
                        <span>{displayEmail}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Membership metadata */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)" }}>
                      <Calendar size={14} />
                      <span>Member since: <strong style={{ color: "var(--text)" }}>{memberSince}</strong></span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--muted)" }}>
                      <ShieldCheck size={13} style={{ color: "var(--green)" }} />
                      <span>Session: <span style={{ color: "var(--green)", fontWeight: 600 }}>Secured</span></span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* =========================================================================
                6. ACCOUNT INFORMATION & 7. ACCOUNT SECURITY (2-Column Grid)
                ========================================================================= */}
            <div className="grid-cg grid2-cg" style={{ marginBottom: 18 }}>
              
              {/* Card 1: ACCOUNT INFORMATION */}
              <div className="card-cg" style={{ display: "flex", flexDirection: "column" }}>
                <div className="card-head-cg" style={{ padding: "14px 18px" }}>
                  <div>
                    <span className="section-tag-cg">IDENTITY DETAILS</span>
                    <h3 style={{ fontSize: 13, marginTop: 2 }}>ACCOUNT INFORMATION</h3>
                  </div>
                  {isEditing && (
                    <span className="badge-cg blue" style={{ fontSize: 9 }}>EDITING MODE</span>
                  )}
                </div>

                <div className="card-body-cg" style={{ padding: "18px 20px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    
                    {/* Full Name */}
                    <div>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>
                        Full Name
                      </label>
                      {isEditing ? (
                        <div style={{ position: "relative" }}>
                          <input 
                            type="text" 
                            className="input-cg" 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Enter analyst name"
                            required
                            style={{ paddingLeft: 34 }}
                            autoFocus
                          />
                          <UserRound size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
                        </div>
                      ) : (
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", padding: "7px 0" }}>
                          {displayName || "Not available"}
                        </div>
                      )}
                    </div>

                    {/* Email Address */}
                    <div>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>
                        Email Address
                      </label>
                      {isEditing ? (
                        <div>
                          <div style={{ position: "relative" }}>
                            <input 
                              type="email" 
                              className="input-cg" 
                              value={displayEmail}
                              disabled
                              style={{ paddingLeft: 34, opacity: 0.65, cursor: "not-allowed" }}
                            />
                            <Mail size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
                          </div>
                          <span style={{ display: "block", fontSize: 10, color: "var(--muted)", marginTop: 4 }}>
                            Email is bound to directory authentication and cannot be edited.
                          </span>
                        </div>
                      ) : (
                        <div style={{ fontSize: 13, color: "var(--text)", padding: "7px 0" }}>
                          {displayEmail || "Not available"}
                        </div>
                      )}
                    </div>

                    {/* Account Role */}
                    <div>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>
                        Account Role
                      </label>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                          {formattedRole}
                        </span>
                        <span className="badge-cg blue" style={{ fontSize: 9, padding: "2px 7px" }}>
                          SECURITY ANALYST
                        </span>
                      </div>
                    </div>

                    {/* Account Status */}
                    <div>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>
                        Account Status
                      </label>
                      <div style={{ padding: "7px 0" }}>
                        <span className="badge-cg green" style={{ fontSize: 10, padding: "3px 9px" }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16c784", display: "inline-block" }} />
                          Active
                        </span>
                      </div>
                    </div>

                    {/* User ID */}
                    <div>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>
                        User ID
                      </label>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0" }}>
                        <code style={{ fontSize: 11, fontFamily: "monospace", color: "var(--muted)", background: "var(--panel-2)", padding: "3px 8px", borderRadius: 5, border: "1px solid var(--line)" }}>
                          {userId}
                        </code>
                        {userId !== "Not available" && (
                          <button 
                            type="button" 
                            onClick={handleCopyUserId} 
                            className="btn-cg"
                            style={{ padding: "3px 7px", fontSize: 10 }}
                            title="Copy User ID"
                          >
                            {copiedId ? <Check size={11} style={{ color: "var(--green)" }} /> : <Copy size={11} />}
                            <span>{copiedId ? "Copied" : "Copy"}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Created Date */}
                    <div>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>
                        Created Date
                      </label>
                      <div style={{ fontSize: 12, color: "var(--text)", padding: "7px 0" }}>
                        {fullCreatedDate}
                      </div>
                    </div>

                    {/* Edit mode submission buttons inside card */}
                    {isEditing && (
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                        <button 
                          type="button" 
                          onClick={handleCancelEdit} 
                          className="btn-cg" 
                          disabled={isSavingProfile}
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="btn-cg primary" 
                          disabled={isSavingProfile}
                        >
                          {isSavingProfile ? "Saving changes..." : "Save Changes"}
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              </div>

              {/* Card 2: ACCOUNT SECURITY */}
              <div className="card-cg" style={{ display: "flex", flexDirection: "column" }}>
                <div className="card-head-cg" style={{ padding: "14px 18px" }}>
                  <div>
                    <span className="section-tag-cg">ACCESS & CREDENTIALS</span>
                    <h3 style={{ fontSize: 13, marginTop: 2 }}>ACCOUNT SECURITY</h3>
                  </div>
                  <span className="badge-cg green" style={{ fontSize: 9 }}>PROTECTED</span>
                </div>

                <div className="card-body-cg" style={{ padding: "18px 20px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    
                    {/* Password row */}
                    <div>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>
                        Password
                      </label>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 16, letterSpacing: "2px", color: "var(--text)" }}>••••••••••••</span>
                          <span style={{ fontSize: 10, color: "var(--muted)" }}>(Encrypted & Salted)</span>
                        </div>
                        <button 
                          onClick={() => {
                            setIsPasswordModalOpen(true);
                            setPasswordFeedback(null);
                          }}
                          className="btn-cg"
                          style={{ fontSize: 11, padding: "6px 12px" }}
                          id="change-password-btn"
                        >
                          <Key size={13} />
                          <span>Change Password</span>
                        </button>
                      </div>
                    </div>

                    {/* Authentication Type */}
                    <div>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>
                        Authentication
                      </label>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0" }}>
                        <ShieldCheck size={16} style={{ color: "var(--green)" }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Protected</span>
                        <span className="badge-cg green" style={{ fontSize: 9 }}>JWT BEARER</span>
                      </div>
                      <p style={{ margin: "4px 0 0", fontSize: 10, color: "var(--muted)" }}>
                        SOC authentication tokens are signed with cryptographic validation.
                      </p>
                    </div>

                    {/* Account Status */}
                    <div>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>
                        Account Status
                      </label>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Active</span>
                        <span className="badge-cg green" style={{ fontSize: 9 }}>● Operational</span>
                      </div>
                    </div>

                    {/* Email Verification - Only displayed if backend provided this information */}
                    {emailVerified !== undefined && (
                      <div>
                        <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>
                          Email Verification
                        </label>
                        <div style={{ padding: "7px 0" }}>
                          {emailVerified ? (
                            <span className="badge-cg green" style={{ fontSize: 9 }}>Verified</span>
                          ) : (
                            <span className="badge-cg amber" style={{ fontSize: 9 }}>Not Verified</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Security Notice Box */}
                    <div style={{ marginTop: 8, padding: "12px 14px", borderRadius: 8, background: "var(--panel-2)", border: "1px solid var(--line)" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <Lock size={15} style={{ color: "var(--blue)", marginTop: 2, flexShrink: 0 }} />
                        <div style={{ fontSize: 10, color: "var(--muted)", lineHeight: 1.5 }}>
                          <strong style={{ color: "var(--text)", display: "block", marginBottom: 2 }}>Credentials Protection Policy</strong>
                          Sensitive token hashes, API secrets, and encryption keys are strictly guarded and never exposed to the client console.
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

            </div>

            {/* =========================================================================
                9. SECURITY ACTIVITY (Stat Cards)
                ========================================================================= */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <span className="section-tag-cg">TELEMETRY & USAGE</span>
                  <h3 style={{ fontSize: 13, fontWeight: 600, margin: "2px 0 0", color: "var(--text)" }}>SECURITY ACTIVITY</h3>
                </div>
                <button 
                  onClick={loadProfileAndActivityData} 
                  className="btn-cg"
                  style={{ fontSize: 10, padding: "4px 8px" }}
                  title="Refresh activity metrics"
                  disabled={isLoadingMetrics}
                >
                  <RefreshCw size={11} className={isLoadingMetrics ? "animate-spin" : ""} />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="grid-cg grid4-cg">
                {/* 1. Total URL Scans */}
                <div className="card-cg stat-cg">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div className="label-cg">TOTAL URL SCANS</div>
                    <ScanSearch size={14} style={{ color: "var(--blue)" }} />
                  </div>
                  <div className="value-cg">
                    {isLoadingMetrics ? "..." : (stats?.totalScans ?? (activities.filter(a => a.type === "scan").length || "N/A"))}
                  </div>
                  <div className="sub-cg">Completed target scans</div>
                </div>

                {/* 2. Incident Reports */}
                <div className="card-cg stat-cg">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div className="label-cg">INCIDENT REPORTS</div>
                    <FileText size={14} style={{ color: "var(--green)" }} />
                  </div>
                  <div className="value-cg">
                    {isLoadingMetrics ? "..." : (totalReports ?? "N/A")}
                  </div>
                  <div className="sub-cg">Forensic incident reports</div>
                </div>

                {/* 3. AI Assistant Usage */}
                <div className="card-cg stat-cg">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div className="label-cg">AI ASSISTANT USAGE</div>
                    <Bot size={14} style={{ color: "var(--purple)" }} />
                  </div>
                  <div className="value-cg">
                    {isLoadingMetrics ? "..." : (assistantUsage !== null ? assistantUsage : "N/A")}
                  </div>
                  <div className="sub-cg">Interactive defensive queries</div>
                </div>

                {/* 4. Evidence Items */}
                <div className="card-cg stat-cg">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div className="label-cg">EVIDENCE ITEMS</div>
                    <FolderLock size={14} style={{ color: "var(--amber)" }} />
                  </div>
                  <div className="value-cg">
                    {isLoadingMetrics ? "..." : (evidenceCount !== null ? evidenceCount : "N/A")}
                  </div>
                  <div className="sub-cg">Chain-of-custody artifacts</div>
                </div>
              </div>
            </div>

            {/* =========================================================================
                10. RECENT ANALYST ACTIVITY
                ========================================================================= */}
            <div className="card-cg" style={{ marginBottom: 18 }}>
              <div className="card-head-cg" style={{ padding: "14px 18px" }}>
                <div>
                  <span className="section-tag-cg">CHRONOLOGICAL LOG</span>
                  <h3 style={{ fontSize: 13, marginTop: 2 }}>RECENT ANALYST ACTIVITY</h3>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Link href="/history" className="btn-cg" style={{ fontSize: 10, padding: "5px 10px" }}>
                    <span>All Scans</span>
                  </Link>
                  <Link href="/reports" className="btn-cg" style={{ fontSize: 10, padding: "5px 10px" }}>
                    <span>All Reports</span>
                  </Link>
                </div>
              </div>

              <div className="card-body-cg" style={{ padding: activities.length === 0 ? "24px" : "12px 18px" }}>
                {activities.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "24px 0", color: "var(--muted)", fontSize: 12 }}>
                    <Activity size={24} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                    <p style={{ margin: 0, fontWeight: 500 }}>No recent activity</p>
                    <span style={{ fontSize: 10 }}>Analyst operations, scans, and report actions will appear here.</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {activities.map((act) => {
                      const isScan = act.type === "scan";
                      const Icon = isScan ? Shield : FileText;
                      const relative = getRelativeTime(act.timestamp);

                      return (
                        <div 
                          key={act.id} 
                          className="provider-cg"
                          style={{ padding: "12px 0" }}
                        >
                          <div 
                            className="provider-icon-cg" 
                            style={{ 
                              color: isScan ? "var(--blue)" : "var(--green)",
                              background: "var(--panel-2)",
                              width: 32,
                              height: 32,
                              borderRadius: 8
                            }}
                          >
                            <Icon size={16} />
                          </div>

                          <div className="provider-main-cg" style={{ minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <strong style={{ fontSize: 12, color: "var(--text)" }}>{act.title}</strong>
                              {act.badge && (
                                <span className={`badge-cg ${act.badgeColor || "blue"}`} style={{ fontSize: 8, padding: "1px 6px" }}>
                                  {act.badge}
                                </span>
                              )}
                            </div>
                            <p 
                              style={{ 
                                margin: "3px 0 0", 
                                fontSize: 11, 
                                color: "var(--muted)", 
                                whiteSpace: "nowrap", 
                                overflow: "hidden", 
                                textOverflow: "ellipsis" 
                              }}
                              title={act.detail}
                            >
                              {act.detail}
                            </p>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "var(--muted)", flexShrink: 0 }}>
                            <Clock size={11} />
                            <span>{relative}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* =========================================================================
                11. PREFERENCES (Existing Theme System)
                ========================================================================= */}
            <div className="card-cg" style={{ marginBottom: 18 }}>
              <div className="card-head-cg" style={{ padding: "14px 18px" }}>
                <div>
                  <span className="section-tag-cg">INTERFACE & DISPLAY</span>
                  <h3 style={{ fontSize: 13, marginTop: 2 }}>PREFERENCES</h3>
                </div>
              </div>

              <div className="card-body-cg" style={{ padding: "20px 22px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Appearance</h4>
                    <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--muted)" }}>
                      Choose how CyberGuard AI looks across the application.
                    </p>
                  </div>

                  {/* Reusable Segmented Theme Control (Switches globally) */}
                  <div>
                    <ThemeSegmentedControl />
                  </div>
                </div>
              </div>
            </div>

            {/* =========================================================================
                15. DANGER ZONE
                ========================================================================= */}
            <div 
              style={{ 
                border: "1px solid rgba(239, 68, 68, 0.35)", 
                background: "rgba(239, 68, 68, 0.03)", 
                borderRadius: 11,
                overflow: "hidden"
              }}
            >
              <div 
                style={{ 
                  padding: "14px 18px", 
                  borderBottom: "1px solid rgba(239, 68, 68, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--red)", letterSpacing: ".08em", textTransform: "uppercase" }}>
                    SECURITY PERIMETER
                  </span>
                  <h3 style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 600, color: "var(--text)" }}>DANGER ZONE</h3>
                </div>
                <span className="badge-cg red" style={{ fontSize: 9 }}>SESSION TERMINATION</span>
              </div>

              <div style={{ padding: "18px 20px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Sign Out of Analyst Session</h4>
                    <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--muted)" }}>
                      Terminate your active authentication session and wipe local tokens on this browser.
                    </p>
                  </div>

                  <button 
                    onClick={() => setIsSignOutModalOpen(true)}
                    className="btn-cg"
                    style={{ 
                      borderColor: "rgba(239, 68, 68, 0.4)", 
                      color: "var(--red)",
                      background: "rgba(239, 68, 68, 0.08)",
                      gap: 7
                    }}
                    id="danger-sign-out-btn"
                  >
                    <LogOut size={13} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>

            {/* =========================================================================
                8. CHANGE PASSWORD MODAL DIALOG
                ========================================================================= */}
            {isPasswordModalOpen && (
              <div 
                style={{
                  position: "fixed",
                  inset: 0,
                  backgroundColor: "rgba(0, 0, 0, 0.65)",
                  backdropFilter: "blur(4px)",
                  display: "grid",
                  placeItems: "center",
                  zIndex: 9999,
                  padding: 16
                }}
                onClick={(e) => {
                  if (e.target === e.currentTarget && !isUpdatingPassword) {
                    setIsPasswordModalOpen(false);
                  }
                }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="change-password-modal-title"
              >
                <div 
                  className="card-cg"
                  style={{
                    width: "100%",
                    maxWidth: 440,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                    border: "1px solid var(--line)",
                    animation: "fadeIn 0.15s ease-out"
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="card-head-cg" style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <div className="provider-icon-cg" style={{ width: 28, height: 28, borderRadius: 7 }}>
                        <Key size={14} />
                      </div>
                      <div>
                        <h3 id="change-password-modal-title" style={{ fontSize: 13 }}>Change Password</h3>
                        <p style={{ fontSize: 10 }}>Update your master SOC account password</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => !isUpdatingPassword && setIsPasswordModalOpen(false)}
                      className="btn-cg"
                      style={{ padding: "4px 6px" }}
                      disabled={isUpdatingPassword}
                      aria-label="Close modal"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Modal Form */}
                  <form onSubmit={handlePasswordSubmit} style={{ padding: "18px 20px" }}>
                    {passwordFeedback && (
                      <div 
                        className="notice-cg"
                        style={{
                          marginBottom: 14,
                          borderColor: passwordFeedback.type === "success" ? "rgba(22,199,132,.35)" : "rgba(239,68,68,.35)",
                          background: passwordFeedback.type === "success" ? "rgba(22,199,132,.08)" : "rgba(239,68,68,.08)",
                          color: passwordFeedback.type === "success" ? "var(--green)" : "var(--red)"
                        }}
                      >
                        {passwordFeedback.type === "success" ? (
                          <CheckCircle2 size={14} style={{ verticalAlign: "middle", marginRight: 7 }} />
                        ) : (
                          <AlertCircle size={14} style={{ verticalAlign: "middle", marginRight: 7 }} />
                        )}
                        <span>{passwordFeedback.message}</span>
                      </div>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {/* Current Password */}
                      <div>
                        <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>
                          Current Password
                        </label>
                        <input 
                          type="password"
                          className="input-cg"
                          placeholder="••••••••"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                          disabled={isUpdatingPassword}
                          autoFocus
                        />
                      </div>

                      {/* New Password */}
                      <div>
                        <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>
                          New Password
                        </label>
                        <input 
                          type="password"
                          className="input-cg"
                          placeholder="At least 8 characters"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          minLength={8}
                          disabled={isUpdatingPassword}
                        />
                        <span style={{ fontSize: 9, color: "var(--muted)", display: "block", marginTop: 3 }}>
                          Must be at least 8 characters long and different from current password.
                        </span>
                      </div>

                      {/* Confirm New Password */}
                      <div>
                        <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>
                          Confirm New Password
                        </label>
                        <input 
                          type="password"
                          className="input-cg"
                          placeholder="Re-enter new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          disabled={isUpdatingPassword}
                        />
                      </div>
                    </div>

                    {/* Modal Actions */}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 9, marginTop: 20 }}>
                      <button 
                        type="button"
                        onClick={() => setIsPasswordModalOpen(false)}
                        className="btn-cg"
                        disabled={isUpdatingPassword}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="btn-cg primary"
                        disabled={isUpdatingPassword || !currentPassword || !newPassword || !confirmPassword}
                      >
                        {isUpdatingPassword ? (
                          <>
                            <RefreshCw size={13} className="animate-spin" />
                            <span>Updating Password...</span>
                          </>
                        ) : (
                          <span>Update Password</span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* =========================================================================
                15. DANGER ZONE CONFIRMATION MODAL
                ========================================================================= */}
            {isSignOutModalOpen && (
              <div 
                style={{
                  position: "fixed",
                  inset: 0,
                  backgroundColor: "rgba(0, 0, 0, 0.65)",
                  backdropFilter: "blur(4px)",
                  display: "grid",
                  placeItems: "center",
                  zIndex: 9999,
                  padding: 16
                }}
                onClick={(e) => {
                  if (e.target === e.currentTarget && !isSigningOut) {
                    setIsSignOutModalOpen(false);
                  }
                }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="sign-out-modal-title"
              >
                <div 
                  className="card-cg"
                  style={{
                    width: "100%",
                    maxWidth: 420,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                    border: "1px solid rgba(239, 68, 68, 0.4)",
                    animation: "fadeIn 0.15s ease-out"
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="card-head-cg" style={{ padding: "14px 18px", borderBottom: "1px solid rgba(239,68,68,0.2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <div 
                        className="provider-icon-cg" 
                        style={{ 
                          width: 28, 
                          height: 28, 
                          borderRadius: 7,
                          background: "rgba(239,68,68,0.12)",
                          color: "var(--red)"
                        }}
                      >
                        <AlertCircle size={15} />
                      </div>
                      <div>
                        <h3 id="sign-out-modal-title" style={{ fontSize: 13, color: "var(--red)" }}>Are you sure?</h3>
                        <p style={{ fontSize: 10 }}>Session termination request</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => !isSigningOut && setIsSignOutModalOpen(false)}
                      className="btn-cg"
                      style={{ padding: "4px 6px" }}
                      disabled={isSigningOut}
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div style={{ padding: "18px 20px" }}>
                    <p style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.5, margin: "0 0 8px" }}>
                      This action cannot be easily undone.
                    </p>
                    <p style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.5, margin: 0 }}>
                      You will be logged out of your CyberGuard AI session and redirected to the login gateway.
                    </p>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 9, marginTop: 22 }}>
                      <button 
                        type="button"
                        onClick={() => setIsSignOutModalOpen(false)}
                        className="btn-cg"
                        disabled={isSigningOut}
                      >
                        Cancel
                      </button>
                      <button 
                        type="button"
                        onClick={handleConfirmSignOut}
                        className="btn-cg"
                        style={{
                          background: "var(--red)",
                          borderColor: "var(--red)",
                          color: "#FFFFFF"
                        }}
                        disabled={isSigningOut}
                      >
                        {isSigningOut ? "Signing out..." : "Confirm"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
