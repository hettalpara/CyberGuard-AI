"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, 
  User, 
  Send, 
  MessageSquare, 
  Plus, 
  ShieldAlert, 
  Search, 
  Sparkles,
  HelpCircle,
  Clock,
  ChevronRight,
  Terminal,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, Breadcrumb } from "@/components/common";

// Mock suggested prompts
const suggestedPrompts = [
  "How do I file a police report for identity theft?",
  "What is the first step in responding to ransomware?",
  "How can I audit a suspicious bank transaction?",
  "What evidence is required for a phishing audit?"
];

// Mock historical sessions
const initialSessions = [
  { id: "1", title: "Ransomware Response Plan", date: "Today" },
  { id: "2", title: "Phishing Site Heuristic Check", date: "Yesterday" },
  { id: "3", title: "Identity Fraud Filing Details", date: "Jul 15, 2026" }
];

interface Message {
  id: string;
  role: string;
  content: string;
  timestamp: string;
}

// Initial mock chat messages
const initialMessages: Message[] = [
  { 
    id: "m1", 
    role: "assistant", 
    content: "Greetings, Analyst. I am the CyberGuard AI assistant. I am trained in federal cybercrime response guides, technical forensics triage, and compliance report filing rules. How can I assist your investigation today?",
    timestamp: "10:30 AM" 
  }
];

