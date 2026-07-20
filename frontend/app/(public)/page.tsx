"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Shield, 
  ArrowRight, 
  Search, 
  MessageSquare, 
  FileText, 
  Activity, 
  CheckCircle2, 
  Lock, 
  Cpu, 
  Database, 
  Terminal, 
  Layers, 
  FileSignature, 
  AlertTriangle, 
  ChevronDown, 
  Users, 
  BookOpen, 
  TrendingUp,
  ExternalLink,
  History,
  Mail,
  Send,
  Check,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Framer Motion Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 15 }
  }
};

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsSubmitting(false);
    setSubmitted(true);
    setContactName("");
    setContactEmail("");
    setContactMessage("");
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="bg-background text-foreground min-h-screen relative overflow-hidden">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Floating Accent Blurs */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-10%] w-[45%] h-[45%] rounded-full bg-blue-500/5 blur-[130px] pointer-events-none" />

      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Shield className="h-6 w-6 text-primary animate-pulse" />
            <span className="font-bold tracking-tight text-gradient-cyber text-lg">CyberGuard AI</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#why-us" className="hover:text-foreground transition-colors">Why Us</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#workflow" className="hover:text-foreground transition-colors">Workflow</a>
            <a href="#tech" className="hover:text-foreground transition-colors">Tech Stack</a>
            <a href="#team" className="hover:text-foreground transition-colors">Team</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium hover:text-foreground text-muted-foreground transition-colors px-3 py-1.5">
              Sign In
            </Link>
            <Link href="/register">
              <Button size="sm" className="shadow-md cyber-glow-border relative overflow-hidden group">
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4 ml-1.5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-24 md:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6 max-w-4xl"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold tracking-wider uppercase mb-2">
            <Cpu className="h-3.5 w-3.5" /> Next-Gen Cyber Response Hub
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Shielding Digital Frontiers with <span className="text-gradient-cyber">AI Intelligence</span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Analyze threats, consult our AI Forensic Assistant, generate compliance reports, and access immediate step-by-step incident recovery guides.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto h-12 px-8 shadow-lg cyber-glow-border font-medium">
                Launch Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 font-medium">
                Simulate Scan
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* STATISTICS SECTION */}
      <section className="py-12 bg-card/30 border-y border-border px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "99.4%", label: "Phishing Detection Rate" },
            { value: "< 2 min", label: "Report Gen Latency" },
            { value: "10k+", label: "Daily Threat Scans" },
            { value: "0ms", label: "Zero-Trust Overhead" }
          ].map((stat, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="p-4"
            >
              <h3 className="text-3xl sm:text-4xl font-extrabold text-primary mb-1">{stat.value}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* WHY CHOOSE OUR PLATFORM */}
      <section id="why-us" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight mb-4">Why Choose Our Platform?</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Unified threat analytics designed specifically for immediate cybercrime diagnostic support, forensic analysis, and standard operating compliance.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Shield,
              title: "Autonomous Auditing",
              desc: "Instant URL analysis with real-time heuristic scanning of suspicious files and malicious scripts."
            },
            {
              icon: MessageSquare,
              title: "Conversational Forensics",
              desc: "Consult our domain-trained AI Assistant to decode complex threat vectors and plan defenses."
            },
            {
              icon: FileText,
              title: "Compliance-Ready Reports",
              desc: "Generate court-ready and law-enforcement compliance documentation in a single click."
            }
          ].map((card, i) => (
            <Card key={i} className="p-6 bg-card border-border hover:border-primary/40 transition-all duration-300 group cyber-glow-border">
              <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <card.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* PROBLEM STATEMENT */}
      <section className="py-24 bg-card/25 border-y border-border px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive uppercase tracking-wider">
              <AlertTriangle className="h-4 w-4" /> The Threat Landscape
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Manual Incident Response is Too Slow for Modern Cyber Crime</h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Cyber attacks hit businesses every 39 seconds. Standard forensic resolution cycles average 270 days, causing critical data loss and legal liability issues. Incident victims face immediate trauma, complex reporting structures, and a total lack of actionable guidelines.
            </p>
            <div className="space-y-3">
              {[
                "Average cost of data breaches exceeds $4.4M",
                "Phishing schemes account for 90% of structural breaches",
                "Lack of structured reporting hinders recovery paths"
              ].map((point, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-destructive shrink-0" />
                  <span className="text-muted-foreground">{point}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card border border-border p-6 rounded-lg shadow-xl relative cyber-glow-border">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> Active Cyber Threat Vectors</h3>
            <div className="space-y-4">
              {[
                { name: "Phishing Domains", value: 78, color: "bg-destructive" },
                { name: "Ransomware Operations", value: 64, color: "bg-amber-500" },
                { name: "Social Engineering Vectors", value: 50, color: "bg-blue-500" }
              ].map((bar, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">{bar.name}</span>
                    <span>{bar.value}% Risk Increment</span>
                  </div>
                  <div className="w-full bg-accent/30 h-2 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", bar.color)} style={{ width: `${bar.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PLATFORM WORKFLOW */}
      <section id="workflow" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight mb-4">How it Works</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Four simple steps to absolute diagnostics, immediate recovery planning, and regulatory filing support.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {[
            { step: "01", title: "Scan Threat URL", desc: "Submit suspicious domains for static and dynamic heuristic threat scanning." },
            { step: "02", title: "Engage Assistant", desc: "Interact with our security AI assistant to define breach parameters." },
            { step: "03", title: "Resolve Steps", desc: "Receive targeted recovery steps customized to your category of threat." },
            { step: "04", title: "Report & File", desc: "Download standard incident dossiers to present to legal or police authorities." }
          ].map((item, i) => (
            <div key={i} className="space-y-3 relative group">
              <div className="text-4xl font-extrabold text-primary/20 group-hover:text-primary transition-colors duration-300">{item.step}</div>
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* KEY FEATURES */}
      <section id="features" className="py-24 bg-card/20 border-y border-border px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight mb-4">Core Platform Features</h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              A comprehensive system providing automated assessment tools, incident triage pipelines, and AI security copilots.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Search, title: "URL Diagnostic Scanner", desc: "Static and dynamic analysis engine examining SSL structures, WHOIS signals, and phishing patterns." },
              { icon: MessageSquare, title: "AI Forensic Assistant", desc: "Domain-adapted LLM workspace to answer compliance questions and draft incident recovery blueprints." },
              { icon: FileText, title: "Legal Report Architect", desc: "Generates law enforcement compliant PDF formats matching corporate and agency reporting requisites." },
              { icon: CheckCircle2, title: "Incident Recovery Checklists", desc: "Personalized checklists to guide users through blocking fraud and restoring system assets." },
              { icon: History, title: "Historical Scans Vault", desc: "Complete storage database tracking previous diagnostics and threat metrics vectors." },
              { icon: Lock, title: "Zero-Trust Encryption", desc: "End-to-end security layers ensuring uploaded logs and diagnostics remain private." }
            ].map((feature, i) => (
              <Card key={i} className="p-6 bg-card border-border hover:border-primary/30 transition-all duration-300 cyber-glow-border">
                <div className="h-10 w-10 rounded bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* TECHNOLOGY STACK */}
      <section id="tech" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight mb-4">Tech Stack & Frameworks</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Engineered using industry-leading frameworks for rapid deployment, speed, security, and rendering efficiency.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          {[
            { icon: Cpu, name: "Next.js 16", desc: "React Framework" },
            { icon: Layers, name: "React 19", desc: "UI Architecture" },
            { icon: Terminal, name: "Tailwind CSS v4", desc: "Design Engine" },
            { icon: Database, name: "FastAPI / Python", desc: "Core API Service" },
            { icon: Lock, name: "Zod / Hook Form", desc: "Validation Layer" },
            { icon: FileSignature, name: "ShadCN / Base UI", desc: "Accessible Inputs" }
          ].map((tech, i) => (
            <Card key={i} className="p-4 bg-card border-border hover:border-primary/20 transition-all flex flex-col items-center justify-center gap-2 cyber-glow-border">
              <tech.icon className="h-6 w-6 text-primary" />
              <div className="font-semibold text-sm">{tech.name}</div>
              <div className="text-xs text-muted-foreground">{tech.desc}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* RESEARCH HIGHLIGHTS */}
      <section className="py-24 bg-card/10 border-y border-border px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight mb-4">Academic & Research Highlights</h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Developed as a Major Academic Project exploring machine-learning threat signature parsing and optimized triage structures.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                badge: "Threat Intelligence Model",
                title: "Phishing Signature Diagnostics Optimization",
                desc: "Evaluates modern domain structures against heuristic threat signatures, analyzing hosting behaviors, script loads, and WHOIS patterns to achieve classification accuracy."
              },
              {
                badge: "Legal Compliance Engine",
                title: "Automated Incident PDF Dossier Generation",
                desc: "Translates standard cyber crime variables into structured templates optimized for submission to digital law enforcement units, decreasing response times."
              }
            ].map((res, i) => (
              <Card key={i} className="p-6 bg-card border-border flex flex-col justify-between cyber-glow-border">
                <div>
                  <span className="text-xs font-semibold text-primary px-2.5 py-1 rounded bg-primary/10 border border-primary/20 inline-block mb-4">{res.badge}</span>
                  <h3 className="text-lg font-bold mb-3">{res.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{res.desc}</p>
                </div>
                <div className="pt-6 flex items-center gap-2 text-xs font-semibold text-primary hover:underline cursor-pointer">
                  <span>View Project Abstract</span> <ExternalLink className="h-3.5 w-3.5" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ROADMAP */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight mb-4">Development Roadmap</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            The evolution trajectory from concept validation to live federal compliance mapping.
          </p>
        </div>
        <div className="space-y-8 max-w-3xl mx-auto relative before:absolute before:left-4 sm:before:left-1/2 before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
          {[
            { phase: "Phase 1: Architecture & stubs", date: "Month 1 (Completed)", desc: "Project setup, Design system integration, static routing compile, and initial layout validation." },
            { phase: "Phase 2: Core scanning service", date: "Month 2", desc: "Integrate static diagnostic algorithms, setup API client integrations, and finalize Zod form validation structures." },
            { phase: "Phase 3: AI Copilot Assistant", date: "Month 3", desc: "Introduce FastAPI backend hooks, stream processing support, and vector database index lookups." },
            { phase: "Phase 4: Compliance Engine", date: "Month 4-5", desc: "Implement PDF generation engines, finalize statistics visualization cards, and run federal audit checklists." }
          ].map((item, i) => (
            <div key={i} className="relative flex flex-col sm:flex-row items-start sm:justify-between gap-4 group">
              <div className="absolute left-4 sm:left-1/2 h-3.5 w-3.5 rounded-full bg-primary border-4 border-card -translate-x-[6.5px] z-10 group-hover:scale-125 transition-transform" />
              <div className="pl-10 sm:pl-0 sm:w-[45%] text-left sm:text-right">
                <span className="text-xs font-semibold text-primary">{item.date}</span>
                <h4 className="font-bold text-sm sm:text-base mt-1">{item.phase}</h4>
              </div>
              <div className="pl-10 sm:pl-0 sm:w-[45%] text-left">
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MEET TEAM */}
      <section id="team" className="py-24 bg-card/25 border-y border-border px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight mb-4">Meet the Engineers</h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              A 2-member engineering team developing the platform as a Major University Project.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {[
              { name: "Dev A", role: "Frontend Architect / UI Engineer", desc: "Handles responsive interface engineering, theme structures, and user workflow integrations." },
              { name: "Dev B", role: "Backend Architect / AI Dev", desc: "Handles FastAPI pipelines, threat scoring heuristics, and ML model connections." }
            ].map((member, i) => (
              <Card key={i} className="p-6 bg-card border-border text-center cyber-glow-border">
                <div className="h-16 w-16 rounded-full bg-primary/20 text-primary mx-auto flex items-center justify-center mb-4 text-xl font-bold">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold">{member.name}</h3>
                <p className="text-xs font-semibold text-primary mb-3">{member.role}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{member.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* PLATFORM BENEFITS */}
      <section id="benefits" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight mb-4 text-gradient-cyber">Platform Benefits</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Equipping corporate analysts and individual victims with the resources required to stand up against digital threats.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              title: "Time-Sensitive Response",
              desc: "Decreases triage delays from days to minutes, containing threat spreads before critical systems are compromised.",
              metric: "90% Faster Response"
            },
            {
              title: "Forensic Integrity",
              desc: "Preserves scan parameters and headers into cryptographic, tamper-resistant digital summaries.",
              metric: "Court-Ready Dossiers"
            },
            {
              title: "Simplified Compliance",
              desc: "Structures report records to match law-enforcement standards, simplifying digital litigation filing.",
              metric: "1-Click PDF Generation"
            },
            {
              title: "Proactive Education",
              desc: "Interactive scenarios and recovery checklists raise security awareness to prevent future vector abuse.",
              metric: "Adaptive Guides"
            }
          ].map((benefit, i) => (
            <Card key={i} className="p-6 bg-card border-border hover:border-primary/30 transition-all duration-300 flex flex-col justify-between cyber-glow-border">
              <div>
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{benefit.desc}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-border text-xs font-bold text-primary">
                {benefit.metric}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold tracking-tight text-center mb-12">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {[
            { q: "Is the threat analyzer diagnostic score updated in real-time?", a: "Yes. When a URL is submitted, the system queries static databases and runs heuristic tests to return threat scores within seconds." },
            { q: "How does the AI Assistant help during an active breach?", a: "The AI Assistant uses domain-adapted contextual logs to provide immediate step-by-step mitigation plans (e.g. freezing credit cards, credential resets) based on standard incident response protocols." },
            { q: "Are compliance reports generated by the platform legally binding?", a: "The generated PDF dossiers follow structures standard in digital incident reporting (such as Cyber Crime cell criteria). They act as structured evidentiary records for law enforcement and legal teams." },
            { q: "Is user data protected?", a: "Yes. The platform implements static validation rules and encrypts scan history to ensure investigations remain confidential." }
          ].map((faq, i) => {
            const isOpen = activeFaq === i;
            return (
              <div key={i} className="border border-border rounded-lg bg-card overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left font-semibold text-sm sm:text-base hover:text-primary transition-colors"
                  onClick={() => toggleFaq(i)}
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                  <div className="p-4 pt-0 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border bg-accent/10">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section id="contact" className="py-24 bg-card/25 border-y border-border px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight mb-4 text-gradient-cyber">Request Assistance</h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Have security suggestions or require assistance with the platform? Our engineering support team is available.
            </p>
          </div>
          
          <Card className="cyber-glow-border bg-card border-border p-6 md:p-8">
            {submitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="h-12 w-12 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-4">
                  <Check className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold">Transmission Successful</h3>
                <p className="text-sm text-muted-foreground mt-1">Your assistance request log has been queued for verification.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground" htmlFor="contact-name">
                      Analyst Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      placeholder="Agent Smith"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-accent/20 border border-border rounded-md focus:outline-none focus:border-primary text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground" htmlFor="contact-email">
                      Communication Email
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      placeholder="smith@cyberguard.ai"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-accent/20 border border-border rounded-md focus:outline-none focus:border-primary text-foreground"
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="contact-message">
                    Inquiry Details / Incident Scope
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={4}
                    placeholder="Describe the threat vectors or assistance required..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-accent/20 border border-border rounded-md focus:outline-none focus:border-primary text-foreground resize-none"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-10 shadow-md font-medium cyber-glow-border relative overflow-hidden" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Transmitting Signals...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      <Send className="h-4 w-4" /> Transmit Request
                    </span>
                  )}
                </Button>
              </form>
            )}
          </Card>
        </div>
      </section>

      {/* PUBLIC FOOTER */}
      <footer className="border-t border-border bg-card/40 py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-base font-bold tracking-tight text-gradient-cyber">CyberGuard AI</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#why-us" className="hover:underline">Why Us</a>
            <a href="#features" className="hover:underline">Features</a>
            <a href="#workflow" className="hover:underline">Workflow</a>
            <a href="#tech" className="hover:underline">Tech Stack</a>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} CyberGuard AI. Major University Project. Built for educational analysis.
          </p>
        </div>
      </footer>
    </div>
  );
}
