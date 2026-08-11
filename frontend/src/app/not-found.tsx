"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#F8FAFC] text-[#1F2937] px-4 font-sans">
      <div className="w-full max-w-md text-center space-y-6 bg-white p-8 rounded-2xl border border-[#E5E7EB] shadow-sm">
        <div className="w-16 h-16 bg-red-50 text-red-500 border border-red-200 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-4xl font-extrabold text-[#1F2937] mb-2">404</h1>
          <h2 className="text-base font-bold text-slate-700">Page Not Found</h2>
          <p className="text-xs text-slate-500 mt-2">
            The requested security route does not exist or has been moved.
          </p>
        </div>
        <Link href="/analyzer" className="block pt-2">
          <Button className="w-full bg-[#10B981] hover:bg-[#059669] text-white text-xs h-10 rounded-xl font-semibold flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Return to Smart URL Analyzer
          </Button>
        </Link>
      </div>
    </div>
  );
}
