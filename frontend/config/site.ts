// ============================================================================
// Site Metadata Configuration
// Centralized SEO and site metadata for Next.js metadata API.
// ============================================================================

import type { Metadata } from "next";

export const siteConfig = {
  name: "CyberGuard AI",
  description:
    "AI-Powered Cyber Crime Assistance Platform — Report, investigate, and resolve cyber crime cases with AI assistance.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ogImage: "/og-image.png",
  keywords: [
    "cyber crime",
    "AI assistant",
    "cyber security",
    "crime reporting",
    "digital forensics",
    "threat analysis",
  ],
};

export const defaultMetadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: "CyberGuard AI Team" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  robots: {
    index: true,
    follow: true,
  },
};
