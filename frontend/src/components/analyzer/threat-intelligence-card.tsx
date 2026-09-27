"use client";

import React from "react";
import { ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";

export interface ThreatIntelligenceCardProps {
  safeBrowsing?: {
    available?: boolean;
    status?: string;
    matches?: any[];
    threatTypes?: string[];
    platforms?: string[];
    isMalicious?: boolean;
    error?: string;
  };
  virusTotal?: {
    available?: boolean;
    status?: string;
    malicious?: number;
    suspicious?: number;
    harmless?: number;
    undetected?: number;
    total?: number;
    detectionRatio?: string;
    positives?: number;
    isMalicious?: boolean;
    error?: string;
  };
  urlhaus?: {
    available?: boolean;
    status?: string;
    queryStatus?: string;
    threatType?: string;
    tags?: string[];
    isMalicious?: boolean;
    error?: string;
  };
}

export type ThreatIntelligenceProps = ThreatIntelligenceCardProps;

export function ThreatIntelligenceCard({
  safeBrowsing = {},
  virusTotal = {},
  urlhaus = {},
}: ThreatIntelligenceCardProps) {
  // Safe Browsing
  const gsbAvailable = safeBrowsing?.available !== false && safeBrowsing?.status !== "UNAVAILABLE";
  const gsbMalicious = Boolean(safeBrowsing?.isMalicious);
  const gsbStatus = !gsbAvailable ? "UNAVAILABLE" : gsbMalicious ? "MALICIOUS" : "CLEAN";
  const gsbBadgeColor = gsbStatus === "CLEAN" ? "green" : gsbStatus === "MALICIOUS" ? "red" : "amber";
  
  const threatTypesArr = Array.isArray(safeBrowsing?.threatTypes) ? safeBrowsing.threatTypes : [];
  const gsbDesc = !gsbAvailable 
    ? (safeBrowsing?.error || "Service unavailable or query timed out") 
    : gsbMalicious 
    ? `Flagged as ${threatTypesArr.join(", ") || "threat"}` 
    : "No threats identified in Google Safe Browsing database.";

  // VirusTotal
  const vtAvailable = virusTotal?.available !== false && virusTotal?.status !== "UNAVAILABLE";
  const vtMalicious = Boolean(virusTotal?.isMalicious);
  const vtMaliciousCount = virusTotal?.malicious ?? 0;
  const vtStatus = !vtAvailable 
    ? "UNAVAILABLE" 
    : vtMalicious 
    ? `${vtMaliciousCount} DETECTIONS` 
    : "NO DETECTIONS";
  const vtBadgeColor = !vtAvailable ? "amber" : vtMalicious ? "red" : "green";
  const vtDesc = !vtAvailable
    ? (virusTotal?.error || "Antivirus engine telemetry currently unavailable")
    : vtMalicious
    ? `Detections ratio: ${virusTotal?.detectionRatio || `${vtMaliciousCount}/${virusTotal?.total ?? 0}`}`
    : "No antivirus engines responded with a malicious detection.";

  // URLhaus
  const uhAvailable = urlhaus?.available !== false && urlhaus?.status !== "UNAVAILABLE";
  const uhMalicious = Boolean(urlhaus?.isMalicious);
  const uhStatus = !uhAvailable ? "UNAVAILABLE" : uhMalicious ? "MALICIOUS" : "CLEAN";
  const uhBadgeColor = uhStatus === "CLEAN" ? "green" : uhStatus === "MALICIOUS" ? "red" : "amber";
  const uhDesc = !uhAvailable
    ? (urlhaus?.error || "Malware feed unavailable")
    : uhMalicious
    ? `Listed malware payload: ${urlhaus?.threatType || "Active threat"}`
    : "URL is not listed in URLhaus active malware database.";

  const providers = [
    { 
      id: "gsb",
      name: "Google Safe Browsing", 
      desc: gsbDesc, 
      status: gsbStatus, 
      color: gsbBadgeColor, 
      isMalicious: gsbMalicious,
      isUnavailable: !gsbAvailable
    },
    { 
      id: "vt",
      name: "VirusTotal", 
      desc: vtDesc, 
      status: vtStatus, 
      color: vtBadgeColor, 
      isMalicious: vtMalicious,
      isUnavailable: !vtAvailable
    },
    { 
      id: "uh",
      name: "URLhaus", 
      desc: uhDesc, 
      status: uhStatus, 
      color: uhBadgeColor, 
      isMalicious: uhMalicious,
      isUnavailable: !uhAvailable
    },
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
          <div className="provider-cg" key={p.id}>
            <div 
              className="provider-icon-cg" 
              style={{ 
                color: p.isMalicious ? "var(--red)" : p.isUnavailable ? "var(--amber)" : "var(--green)" 
              }}
            >
              {p.isMalicious ? (
                <ShieldAlert size={16} />
              ) : p.isUnavailable ? (
                <AlertTriangle size={16} />
              ) : (
                <ShieldCheck size={16} />
              )}
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
