"use client";

import React from "react";
import { Bot, User } from "lucide-react";

export interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  isError?: boolean;
}

function renderInlineTokens(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-slate-900 dark:text-slate-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function FormattedMessageContent({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-1.5 text-xs leading-relaxed font-mono">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Numbered list item: "1. ", "2. "
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 my-0.5">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0 text-[11px]">{numMatch[1]}.</span>
              <div className="flex-1 font-sans">{renderInlineTokens(numMatch[2])}</div>
            </div>
          );
        }

        // Bullet list item: "- ", "* ", "• "
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
          const bulletText = trimmed.replace(/^[-*•]\s+/, "");
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 my-0.5">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">•</span>
              <div className="flex-1 font-sans">{renderInlineTokens(bulletText)}</div>
            </div>
          );
        }

        return <p key={idx} className="font-sans">{renderInlineTokens(trimmed)}</p>;
      })}
    </div>
  );
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.sender === "user";

  return (
    <div
      className={`flex items-start gap-2.5 sm:gap-3 ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      <div
        className={`p-2 rounded-xl text-white shrink-0 ${
          isUser
            ? "bg-slate-900 dark:bg-slate-800"
            : message.isError
            ? "bg-amber-600"
            : "bg-emerald-600"
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div
        className={`max-w-[85%] sm:max-w-[80%] rounded-xl p-3.5 ${
          isUser
            ? "bg-slate-900 dark:bg-slate-800 text-white rounded-tr-none text-xs leading-relaxed font-sans"
            : message.isError
            ? "bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 rounded-tl-none font-medium"
            : "bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.text}</p>
        ) : (
          <FormattedMessageContent content={message.text} />
        )}

        <div
          className={`text-[10px] mt-1.5 font-mono ${
            isUser ? "text-slate-400 text-right" : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {message.timestamp}
        </div>
      </div>
    </div>
  );
}
