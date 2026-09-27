"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { 
  Bot, 
  Send, 
  RotateCcw, 
  RefreshCw
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { assistantService } from "@/services/assistant.service";
import { ScanContextBanner, type ScanContextState } from "@/components/assistant";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  isError?: boolean;
}

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init_1",
      sender: "assistant",
      text: "I can explain a scan, help interpret threat-intelligence results, and suggest defensive next steps.",
      timestamp: "Just now"
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeScan, setActiveScan] = useState<ScanContextState | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const scanId = params.get("scanId");
      const url = params.get("url");
      const riskScoreStr = params.get("riskScore");
      const riskLevel = params.get("riskLevel");

      if (scanId && url) {
        const score = riskScoreStr ? parseInt(riskScoreStr, 10) : null;
        setActiveScan({
          scanId,
          url,
          riskScore: isNaN(score as number) ? null : score,
          riskLevel: riskLevel || "UNKNOWN",
        });

        setMessages((prev) => [
          ...prev,
          {
            id: `ctx_${Date.now()}`,
            sender: "assistant",
            text: `I've loaded context for URL "${url}". Risk Score: ${score ?? "N/A"}/100 (${riskLevel || "UNKNOWN"}). Ask me anything about this investigation!`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ]);
      }
    }
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || isTyping) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInput("");
    setIsTyping(true);

    try {
      const res = await assistantService.sendMessage({
        message: textToSend.trim(),
        scanId: activeScan?.scanId,
        contextUrl: activeScan?.url,
      });

      const replyContent =
        res.data?.data?.content ||
        (res.data as any)?.content ||
        res.data?.message ||
        "I have processed your query. Let me know if you need additional mitigation guidance.";

      const botMsg: Message = {
        id: `bot_${Date.now()}`,
        sender: "assistant",
        text: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: unknown) {
      console.error("Assistant query failed:", err);
      let errorMsg = "Unable to connect to AI assistant. Please try again shortly.";

      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 429) {
          errorMsg = "Rate limit reached. Please wait a moment before sending another query.";
        } else if (status === 503) {
          errorMsg = "AI assistance is temporarily unavailable. Deterministic scan results remain active.";
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: "assistant",
          text: errorMsg,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isError: true
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="app-cg">
        <Sidebar />
        <div className="main-cg">
          <Header />
          <main className="content-cg">
            
            {/* Page Title */}
            <div className="page-title-cg">
              <div>
                <h1>AI Cybersecurity Assistant</h1>
                <p>Ask questions about scans, findings and defensive actions.</p>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span className="badge-cg purple">Powered by Gemini</span>
                <button
                  onClick={() => setMessages([{
                    id: "init_1",
                    sender: "assistant",
                    text: "I can explain a scan, help interpret threat-intelligence results, and suggest defensive next steps.",
                    timestamp: "Just now"
                  }])}
                  className="btn-cg"
                  style={{ padding: "6px 10px" }}
                  title="Reset conversation"
                >
                  <RotateCcw size={13} />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Active scan context if loaded */}
            {activeScan && (
              <div style={{ marginBottom: 14 }}>
                <ScanContextBanner
                  activeScan={activeScan}
                  onExit={() => setActiveScan(null)}
                />
              </div>
            )}

            {/* Main Assistant Card */}
            <div className="card-cg" style={{ maxWidth: 950, margin: "0 auto" }}>
              <div className="card-head-cg">
                <div>
                  <h3>Security Assistant</h3>
                  <p>Context-aware defensive guidance</p>
                </div>
                <Bot size={18} color="#b68cff" />
              </div>

              <div className="card-body-cg" style={{ minHeight: 460, display: "flex", flexDirection: "column" }}>
                {/* Chat conversation messages */}
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                        maxWidth: "80%",
                      }}
                    >
                      {m.sender === "assistant" ? (
                        <div className="ai-summary-cg" style={{ borderColor: m.isError ? "rgba(239,68,68,.3)" : undefined }}>
                          <strong style={{ display: "block", color: m.isError ? "#ff7575" : "#e6dbff", marginBottom: 4 }}>
                            {m.isError ? "System Notice" : "Assistant"}
                          </strong>
                          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{m.text}</p>
                        </div>
                      ) : (
                        <div 
                          style={{
                            background: "var(--nav-hover)",
                            border: "1px solid var(--line)",
                            padding: "10px 14px",
                            borderRadius: 8,
                            fontSize: 11,
                            color: "var(--text)"
                          }}
                        >
                          <strong style={{ display: "block", fontSize: 10, color: "var(--muted)", marginBottom: 3 }}>
                            You
                          </strong>
                          <p style={{ margin: 0 }}>{m.text}</p>
                        </div>
                      )}
                    </div>
                  ))}

                  {isTyping && (
                    <div className="ai-summary-cg" style={{ width: "fit-content" }}>
                      <RefreshCw size={13} className="animate-spin" style={{ display: "inline", marginRight: 6 }} />
                      <span>Synthesizing response...</span>
                    </div>
                  )}

                  <div ref={chatBottomRef} />
                </div>

                {/* Prompt Suggestions */}
                <div className="quick-cg" style={{ marginBottom: 12 }}>
                  {[
                    "How do I report a phishing URL to authorities?",
                    "What should I do if I entered banking credentials?",
                    "Explain what Punycode domain spoofing is."
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSend(s)}
                      disabled={isTyping}
                      className="btn-cg"
                      style={{ fontSize: 10, padding: "5px 9px" }}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Input box */}
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
                  style={{ marginTop: "auto", display: "flex", gap: 10 }}
                >
                  <input
                    className="urlinput-cg"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about this scan or defensive mitigation..."
                    disabled={isTyping}
                  />
                  <button 
                    type="submit" 
                    className="btn-cg ai" 
                    disabled={!input.trim() || isTyping}
                  >
                    <Send size={14} /> 
                    <span>Send</span>
                  </button>
                </form>

                <p style={{ fontSize: 9, color: "var(--muted)", marginTop: 10, marginBottom: 0 }}>
                  Use the assistant for defensive cybersecurity guidance. Scan risk score and classification remain controlled by the deterministic security analysis engine.
                </p>
              </div>
            </div>

          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
