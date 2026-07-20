"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, Loader2, ArrowLeft, User, Building } from "lucide-react";
import { toast } from "sonner";
import { registerSchema, type RegisterFormValues } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      department: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    // Simulate API registration delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    toast.success("Clearance request registered successfully! Please log in.");
    router.push("/login");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl font-bold tracking-tight text-center md:text-left">Request Access Clearance</h1>
        <p className="text-sm text-muted-foreground text-center md:text-left">
          Register credentials for cybersecurity diagnostic access.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground" htmlFor="fullName">
            Operator Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
            <Input
              id="fullName"
              type="text"
              placeholder="Jane Doe"
              className="pl-9 bg-accent/20 border-border focus-visible:ring-primary"
              disabled={isLoading}
              {...register("fullName")}
            />
          </div>
          {errors.fullName && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs font-medium text-destructive"
            >
              {errors.fullName.message}
            </motion.p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground" htmlFor="email">
            Clearance Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
            <Input
              id="email"
              type="email"
              placeholder="operator@cyberguard.ai"
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

        {/* Department */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground" htmlFor="department">
            Security Department (Optional)
          </label>
          <div className="relative">
            <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
            <Input
              id="department"
              type="text"
              placeholder="Forensics / Network Ops"
              className="pl-9 bg-accent/20 border-border focus-visible:ring-primary"
              disabled={isLoading}
              {...register("department")}
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground" htmlFor="password">
            Define Security Access Key
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
              className="pl-9 pr-9 bg-accent/20 border-border focus-visible:ring-primary"
              disabled={isLoading}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground focus:outline-none"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs font-medium text-destructive"
            >
              {errors.password.message}
            </motion.p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground" htmlFor="confirmPassword">
            Confirm Security Access Key
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
              className="pl-9 pr-9 bg-accent/20 border-border focus-visible:ring-primary"
              disabled={isLoading}
              {...register("confirmPassword")}
            />
          </div>
          {errors.confirmPassword && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs font-medium text-destructive"
            >
              {errors.confirmPassword.message}
            </motion.p>
          )}
        </div>

        {/* Register Button */}
        <Button
          type="submit"
          className="w-full h-10 shadow-lg font-medium cyber-glow-border relative overflow-hidden"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Registering Analyst...
            </>
          ) : (
            "Request Access Clearance"
          )}
        </Button>
      </form>

      <div className="text-center text-xs text-muted-foreground pt-2">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Authorize Login
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
