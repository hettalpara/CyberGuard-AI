"use client";

import React, { useState, useEffect } from "react";
import { User as UserIcon, Mail, Shield, Key, LogOut, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
      <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-[#0B0F19]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
            
            {/* Page Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-mono font-bold text-[10px] rounded border border-emerald-300 dark:border-emerald-800">
                  SECURITY ANALYST IDENTITY
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Access Credentials & Account Metadata
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-mono font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Analyst Profile
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                Manage your credentials, platform permissions, and authentication passwords.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Identity Card */}
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm p-6 flex flex-col items-center text-center space-y-4">
                <Avatar className="h-20 w-20 border-2 border-emerald-500 rounded-xl">
                  <AvatarFallback className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-mono font-bold text-xl rounded-xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-mono font-bold text-base text-slate-900 dark:text-slate-100">
                    {name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{email}</p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 rounded-md text-xs font-mono font-semibold">
                  <Shield className="w-3.5 h-3.5" /> Role: {role.toUpperCase()}
                </div>
                {createdAt && (
                  <p className="text-[11px] text-slate-400 font-mono">
                    Enrolled: {new Date(createdAt).toLocaleDateString()}
                  </p>
                )}
                <Button 
                  onClick={handleLogout}
                  variant="outline" 
                  size="sm" 
                  className="w-full border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-mono mt-2 gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </Button>
              </Card>

              {/* Edit Details Card */}
              <Card className="md:col-span-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm overflow-hidden">
                <CardHeader className="py-4 px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
                  <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Profile & Credentials
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                    Update analyst display name and work email
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6 space-y-4">
                  {profileError && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs rounded-lg flex items-center gap-2 font-mono">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                      <span>{profileError}</span>
                    </div>
                  )}

                  {profileSuccess && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs rounded-lg flex items-center gap-2 font-mono">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                      <span>{profileSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Full Name
                        </label>
                        <div className="relative">
                          <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <Input 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            className="pl-9 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-mono h-10 rounded-lg focus:ring-emerald-500" 
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <Input 
                            value={email} 
                            disabled
                            className="pl-9 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-xs font-mono h-10 rounded-lg opacity-70 cursor-not-allowed" 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={isUpdatingProfile}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold px-4 h-9 rounded-lg"
                      >
                        {isUpdatingProfile ? "Saving..." : "Update Profile"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Password Management Card */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm overflow-hidden">
              <CardHeader className="py-4 px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Security Credentials
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {passwordError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs rounded-lg flex items-center gap-2 font-mono">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs rounded-lg flex items-center gap-2 font-mono">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Current Master Password
                      </label>
                      <Input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="••••••••"
                        className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-mono h-10 rounded-lg focus:ring-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        New Master Password (8+ chars)
                      </label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-mono h-10 rounded-lg focus:ring-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={isChangingPassword || !oldPassword || !newPassword}
                      className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 text-xs font-mono font-bold px-4 h-9 rounded-lg"
                    >
                      {isChangingPassword ? "Updating..." : "Update Master Password"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
