// ============================================================================
// Zod Validation Schemas
// Production-ready validation schemas for authentication and URL scanning.
// ============================================================================

import { z } from "zod";

/** Login form schema */
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

/** Registration form schema */
export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
    department: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type RegisterFormValues = z.infer<typeof registerSchema>;

/** URL Scanner Schema */
export const urlScanSchema = z.object({
  url: z
    .string()
    .min(3, "Please enter a valid URL")
    .refine(
      (val) =>
        /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/.test(
          val.trim(),
        ),
      { message: "Please enter a properly formatted web domain or URL" },
    ),
});
export type UrlScanFormValues = z.infer<typeof urlScanSchema>;
