"use client";

import React from "react";
import { Send, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ScanContextState } from "./scan-context-banner";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: (text?: string) => void;
  disabled?: boolean;
  activeScan?: ScanContextState | null;
}

export function ChatInput({
  input,
  setInput,
  onSend,
  disabled = false,
  activeScan,
}: ChatInputProps) {
  return (
    <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
        className="flex items-center gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            activeScan
              ? "Ask about this scan..."
              : "Ask about phishing, scam links, account recovery, or cybercrime reporting..."
          }
          disabled={disabled}
          maxLength={4000}
          className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg text-xs h-10 font-mono focus:ring-emerald-500"
        />
        <Button
          type="submit"
          disabled={disabled || !input.trim()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 px-4 rounded-lg text-xs font-mono font-semibold shrink-0 cursor-pointer disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
      <div className="mt-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-mono text-center flex items-center justify-center gap-1.5">
        <Shield className="w-3 h-3 text-emerald-600 shrink-0" />
        <span>
          CyberGuard AI provides defensive cybersecurity guidance. Never disclose passwords, OTPs, or private financial credentials.
        </span>
      </div>
    </div>
  );
}
