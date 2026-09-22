import React from "react";
import { Bot, User } from "lucide-react";

export interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  isError?: boolean;
}

// ============================================================================
// Safe Markdown Formatter (No dangerouslySetInnerHTML)
// ============================================================================

function renderInlineTokens(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-slate-900">
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
    <div className="space-y-1.5 text-xs leading-relaxed">
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
              <span className="font-bold text-[#10B981] shrink-0 text-[11px]">{numMatch[1]}.</span>
              <div className="flex-1">{renderInlineTokens(numMatch[2])}</div>
            </div>
          );
        }

        // Bullet list item: "- ", "* ", "• "
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
          const bulletText = trimmed.replace(/^[-*•]\s+/, "");
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 my-0.5">
              <span className="text-[#10B981] font-bold shrink-0">•</span>
              <div className="flex-1">{renderInlineTokens(bulletText)}</div>
            </div>
          );
        }

        return <p key={idx}>{renderInlineTokens(trimmed)}</p>;
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
            ? "bg-[#111827]"
            : message.isError
            ? "bg-amber-600"
            : "bg-[#10B981]"
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div
        className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-3.5 ${
          isUser
            ? "bg-[#111827] text-white rounded-tr-none text-xs leading-relaxed"
            : message.isError
            ? "bg-amber-50 border border-amber-200 text-amber-900 rounded-tl-none font-medium"
            : "bg-slate-50 border border-[#E5E7EB] text-slate-800 rounded-tl-none"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.text}</p>
        ) : (
          <FormattedMessageContent content={message.text} />
        )}

        <div
          className={`text-[10px] mt-1.5 ${
            isUser ? "text-slate-400 text-right" : "text-slate-400"
          }`}
        >
          {message.timestamp}
        </div>
      </div>
    </div>
  );
}
