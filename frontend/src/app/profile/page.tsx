"use client";

import React, { useState, useEffect } from "react";
import { User as UserIcon, Mail, Shield, Key, LogOut, CheckCircle2, AlertCircle, Save } from "lucide-react";
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
  const [name, setName] = useState(user?.name || "Analyst");
  const [email, setEmail] = useState(user?.email || "analyst@cyberguard.ai");
  const [role, setRole] = useState(user?.role || "user");
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

  // Hydrate profile data from API / Context
  useEffect(() => {
    if (user) {
      setName(user.name || "Analyst");
      setEmail(user.email || "analyst@cyberguard.ai");
      setRole(user.role || "user");
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
        setPasswordSuccess("Password changed successfully!");
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

  const initials = (name || "CG")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFC]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
            <div className="mb-8">
              <h1 className="text-3xl font-extrabold text-[#1F2937] tracking-tight">User Profile</h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">Manage account information, personal credentials, statistics, and security credentials.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* User Info Card */}
              <Card className="border-[#E5E7EB] bg-white shadow-sm p-6 flex flex-col items-center text-center space-y-4">
                <Avatar className="h-20 w-20 border-2 border-emerald-500">
                  <AvatarFallback className="bg-emerald-100 text-[#10B981] font-bold text-xl">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-base text-[#1F2937]">{name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{email}</p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
                  <Shield className="w-3.5 h-3.5 text-[#10B981]" /> Role: {role}
                </div>
                {createdAt && (
                  <p className="text-[11px] text-slate-400">
                    Member since {new Date(createdAt).toLocaleDateString()}
                  </p>
                )}
                <Button 
                  onClick={handleLogout}
                  variant="outline" 
                  size="sm" 
                  className="w-full border-red-200 text-red-600 hover:bg-red-50 text-xs mt-2 gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </Button>
              </Card>

              {/* Profile Details Card */}
              <Card className="md:col-span-2 border-[#E5E7EB] bg-white shadow-sm">
                <CardHeader className="pb-3 border-b border-[#E5E7EB]">
                  <CardTitle className="text-base font-bold text-[#1F2937]">Profile & Personal Details</CardTitle>
                  <CardDescription className="text-xs text-slate-500">Your account identity in CyberGuard AI</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {profileError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                      <span>{profileError}</span>
                    </div>
                  )}

                  {profileSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                      <span>{profileSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                        <div className="relative">
                          <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <Input 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            className="pl-9 bg-slate-50 border-[#E5E7EB] text-xs h-10 rounded-xl focus:ring-[#10B981]" 
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <Input 
                            value={email} 
                            disabled 
                            className="pl-9 bg-slate-100 border-[#E5E7EB] text-xs h-10 rounded-xl cursor-not-allowed opacity-80" 
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-xs text-slate-500">Department: Cyber Defense & Security Analytics</p>
                      <Button 
                        type="submit" 
                        disabled={isUpdatingProfile}
                        className="bg-[#10B981] hover:bg-[#059669] text-white text-xs px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {isUpdatingProfile ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Password Change Card */}
            <Card className="border-[#E5E7EB] bg-white shadow-sm">
              <CardHeader className="pb-3 border-b border-[#E5E7EB]">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#10B981]" />
                  <CardTitle className="text-base font-bold text-[#1F2937]">Update Security Password</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {passwordError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
                    <Input 
                      type="password" 
                      required 
                      value={oldPassword} 
                      onChange={(e) => setOldPassword(e.target.value)} 
                      placeholder="••••••••" 
                      className="bg-slate-50 border-[#E5E7EB] text-xs h-10 rounded-xl focus:ring-[#10B981]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                    <Input 
                      type="password" 
                      required 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      placeholder="••••••••" 
                      className="bg-slate-50 border-[#E5E7EB] text-xs h-10 rounded-xl focus:ring-[#10B981]"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <Button 
                      type="submit" 
                      disabled={isChangingPassword}
                      className="bg-[#10B981] hover:bg-[#059669] text-white text-xs px-5 py-2.5 rounded-xl font-semibold cursor-pointer"
                    >
                      {isChangingPassword ? "Updating..." : "Update Password"}
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
