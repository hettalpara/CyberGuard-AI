"use client";

import React, { useState } from "react";
import { User, Mail, Shield, Key, LogOut, Search, Activity, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function ProfilePage() {
  const [name, setName] = useState("Virani Pritkumar");
  const [email, setEmail] = useState("prit.virani@depstar.ac.in");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saved, setSaved] = useState(false);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setOldPassword("");
    setNewPassword("");
    setTimeout(() => setSaved(false), 3000);
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  return (
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
            <Card className="border-[#E5E7EB] bg-white shadow-sm md:col-span-1 text-center p-6">
              <Avatar className="w-20 h-20 mx-auto mb-4 border-2 border-[#10B981]">
                <AvatarFallback className="bg-emerald-100 text-[#10B981] font-bold text-xl">VP</AvatarFallback>
              </Avatar>
              <h2 className="font-bold text-[#1F2937] text-base">{name}</h2>
              <p className="text-xs text-slate-500 mb-3">{email}</p>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-[#10B981] border border-emerald-200 rounded-md text-[11px] font-semibold">
                Major Project Lead (DEPSTAR)
              </span>
              <div className="mt-6 pt-4 border-t border-[#E5E7EB]">
                <Button 
                  onClick={handleLogout}
                  variant="outline" 
                  className="w-full border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold h-9 rounded-xl flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Log Out
                </Button>
              </div>
            </Card>

            {/* Analysis Statistics Card */}
            <Card className="border-[#E5E7EB] bg-white shadow-sm md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-[#1F2937]">Analysis Statistics</CardTitle>
                <CardDescription className="text-xs text-slate-500">Summary of security URL scan activities</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-xl bg-slate-50 border border-[#E5E7EB]">
                  <Search className="w-5 h-5 text-[#10B981] mx-auto mb-1" />
                  <div className="text-xl font-bold text-[#1F2937]">128</div>
                  <div className="text-[11px] text-slate-500 font-medium">Total Scans</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-[#E5E7EB]">
                  <Shield className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                  <div className="text-xl font-bold text-emerald-600">94</div>
                  <div className="text-[11px] text-slate-500 font-medium">Safe URLs</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-[#E5E7EB]">
                  <Activity className="w-5 h-5 text-red-600 mx-auto mb-1" />
                  <div className="text-xl font-bold text-red-600">34</div>
                  <div className="text-[11px] text-slate-500 font-medium">Threats Flagged</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Change Password Card */}
          <Card className="border-[#E5E7EB] bg-white shadow-sm mb-8">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-[#1F2937]">Change Password</CardTitle>
              <CardDescription className="text-xs text-slate-500">Update your account login password.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
                  <Input 
                    type="password" 
                    value={oldPassword} 
                    onChange={(e) => setOldPassword(e.target.value)} 
                    placeholder="••••••••" 
                    className="bg-slate-50 border-[#E5E7EB] text-xs h-10 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                  <Input 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    placeholder="••••••••" 
                    className="bg-slate-50 border-[#E5E7EB] text-xs h-10 rounded-xl"
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Button type="submit" className="bg-[#10B981] hover:bg-[#059669] text-white text-xs px-5 py-2.5 rounded-xl font-semibold">
                    Update Password
                  </Button>
                  {saved && <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Password updated!</span>}
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
