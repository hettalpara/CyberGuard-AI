"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { 
  ArrowRight, 
  Bot, 
  RotateCcw, 
  Sparkles, 
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { assistantService } from "@/services/assistant.service";
import {
  ScanContextBanner,
  ChatMessage,
  ChatInput,
  type Message,
  type ScanContextState,
} from "@/components/assistant";

interface AssistantChatResponse {
  message?: string;
  data?: { content?: string };
  content?: string;
  context?: {
    scanId?: string;
    url?: string;
    riskScore?: number | null;
    riskLevel?: string;
    threatType?: string;
  };
}

// ============================================================================
// Assistant Page Component
// ============================================================================

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init_1",
      sender: "assistant",
      text: "Hello! I am CyberGuard AI, your defensive cybersecurity assistant. I can help you understand cyber threats, protect your accounts, respond to scam messages or phishing links, explain scan reports, and preserve evidence for reporting.",
      timestamp: "Just now"
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeScan, setActiveScan] = useState<ScanContextState | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Parse scanId from URL query string if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const scanId = params.get("scanId");
      if (scanId) {
        setActiveScan({ scanId });
        setMessages([
          {
            id: `scan_init_${Date.now()}`,
            sender: "assistant",
            text: `I have loaded your scan report (#${scanId.slice(-6).toUpperCase()}). You can ask me why this URL received its risk score, what indicators were flagged, or what immediate precautions to take.`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ]);
      }
    }
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Quick Action questions
  const defaultQuickActions = [
    "Explain phishing",
    "Check a suspicious message",
    "What should I do after clicking a scam link?",
    "How do I secure my account?",
    "How do I report cybercrime?",
    "What should I do if I entered my password?"
  ];

  const scanQuickActions = [
    "Why is this URL risky?",
    "What should I do right now?",
    "Explain the URL indicators",
    "Is the SSL certificate trustworthy?"
  ];

  const activeActions = activeScan ? scanQuickActions : defaultQuickActions;

  const handleClearChat = () => {
    setActiveScan(null);
    setStatusNotice(null);
    setMessages([
      {
        id: `reset_${Date.now()}`,
        sender: "assistant",
        text: "How can I help with your cybersecurity? Ask any question about phishing, suspicious links, account safety, or incident response.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
  };

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isTyping) return;

    setStatusNotice(null);

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setIsTyping(true);

    try {
      // Build conversation history (excluding system greetings and errors)
      const history = messages
        .filter((m) => !m.isError)
        .slice(-10)
        .map((m) => ({
          role: m.sender,
          content: m.text,
        }));

      const response = await assistantService.sendMessage({
        message: query.trim(),
        scanId: activeScan?.scanId,
        conversationHistory: history,
      });

      const rawData = response.data as unknown as AssistantChatResponse;
      const replyText =
        rawData?.message ||
        rawData?.data?.content ||
        rawData?.content ||
        "I have analyzed your request. Ensure MFA is enabled across your accounts and never share OTPs or passwords.";

      // Update scan context banner if backend provided fresh scan metadata
      if (rawData?.context) {
        setActiveScan((prev) => ({
          scanId: rawData.context?.scanId || prev?.scanId || "",
          url: rawData.context?.url || prev?.url,
          riskScore: rawData.context?.riskScore ?? prev?.riskScore,
          riskLevel: rawData.context?.riskLevel || prev?.riskLevel,
          threatType: rawData.context?.threatType || prev?.threatType,
        }));
      }

      const botMsg: Message = {
        id: `bot_${Date.now()}`,
        sender: "assistant",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: unknown) {
      console.warn("[ASSISTANT_UI] Backend error:", err);
      let errorMsg = "Unable to reach the AI assistant. Please try again.";

      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const errBody = err.response?.data as { errorCode?: string; message?: string } | undefined;

        if (status === 401) {
          errorMsg = "Your session has expired. Please sign in again to use the assistant.";
        } else if (status === 403) {
          errorMsg = "You do not have permission to access the specified scan report.";
          setActiveScan(null);
        } else if (status === 429) {
          errorMsg = "Too many requests. Please wait a moment and try again.";
          setStatusNotice("Rate limit active: Maximum 20 requests per minute.");
        } else if (status === 503 || errBody?.errorCode === "AI_UNAVAILABLE") {
          errorMsg = "AI assistance is temporarily unavailable. You can still use the URL Analyzer and its deterministic security results.";
        } else if (errBody?.message) {
          errorMsg = errBody.message;
        }
      }

      const botMsg: Message = {
        id: `err_${Date.now()}`,
        sender: "assistant",
        text: errorMsg,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isError: true,
      };

      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFC]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-3 sm:p-5 lg:p-6 max-w-4xl mx-auto w-full flex flex-col h-[calc(100vh-4rem)]">
            
            {/* Header & Title Section */}
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-[#10B981] font-bold text-[11px] rounded-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Defensive Cybersecurity AI
                  </span>
                  {activeScan && (
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold text-[11px] rounded-md border border-blue-200">
                      Scan Context Active
                    </span>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#1F2937] tracking-tight">CyberGuard AI Assistant</h1>
                <p className="text-slate-500 text-xs mt-0.5">
                  Get practical guidance for cybersecurity threats, scams, suspicious links, and account security.
                </p>
              </div>

              <Button
                onClick={handleClearChat}
                variant="outline"
                size="sm"
                className="text-slate-600 border-[#E5E7EB] hover:bg-slate-100 text-xs h-8 px-3 rounded-xl flex items-center gap-1.5 shrink-0 cursor-pointer"
                title="Start a new chat session"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Chat</span>
              </Button>
            </div>

            {/* Active Scan Context Banner */}
            {activeScan && (
              <ScanContextBanner
                activeScan={activeScan}
                onExit={() => setActiveScan(null)}
              />
            )}

            {/* Status / Rate limit alert banner */}
            {statusNotice && (
              <div className="mb-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{statusNotice}</span>
              </div>
            )}

            {/* Quick Actions Carousel / Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
              {activeActions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  disabled={isTyping}
                  className="px-3 py-1.5 bg-white border border-[#E5E7EB] hover:border-[#10B981] hover:bg-emerald-50/50 rounded-lg text-left text-xs font-medium text-slate-700 transition flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-2xs group disabled:opacity-50 cursor-pointer"
                >
                  <span>{q}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-[#10B981] shrink-0" />
                </button>
              ))}
            </div>

            {/* Chat Bubble Container */}
            <Card className="flex-1 border-[#E5E7EB] bg-white shadow-sm flex flex-col overflow-hidden rounded-2xl">
              <CardContent className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex items-center gap-2.5 text-xs text-slate-500 italic p-2 bg-emerald-50/50 rounded-xl border border-emerald-100/60 w-fit">
                    <Bot className="w-4 h-4 text-[#10B981] animate-spin" />
                    <span>CyberGuard AI is analyzing...</span>
                  </div>
                )}

                <div ref={chatBottomRef} />
              </CardContent>

              {/* Chat Input Field */}
              <ChatInput
                input={input}
                setInput={setInput}
                onSend={handleSend}
                disabled={isTyping}
                activeScan={activeScan}
              />
            </Card>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
