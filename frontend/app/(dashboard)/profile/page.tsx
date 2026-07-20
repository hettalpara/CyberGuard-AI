"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  User, 
  Mail, 
  Building, 
  ShieldCheck, 
  Activity, 
  Lock, 
  Key, 
  FileText, 
  Globe, 
  Save, 
  Loader2, 
  Info,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

export default function ProfilePage() {
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: "Security Analyst AD",
    email: "analyst@cyberguard.ai",
    phone: "+1 (555) 019-2834",
    department: "Incident Forensics Response Cell",
    bio: "Lead forensic operations analyst specializing in static signature heuristics audits and automated regulatory PDF reporting compliance."
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success("Security user profile parameters updated successfully.");
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New password verification keys do not match.");
      return;
    }
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    toast.success("Security access password key updated successfully.");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gradient-cyber">User Clearance Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage security access profiles, verification certificates, and update analyst logs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Card - Avatar & Stats */}
        <div className="lg:col-span-1 space-y-6">
          {/* Avatar Details */}
          <Card className="border-border bg-card/65 text-center cyber-glow-border">
            <CardContent className="pt-6">
              <Avatar className="h-24 w-24 mx-auto border-2 border-primary/40 shadow-xl">
                <AvatarImage src="/avatar-placeholder.jpg" />
                <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">AD</AvatarFallback>
              </Avatar>
              <h2 className="text-base font-bold mt-4">{profileData.fullName}</h2>
              <p className="text-[10px] sm:text-xs text-primary font-semibold uppercase tracking-wider mt-1">Lead Forensic Analyst</p>
              <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] font-mono text-emerald-500 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-full w-fit mx-auto">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Security Clearance Level 4</span>
              </div>
            </CardContent>
          </Card>

          {/* Stats Details */}
          <Card className="border-border bg-card/65 cyber-glow-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Activity className="h-4.5 w-4.5 text-primary" /> Analyst Operations Metric
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-primary" /> Threat Scans Completed</span>
                <span className="font-bold">412</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-primary" /> Dossiers Compiled</span>
                <span className="font-bold">18</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-primary" /> Incident Duty Joined</span>
                <span className="font-semibold text-muted-foreground">Jul 2026</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Cards - Profile Details & Security Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Details Form */}
          <Card className="border-border bg-card/65 cyber-glow-border">
            <CardHeader>
              <CardTitle className="text-base font-bold">Operator Profile Credentials</CardTitle>
              <CardDescription className="text-xs">Update profile information for internal communication</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground" htmlFor="fullName">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
                      <Input
                        id="fullName"
                        value={profileData.fullName}
                        onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                        className="pl-9 text-xs bg-accent/20 border-border"
                        disabled={isSaving}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground" htmlFor="email">Clearance Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        disabled
                        className="pl-9 text-xs bg-accent/10 border-border opacity-70 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground" htmlFor="phone">Phone Number</label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="text-xs bg-accent/20 border-border"
                      disabled={isSaving}
                    />
                  </div>

                  {/* Department */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground" htmlFor="department">Department</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
                      <Input
                        id="department"
                        value={profileData.department}
                        onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                        className="pl-9 text-xs bg-accent/20 border-border"
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="bio">Analyst Bio</label>
                  <textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    rows={4}
                    className="w-full rounded-md bg-accent/20 border border-border p-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                    disabled={isSaving}
                  />
                </div>

                <Button type="submit" size="sm" className="h-9 px-4 font-semibold shadow-md" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
                  Save Credentials
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Security Settings - Password Change */}
          <Card className="border-border bg-card/65 cyber-glow-border">
            <CardHeader>
              <CardTitle className="text-base font-bold">Access Code Override</CardTitle>
              <CardDescription className="text-xs">Rotate security verification passwords keys</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Current Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground" htmlFor="currentPassword">Current Access Key</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
                      <Input
                        id="currentPassword"
                        type="password"
                        placeholder="••••••••"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="pl-9 text-xs bg-accent/20 border-border"
                        disabled={isSaving}
                      />
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground" htmlFor="newPassword">New Access Key</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="••••••••"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="pl-9 text-xs bg-accent/20 border-border"
                        disabled={isSaving}
                      />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground" htmlFor="confirmPassword">Confirm Key</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="pl-9 text-xs bg-accent/20 border-border"
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                </div>

                <Button type="submit" size="sm" className="h-9 px-4 font-semibold shadow-md" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
                  Change Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
