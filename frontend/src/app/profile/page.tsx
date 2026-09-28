"use client";

import React, { useState, useEffect } from "react";
import { User as UserIcon, Mail, Shield, Key, LogOut, CheckCircle2, AlertCircle } from "lucide-react";
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
        setTimeout(() => setProfileSuccess(null), 3500);
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
      setPasswordError("Please enter your current password");
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long");
      return;
    }

    if (oldPassword === newPassword) {
      setPasswordError("New password must be different from current password");
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
        setTimeout(() => setPasswordSuccess(null), 4000);
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
          <main className="content-cg" style={{ maxWidth: 1240, margin: "0 auto", width: "100%" }}>
            
            {/* Page Title */}
            <div className="page-title-cg" style={{ marginBottom: 22 }}>
              <div>
                <span className="section-tag-cg">SECURITY ANALYST IDENTITY</span>
                <h1 style={{ fontSize: 24, fontWeight: 700 }}>Analyst Profile</h1>
                <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                  Manage your credentials, platform permissions, and authentication passwords.
                </p>
              </div>
            </div>

            {/* Notifications */}
            {profileError && (
              <div 
                className="notice-cg" 
                style={{ 
                  borderColor: "rgba(239,68,68,0.35)", 
                  background: "rgba(239,68,68,0.08)", 
                  color: "#ff7777", 
                  marginBottom: 16 
                }}
              >
                <AlertCircle size={15} style={{ verticalAlign: "middle", marginRight: 8 }} />
                {profileError}
              </div>
            )}

            {profileSuccess && (
              <div 
                className="notice-cg" 
                style={{ 
                  borderColor: "rgba(22,199,132,0.35)", 
                  background: "rgba(22,199,132,0.08)", 
                  color: "#50e3a4", 
                  marginBottom: 16 
                }}
              >
                <CheckCircle2 size={15} style={{ verticalAlign: "middle", marginRight: 8 }} />
                {profileSuccess}
              </div>
            )}

            {/* Profile Grid */}
            <div className="grid-cg" style={{ gridTemplateColumns: "280px 1fr", gap: 20, marginBottom: 20 }}>
              
              {/* Identity Summary Card */}
              <div className="card-cg" style={{ height: "fit-content" }}>
                <div 
                  className="card-body-cg" 
                  style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    alignItems: "center", 
                    textAlign: "center", 
                    padding: 24 
                  }}
                >
                  <div 
                    style={{ 
                      width: 72, 
                      height: 72, 
                      borderRadius: 16, 
                      background: "linear-gradient(145deg, #2774ff, #6a45ff)", 
                      boxShadow: "0 8px 30px rgba(45,104,255,.28)", 
                      color: "white", 
                      display: "grid", 
                      placeItems: "center", 
                      fontSize: 24, 
                      fontWeight: 800,
                      marginBottom: 14
                    }}
                  >
                    {initials}
                  </div>
                  <strong style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
                    {name}
                  </strong>
                  <span style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, wordBreak: "break-all" }}>
                    {email}
                  </span>

                  <div style={{ marginTop: 14 }}>
                    <span className="badge-cg blue" style={{ fontSize: 10, padding: "5px 12px" }}>
                      ROLE: {role.toUpperCase()}
                    </span>
                  </div>

                  {createdAt && (
                    <span style={{ fontSize: 11, color: "var(--muted)", marginTop: 12 }}>
                      Enrolled: {new Date(createdAt).toLocaleDateString()}
                    </span>
                  )}

                  <button 
                    onClick={handleLogout}
                    className="btn-cg"
                    style={{ 
                      width: "100%", 
                      justifyContent: "center", 
                      marginTop: 20, 
                      borderColor: "rgba(239,68,68,0.3)", 
                      color: "#ff7777" 
                    }}
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>

              {/* Edit Profile Card */}
              <div className="card-cg">
                <div className="card-head-cg">
                  <div>
                    <h3>Profile & Credentials</h3>
                    <p>Update analyst display name and work email</p>
                  </div>
                </div>

                <div className="card-body-cg">
                  <form onSubmit={handleProfileUpdate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div className="grid-cg grid2-cg">
                      <div>
                        <label 
                          style={{ 
                            display: "block", 
                            fontSize: 11, 
                            fontWeight: 700, 
                            color: "var(--muted)", 
                            textTransform: "uppercase", 
                            letterSpacing: ".06em", 
                            marginBottom: 6 
                          }}
                        >
                          Full Name
                        </label>
                        <input 
                          type="text"
                          value={name} 
                          onChange={(e) => setName(e.target.value)} 
                          className="input-cg"
                          required
                        />
                      </div>

                      <div>
                        <label 
                          style={{ 
                            display: "block", 
                            fontSize: 11, 
                            fontWeight: 700, 
                            color: "var(--muted)", 
                            textTransform: "uppercase", 
                            letterSpacing: ".06em", 
                            marginBottom: 6 
                          }}
                        >
                          Email Address
                        </label>
                        <input 
                          type="email"
                          value={email} 
                          disabled
                          className="input-cg"
                          style={{ opacity: 0.65, cursor: "not-allowed" }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                      <button 
                        type="submit" 
                        disabled={isUpdatingProfile}
                        className="btn-cg primary"
                      >
                        <span>{isUpdatingProfile ? "Saving..." : "Update Profile"}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>

            </div>

            {/* Password Management Card */}
            <div className="card-cg">
              <div className="card-head-cg">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="provider-icon-cg">
                    <Key size={16} />
                  </div>
                  <div>
                    <h3>Security Credentials</h3>
                    <p>Manage and update your master authentication password</p>
                  </div>
                </div>
              </div>

              <div className="card-body-cg">
                {passwordError && (
                  <div 
                    className="notice-cg" 
                    style={{ 
                      borderColor: "rgba(239,68,68,0.35)", 
                      background: "rgba(239,68,68,0.08)", 
                      color: "#ff7777", 
                      marginBottom: 16 
                    }}
                  >
                    <AlertCircle size={15} style={{ verticalAlign: "middle", marginRight: 8 }} />
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div 
                    className="notice-cg" 
                    style={{ 
                      borderColor: "rgba(22,199,132,0.35)", 
                      background: "rgba(22,199,132,0.08)", 
                      color: "#50e3a4", 
                      marginBottom: 16 
                    }}
                  >
                    <CheckCircle2 size={15} style={{ verticalAlign: "middle", marginRight: 8 }} />
                    {passwordSuccess}
                  </div>
                )}

                <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div className="grid-cg grid2-cg">
                    <div>
                      <label 
                        style={{ 
                          display: "block", 
                          fontSize: 11, 
                          fontWeight: 700, 
                          color: "var(--muted)", 
                          textTransform: "uppercase", 
                          letterSpacing: ".06em", 
                          marginBottom: 6 
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
                          fontSize: 11, 
                          fontWeight: 700, 
                          color: "var(--muted)", 
                          textTransform: "uppercase", 
                          letterSpacing: ".06em", 
                          marginBottom: 6 
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

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                    <button
                      type="submit"
                      disabled={isChangingPassword || !oldPassword || !newPassword}
                      className="btn-cg primary"
                    >
                      <span>{isChangingPassword ? "Updating..." : "Update Master Password"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
