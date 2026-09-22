import React from "react";
import { Send } from "lucide-react";
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
    <div className="p-3 border-t border-[#E5E7EB] bg-white">
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
              ? "Ask about this URL's score, indicators, or security advice..."
              : "Ask about phishing, scam links, account recovery, or cybercrime reporting..."
          }
          disabled={disabled}
          maxLength={4000}
          className="bg-slate-50 border-[#E5E7EB] rounded-xl text-xs h-10 focus:ring-[#10B981] focus:border-[#10B981]"
        />
        <Button
          type="submit"
          disabled={disabled || !input.trim()}
          className="bg-[#10B981] hover:bg-[#059669] text-white h-10 px-4 rounded-xl text-xs font-semibold shrink-0 cursor-pointer disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
      <div className="mt-1 text-[10px] text-slate-400 text-center">
        CyberGuard AI Assistant provides defensive security guidance. Never share sensitive passwords or private banking OTPs.
      </div>
    </div>
  );
}