export default function AssistantPage() {
  const [sessions, setSessions] = useState(initialSessions);
  const [activeSessionId, setActiveSessionId] = useState("1");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setIsTyping(true);

    // Simulate AI response stream delay
    setTimeout(() => {
      setIsTyping(false);
      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getMockAIResponse(text),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, assistantMsg]);
    }, 1500);
  };

  const handleNewSession = () => {
    const newId = (sessions.length + 1).toString();
    const newSession = {
      id: newId,
      title: `New Consultation Log ${newId}`,
      date: "Just Now"
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    setMessages([
      { 
        id: Date.now().toString(), 
        role: "assistant", 
        content: "New analysis workspace created. How can I assist with this new threat record?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }
    ]);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      setMessages(initialMessages);
    }
  };

  // Crude mapping of mock queries
  const getMockAIResponse = (query: string): string => {
    const lower = query.toLowerCase();
    if (lower.includes("ransomware")) {
      return "Critical Response Protocol for Ransomware:\n\n1. Isolating hosts: Disconnect the affected endpoints from the network immediately.\n2. Disabling storage access: Lock active cloud shares to prevent payload traversal.\n3. Preserving logs: Capture memory snapshots and firewall logs before powering down.\n4. Reporting: Prepare a regulatory dossier for standard filing with CISA/FBI cells.";
    }
    if (lower.includes("phishing") || lower.includes("evidence")) {
      return "Required Evidentiary Materials for Phishing Reports:\n\n1. Full Email Headers: Copy-paste the raw email header containing IP logs and routing trails.\n2. Malicious Assets: Save screenshots of the deception interface and domain URLs.\n3. Financial Records: If transfers were executed, capture transactional hashes, bank references, and beneficiary account targets.";
    }
    if (lower.includes("identity") || lower.includes("police")) {
      return "To register an identity theft complaint, please follow these compliance steps:\n\n1. File a report at your local police cyber station or portal (e.g., cybercrime.gov.in or FTC.gov).\n2. Attach identity documents alongside proof of compromised accounts.\n3. Dispatch credit freeze warnings to reporting agencies immediately.";
    }
    return "Understood. Analyzing parameters of the query against cybersecurity reference books. I recommend cross-referencing this indicator with WHOIS scanner logs and reviewing the specific compliance steps outlined in our Recovery Guides.";
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <Breadcrumb items={[{ label: "AI Assistant" }]} />
      <PageHeader 
        title="AI Incident Copilot" 
        description="Interact with our secure LLM to draft incident recovery plans, analyze telemetry payloads, and query regulations."
      />
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-16.5rem)] min-h-[500px]">
      {/* LEFT SIDEBAR - Conversation History */}
      <Card className="w-full lg:w-72 border-border bg-card/65 flex flex-col h-full shrink-0 cyber-glow-border">
        <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between space-y-0">
          <span className="text-sm font-bold flex items-center gap-1.5"><Clock className="h-4.5 w-4.5 text-primary" /> Consult History</span>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={handleNewSession} aria-label="New Chat">
            <Plus className="h-4.5 w-4.5" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 p-2 overflow-y-auto space-y-1">
          {sessions.map((sess) => {
            const isActive = sess.id === activeSessionId;
            return (
              <div
                key={sess.id}
                onClick={() => setActiveSessionId(sess.id)}
                className={cn(
                  "w-full flex items-center justify-between p-2.5 rounded-md text-xs font-semibold cursor-pointer transition-all group",
                  isActive 
                    ? "bg-accent/40 text-primary border border-primary/20" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/15"
                )}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <MessageSquare className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate">{sess.title}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-muted-foreground whitespace-nowrap">{sess.date}</span>
                  <button 
                    onClick={(e) => handleDeleteSession(sess.id, e)}
                    className="opacity-0 group-hover:opacity-100 hover:text-destructive p-0.5 rounded transition-opacity"
                    aria-label="Delete Session"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* MAIN CHAT INTERFACE */}
      <Card className="flex-1 border-border bg-card/65 flex flex-col h-full overflow-hidden cyber-glow-border">
        {/* Chat Title Header */}
        <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Bot className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">CyberGuard Diagnostic Copilot</CardTitle>
              <CardDescription className="text-[10px]">Model: Incident-LLM-v2 • Status: Ready</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-500 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>Secure Connection</span>
          </div>
        </CardHeader>

        {/* Chat Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-0">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isAI = msg.role === "assistant";
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex gap-3 max-w-[85%]", isAI ? "mr-auto" : "ml-auto flex-row-reverse")}
                >
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold",
                    isAI ? "bg-primary/10 text-primary" : "bg-accent/40 text-primary"
                  )}>
                    {isAI ? <Bot className="h-4.5 w-4.5" /> : <User className="h-4.5 w-4.5" />}
                  </div>
                  <div className="space-y-1">
                    <div className={cn(
                      "p-3 rounded-lg text-xs leading-relaxed whitespace-pre-line border",
                      isAI 
                        ? "bg-accent/20 border-border text-foreground" 
                        : "bg-primary text-primary-foreground border-primary/20"
                    )}>
                      {msg.content}
                    </div>
                    <div className={cn("text-[9px] text-muted-foreground px-1", isAI ? "text-left" : "text-right")}>
                      {msg.timestamp}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Typing Bouncing indicator */}
          {isTyping && (
            <div className="flex gap-3 max-w-[85%] mr-auto">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Bot className="h-4.5 w-4.5 animate-pulse" />
              </div>
              <div className="p-3 bg-accent/20 border border-border rounded-lg flex items-center gap-1 h-8">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Block */}
        {messages.length === 1 && !isTyping && (
          <div className="px-4 py-2 border-t border-border/40">
            <div className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 mb-2">
              <HelpCircle className="h-3.5 w-3.5 text-primary" /> Suggested Incident Inquiries
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(p)}
                  className="text-[10px] font-semibold text-muted-foreground hover:text-foreground bg-accent/15 hover:bg-accent/30 border border-border/40 hover:border-primary/40 rounded px-2.5 py-1.5 transition-all text-left cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Input Field */}
        <div className="p-4 border-t border-border bg-card/65">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputVal);
            }}
            className="flex gap-2"
          >
            <Input
              type="text"
              placeholder="Query CISA guidelines, report filing structures, or analyze logs..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="text-xs h-10 bg-accent/20 border-border flex-1"
              disabled={isTyping}
            />
            <Button type="submit" size="icon" className="h-10 w-10 shrink-0" disabled={isTyping || !inputVal.trim()}>
              <Send className="h-4.5 w-4.5" />
            </Button>
          </form>
        </div>
      </Card>
      </div>
    </div>
  );
}
