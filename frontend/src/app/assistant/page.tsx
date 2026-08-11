"use client";

import React, { useState } from "react";
import { Send, ArrowRight, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
}

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "assistant",
      text: "Hello! I am your specialized Cybersecurity AI Assistant. I answer questions related strictly to URL security analysis reports, phishing detection, SSL/WHOIS indicators, and cyber incident recovery steps.",
      timestamp: "Just now"
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const sampleQuestions = [
    "Is this URL safe?",
    "Explain my latest analysis report.",
    "What is phishing?",
    "How do I recover from credential theft?"
  ];

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setIsTyping(true);

    setTimeout(() => {
      let reply = "I specialize strictly in cybersecurity topics. Please ask me about analyzing web URLs, interpreting risk scores, SSL/WHOIS indicators, or recovering from online fraud.";
      const lower = query.toLowerCase();

      if (lower.includes("phishing")) {
        reply = "Phishing is a social engineering attack where bad actors craft deceptive links or clone legitimate login pages (banks, social media) to trick users into revealing credentials, OTPs, or financial information.";
      } else if (lower.includes("report") || lower.includes("explain")) {
        reply = "Analysis reports evaluate risk indicators: SSL certificate validity, WHOIS domain registration age, Google Safe Browsing flags, and VirusTotal multi-engine scans into a 0-100 risk score with actionable triage advice.";
      } else if (lower.includes("safe") || lower.includes("url") || lower.includes("link")) {
        reply = "To check if a link is safe, paste it into the Smart URL Analyzer. The platform checks SSL certificates, domain age (new domains < 30 days are high risk), and multi-engine threat databases.";
      } else if (lower.includes("recover") || lower.includes("stolen") || lower.includes("hack")) {
        reply = "Immediate Recovery Steps: 1) Disconnect device from Wi-Fi. 2) Rotate account passwords from a clean device. 3) Enable 2FA. 4) Dial Helpline 1930 for financial frauds or report on cybercrime.gov.in.";
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full flex flex-col h-[calc(100vh-4rem)]">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-emerald-100 text-[#10B981] font-bold text-xs rounded-md">Cybersecurity Domain Specialist</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#1F2937] tracking-tight">AI Security Assistant</h1>
            <p className="text-slate-500 text-xs mt-0.5">Ask questions about URL risk scores, SSL indicators, and incident recovery advice.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="p-2.5 bg-white border border-[#E5E7EB] hover:border-[#10B981] hover:bg-emerald-50/50 rounded-xl text-left text-xs font-semibold text-slate-700 transition flex items-center justify-between group"
              >
                <span className="truncate">{q}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#10B981] shrink-0 ml-1" />
              </button>
            ))}
          </div>

          <Card className="flex-1 border-[#E5E7EB] bg-white shadow-sm flex flex-col overflow-hidden">
            <CardContent className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div className={`p-2 rounded-xl text-white shrink-0 ${msg.sender === "user" ? "bg-[#111827]" : "bg-[#10B981]"}`}>
                    {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`max-w-[80%] rounded-xl p-3.5 text-xs leading-relaxed ${
                    msg.sender === "user" 
                      ? "bg-[#111827] text-white rounded-tr-none" 
                      : "bg-slate-50 border border-[#E5E7EB] text-slate-800 rounded-tl-none font-medium"
                  }`}>
                    {msg.text}
                    <div className={`text-[10px] mt-1.5 ${msg.sender === "user" ? "text-slate-400" : "text-slate-400"}`}>
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                  <Bot className="w-4 h-4 text-[#10B981] animate-spin" /> AI Security Assistant is thinking...
                </div>
              )}
            </CardContent>

            <div className="p-3 border-t border-[#E5E7EB] bg-white">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about phishing, URL reports, or security recovery..."
                  className="bg-slate-50 border-[#E5E7EB] rounded-xl text-xs h-10 focus:ring-[#10B981] focus:border-[#10B981]"
                />
                <Button type="submit" className="bg-[#10B981] hover:bg-[#059669] text-white h-10 px-4 rounded-xl text-xs font-semibold">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
