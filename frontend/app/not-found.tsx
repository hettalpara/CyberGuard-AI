"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-background relative overflow-hidden px-4">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Floating Accent Blurs */}
      <div className="absolute top-[-10%] left-[5%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[5%] w-[40%] h-[40%] rounded-full bg-destructive/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md text-center space-y-8 relative z-10">
        {/* Animated Icon Illustration */}
        <div className="relative flex items-center justify-center h-40 w-40 mx-auto">
          {/* Pulse ring 1 */}
          <motion.div
            className="absolute inset-0 rounded-full border border-destructive/20 bg-destructive/5"
            animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.4, 0.1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Pulse ring 2 */}
          <motion.div
            className="absolute inset-4 rounded-full border border-primary/20 bg-primary/5"
            animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.5, 0.1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />
          
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative z-10 h-20 w-20 rounded-full bg-card border border-destructive/30 flex items-center justify-center shadow-xl cyber-glow-border"
          >
            <ShieldAlert className="h-10 w-10 text-destructive" />
          </motion.div>
        </div>

        {/* 404 Text Content */}
        <div className="space-y-3">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-6xl font-extrabold tracking-tight text-gradient-cyber"
          >
            404
          </motion.h1>
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg font-bold text-foreground"
          >
            Access Denied / Not Found
          </motion.h2>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed"
          >
            The requested security log, threat profile, or workspace does not exist or has been purged by the system administrator.
          </motion.p>
        </div>

        {/* Return Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Link href="/dashboard">
            <Button size="lg" className="shadow-lg cyber-glow-border relative overflow-hidden group">
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Return to Safe Workspace
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
