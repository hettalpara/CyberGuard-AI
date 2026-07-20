"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Mail, Loader2, ArrowLeft, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    setIsSubmitted(true);
    toast.success("Security token reset link has been dispatched to your email address.");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl font-bold tracking-tight text-center md:text-left">Recover Credentials</h1>
        <p className="text-sm text-muted-foreground text-center md:text-left">
          Request security clearance token override links.
        </p>
      </div>

      {!isSubmitted ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground" htmlFor="email">
              Clearance Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
              <Input
                id="email"
                type="email"
                placeholder="analyst@cyberguard.ai"
                className="pl-9 bg-accent/20 border-border focus-visible:ring-primary"
                disabled={isLoading}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs font-medium text-destructive"
              >
                {errors.email.message}
            </motion.p>
          )}
          </div>

          {/* Reset Button */}
          <Button
            type="submit"
            className="w-full h-10 shadow-lg font-medium cyber-glow-border relative overflow-hidden"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Dispatching Tokens...
              </>
            ) : (
              "Send Override Link"
            )}
          </Button>
        </form>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-md text-center space-y-3"
        >
          <ShieldAlert className="h-8 w-8 text-emerald-500 mx-auto" />
          <h3 className="font-bold text-sm text-emerald-500">Security Dispatch Initiated</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            A temporary token validation link has been sent. Check spam folders if the email does not arrive in 2 minutes.
          </p>
        </motion.div>
      )}

      <div className="text-center text-xs text-muted-foreground pt-2">
        Remembered credentials?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Return to Login
        </Link>
      </div>

      <div className="pt-2 border-t border-border/60 text-center">
        <Link href="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Back to Landing Page
        </Link>
      </div>
    </div>
  );
}
