"use client";

import React, { useState, useEffect } from "react";
import { User as UserIcon, Mail, Key, LogOut, CheckCircle2, AlertCircle } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/context/auth-context";
import { userService } from "@/services/user.service";

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || "Security Analyst");
  const [email, setEmail] = useState(user?.email || "analyst@cyberguard.ai");
  const [role, setRole] = useState(user?.role || "analyst");
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  // Profile update state
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password update state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || "Security Analyst");
      setEmail(user.email || "analyst@cyberguard.ai");
      setRole(user.role || "analyst");
    }

    const fetchLatestProfile = async () => {
      try {
        const { data } = await userService.getProfile();
        if (data.success && data.user) {
          setName(data.user.name);
          setEmail(data.user.email);
          setRole(data.user.role);
          if (data.user.createdAt) {
            setCreatedAt(data.user.createdAt);
          }
          updateUser(data.user);
        }
      } catch {
        // Fallback to existing auth user
      }
    };

    fetchLatestProfile();
  }, [user, updateUser]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);

    if (!name.trim()) {
      setProfileError("Name cannot be empty");
      return;
    }

    setIsUpdatingProfile(true);

    try {
      const { data } = await userService.updateProfile({ name: name.trim() });
      if (data.success && data.user) {
        updateUser(data.user);
        setProfileSuccess("Profile updated successfully!");
        setTimeout(() => setProfileSuccess(null), 3000);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to update profile";
      setProfileError(msg);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (!oldPassword) {
      setPasswordError("Current password is required");
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    if (oldPassword === newPassword) {
      setPasswordError("New password must be different from current");
      return;
    }

    setIsChangingPassword(true);

    try {
      const { data } = await userService.changePassword({
        currentPassword: oldPassword,
        newPassword,
      });
      if (data.success) {
        setPasswordSuccess("Password updated successfully!");
        setOldPassword("");
        setNewPassword("");
        setTimeout(() => setPasswordSuccess(null), 3000);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to change password";
      setPasswordError(msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  const initials = (name || "SA")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <ProtectedRoute>
      <div className="app-cg">
        <Sidebar />
        <div className="main-cg">
          <Header />
          <main className="content-cg" style={{ maxWidth: 1240, margin: "0 auto", width: "100%", padding: "20px 24px" }}>
            
            {/* Page Title */}
            <div className="page-title-cg" style={{ marginBottom: 16 }}>
              <div>
                <span className="section-tag-cg">SECURITY ANALYST IDENTITY</span>
                <h1 style={{ fontSize: 22, fontWeight: 700 }}>Analyst Profile</h1>
                <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                  Manage your credentials, platform permissions, and authentication passwords.
                </p>
              </div>
            </div>

            {/* Profile Single-Screen 3-Column Grid */}
            <div className="profile-grid-cg">
              
              {/* Card 1: Identity Summary */}
              <div className="card-cg" style={{ display: "flex", flexDirection: "column" }}>
                <div 
                  className="card-body-cg" 
                  style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    alignItems: "center", 
                    textAlign: "center", 
                    padding: "20px 18px",
                    flex: 1,
                    justifyContent: "space-between"
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div 
                      style={{ 
                        width: 60, 
                        height: 60, 
                        borderRadius: 14, 
                        background: "linear-gradient(145deg, #2774ff, #6a45ff)", 
                        boxShadow: "0 6px 24px rgba(45,104,255,.25)", 
                        color: "white", 
                        display: "grid", 
                        placeItems: "center", 
                        fontSize: 20, 
                        fontWeight: 800,
                        marginBottom: 12
                      }}
                    >
                      {initials}
                    </div>

                    <strong style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
                      {name}
                    </strong>
                    <span style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, wordBreak: "break-all" }}>
                      {email}
                    </span>

                    <div style={{ marginTop: 10 }}>
                      <span className="badge-cg blue" style={{ fontSize: 9, padding: "4px 10px" }}>
                        ROLE: {role.toUpperCase()}
                      </span>
                    </div>

                    {createdAt && (
                      <span style={{ fontSize: 10, color: "var(--muted)", marginTop: 10 }}>
                        Enrolled: {new Date(createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <button 
                    onClick={handleLogout}
                    className="btn-cg"
                    style={{ 
                      width: "100%", 
                      justifyContent: "center", 
                      marginTop: 18, 
                      borderColor: "rgba(239,68,68,0.3)", 
                      color: "#ff7777",
                      padding: "8px 12px",
                      fontSize: 11
                    }}
                  >
                    <LogOut size={13} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>

              {/* Card 2: Profile Details */}
              <div className="card-cg" style={{ display: "flex", flexDirection: "column" }}>
                <div className="card-head-cg" style={{ padding: "12px 16px" }}>
                  <div>
                    <h3 style={{ fontSize: 12 }}>Profile & Credentials</h3>
                    <p style={{ fontSize: 9 }}>Update analyst display name and work email</p>
                  </div>
                </div>

                <div className="card-body-cg" style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <form onSubmit={handleProfileUpdate} style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {profileError && (
                        <div className="notice-cg" style={{ borderColor: "rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.08)", color: "#ff7777", padding: "8px 10px", fontSize: 10 }}>
                          <AlertCircle size={13} style={{ verticalAlign: "middle", marginRight: 6 }} />
                          {profileError}
                        </div>
                      )}

                      {profileSuccess && (
                        <div className="notice-cg" style={{ borderColor: "rgba(22,199,132,0.35)", background: "rgba(22,199,132,0.08)", color: "#50e3a4", padding: "8px 10px", fontSize: 10 }}>
                          <CheckCircle2 size={13} style={{ verticalAlign: "middle", marginRight: 6 }} />
                          {profileSuccess}
                        </div>
                      )}

                      <div>
                        <label 
                          style={{ 
                            display: "block", 
                            fontSize: 10, 
                            fontWeight: 700, 
                            color: "var(--muted)", 
                            textTransform: "uppercase", 
                            letterSpacing: ".06em", 
                            marginBottom: 5 
                          }}
                        >
                          Full Name
                        </label>
                        <div style={{ position: "relative" }}>
                          <input 
                            type="text"
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            className="input-cg"
                            style={{ paddingLeft: 32 }}
                            required
                          />
                          <UserIcon size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
                        </div>
                      </div>

                      <div>
                        <label 
                          style={{ 
                            display: "block", 
                            fontSize: 10, 
                            fontWeight: 700, 
                            color: "var(--muted)", 
                            textTransform: "uppercase", 
                            letterSpacing: ".06em", 
                            marginBottom: 5 
                          }}
                        >
                          Email Address
                        </label>
                        <div style={{ position: "relative" }}>
                          <input 
                            type="email"
                            value={email} 
                            disabled
                            className="input-cg"
                            style={{ paddingLeft: 32, opacity: 0.65, cursor: "not-allowed" }}
                          />
                          <Mail size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                      <button 
                        type="submit" 
                        disabled={isUpdatingProfile}
                        className="btn-cg primary"
                        style={{ padding: "8px 14px", fontSize: 11 }}
                      >
                        <span>{isUpdatingProfile ? "Saving..." : "Update Profile"}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Card 3: Security Credentials */}
              <div className="card-cg" style={{ display: "flex", flexDirection: "column" }}>
                <div className="card-head-cg" style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div className="provider-icon-cg" style={{ width: 24, height: 24 }}>
                      <Key size={13} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 12 }}>Security Credentials</h3>
                      <p style={{ fontSize: 9 }}>Update master authentication password</p>
                    </div>
                  </div>
                </div>

                <div className="card-body-cg" style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {passwordError && (
                        <div className="notice-cg" style={{ borderColor: "rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.08)", color: "#ff7777", padding: "8px 10px", fontSize: 10 }}>
                          <AlertCircle size={13} style={{ verticalAlign: "middle", marginRight: 6 }} />
                          {passwordError}
                        </div>
                      )}

                      {passwordSuccess && (
                        <div className="notice-cg" style={{ borderColor: "rgba(22,199,132,0.35)", background: "rgba(22,199,132,0.08)", color: "#50e3a4", padding: "8px 10px", fontSize: 10 }}>
                          <CheckCircle2 size={13} style={{ verticalAlign: "middle", marginRight: 6 }} />
                          {passwordSuccess}
                        </div>
                      )}

                      <div>
                        <label 
                          style={{ 
                            display: "block", 
                            fontSize: 10, 
                            fontWeight: 700, 
                            color: "var(--muted)", 
                            textTransform: "uppercase", 
                            letterSpacing: ".06em", 
                            marginBottom: 5 
                          }}
                        >
                          Current Master Password
                        </label>
                        <input
                          type="password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          placeholder="••••••••"
                          className="input-cg"
                          required
                        />
                      </div>

                      <div>
                        <label 
                          style={{ 
                            display: "block", 
                            fontSize: 10, 
                            fontWeight: 700, 
                            color: "var(--muted)", 
                            textTransform: "uppercase", 
                            letterSpacing: ".06em", 
                            marginBottom: 5 
                          }}
                        >
                          New Master Password (8+ chars)
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="input-cg"
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                      <button
                        type="submit"
                        disabled={isChangingPassword || !oldPassword || !newPassword}
                        className="btn-cg primary"
                        style={{ padding: "8px 14px", fontSize: 11 }}
                      >
                        <span>{isChangingPassword ? "Updating..." : "Update Password"}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>

            </div>

          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
