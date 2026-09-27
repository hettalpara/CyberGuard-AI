"use client";

import React from "react";
import { ShieldCheck, ShieldAlert, AlertTriangle, AlertCircle, HelpCircle } from "lucide-react";

export interface ThreatIntelligenceCardProps {
  safeBrowsing: {
    available: boolean;
    status: string;
    matches: any[];
    threatTypes: string[];
    platforms: string[];
    isMalicious: boolean;
    error?: string;
  };
  virusTotal: {
    available: boolean;
    status: string;
    malicious: number;
    suspicious: number;
    harmless: number;
    undetected: number;
    total: number;
    detectionRatio: string;
    positives: number;
    isMalicious: boolean;
    error?: string;
  };
  urlhaus: {
    available: boolean;
    status: string;
    queryStatus: string;
    threatType?: string;
    tags: string[];
    isMalicious: boolean;
    error?: string;
  };
}

export type ThreatIntelligenceProps = ThreatIntelligenceCardProps;

export function ThreatIntelligenceCard({
  safeBrowsing,
  virusTotal,
  urlhaus,
}: ThreatIntelligenceCardProps) {
  // Safe Browsing
  const gsbStatus = !safeBrowsing.available ? "UNAVAILABLE" : safeBrowsing.isMalicious ? "MALICIOUS" : "CLEAN";
  const gsbBadgeColor = gsbStatus === "CLEAN" ? "green" : gsbStatus === "MALICIOUS" ? "red" : "amber";
  const gsbDesc = !safeBrowsing.available 
    ? "Service unavailable or query timed out" 
    : safeBrowsing.isMalicious 
    ? `Flagged as ${safeBrowsing.threatTypes?.join(", ") || "threat"}` 
    : "No threats identified in Google Safe Browsing database.";

  // VirusTotal
  const vtStatus = !virusTotal.available ? "UNAVAILABLE" : virusTotal.isMalicious ? `${virusTotal.malicious} DETECTIONS` : "NO DETECTIONS";
  const vtBadgeColor = !virusTotal.available ? "amber" : virusTotal.isMalicious ? "red" : "green";
  const vtDesc = !virusTotal.available
    ? "Antivirus engine telemetry currently unavailable"
    : virusTotal.isMalicious
    ? `Detections ratio: ${virusTotal.detectionRatio}`
    : "No antivirus engines responded with a malicious detection.";

  // URLhaus
  const uhStatus = !urlhaus.available ? "UNAVAILABLE" : urlhaus.isMalicious ? "MALICIOUS" : "CLEAN";
  const uhBadgeColor = uhStatus === "CLEAN" ? "green" : uhStatus === "MALICIOUS" ? "red" : "amber";
  const uhDesc = !urlhaus.available
    ? "Malware feed unavailable"
    : urlhaus.isMalicious
    ? `Listed malware payload: ${urlhaus.threatType || "Active threat"}`
    : "URL is not listed in URLhaus active malware database.";

  const providers = [
    { name: "Google Safe Browsing", desc: gsbDesc, status: gsbStatus, color: gsbBadgeColor, isMalicious: safeBrowsing.isMalicious },
    { name: "VirusTotal", desc: vtDesc, status: vtStatus, color: vtBadgeColor, isMalicious: virusTotal.isMalicious },
    { name: "URLhaus", desc: uhDesc, status: uhStatus, color: uhBadgeColor, isMalicious: urlhaus.isMalicious },
  ];

  return (
    <div className="card-cg">
      <div className="card-head-cg">
        <div>
          <h3>Threat Intelligence Results</h3>
          <p>Results from external security providers</p>
        </div>
      </div>

      <div className="card-body-cg">
        {providers.map((p) => (
          <div className="provider-cg" key={p.name}>
            <div className="provider-icon-cg" style={{ color: p.isMalicious ? "var(--red)" : "var(--green)" }}>
              {p.isMalicious ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
            </div>
            <div className="provider-main-cg">
              <strong>{p.name}</strong>
              <p>{p.desc}</p>
            </div>
            <span className={`badge-cg ${p.color}`}>
              {p.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
