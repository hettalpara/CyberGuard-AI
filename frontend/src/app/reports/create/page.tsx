"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
  Eye,
  X,
  Save,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  Globe,
  Sparkles,
  RefreshCw,
  FileText,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { analyzerService, type ScanResultData } from "@/services/analyzer.service";
import { reportService } from "@/services/report.service";
import type { IncidentReport } from "@/types";

const INCIDENT_TYPES = [
  "Phishing",
  "Scam",
  "Suspicious URL",
  "Malware",
  "Account Compromise",
  "Online Fraud",
  "Suspicious Message",
  "Other",
];

function CreateReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scanIdFromUrl = searchParams.get("scanId");

  const [selectedScanId, setSelectedScanId] = useState<string | null>(scanIdFromUrl);
  const [scan, setScan] = useState<any>(null);
  const [loadingScan, setLoadingScan] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Fallback scan selector when no scanId is provided in URL
  const [recentScans, setRecentScans] = useState<ScanResultData[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  // Analyst form state
  const [incidentType, setIncidentType] = useState("Phishing");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [incidentDate, setIncidentDate] = useState(() =>
    new Date().toISOString().substring(0, 10)
  );
  const [source, setSource] = useState("");
  const [affectedAccount, setAffectedAccount] = useState("");
  const [userNotes, setUserNotes] = useState("");

  // UI state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdReport, setCreatedReport] = useState<IncidentReport | null>(null);

  // Load scan by ID
  const loadScanData = useCallback(async (id: string) => {
    setLoadingScan(true);
    setScanError(null);
    try {
      const res = await analyzerService.getScanById(id);
      if (res.data && res.data.scan) {
        const s = res.data.scan;
        setScan(s);
        const domain = s.domain || s.url?.replace(/https?:\/\//, "").split("/")[0] || "Suspicious URL";
        setTitle((prev) => (prev ? prev : `Cyber Incident: ${domain}`));
      } else {
        setScanError("Scan could not be loaded. Please ensure you own this scan.");
      }
    } catch (err: unknown) {
      const errRes = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setScanError(errRes || "Failed to load scan context.");
    } finally {
      setLoadingScan(false);
    }
  }, []);

  // Fetch recent scans if no scanId in query param
  useEffect(() => {
    if (scanIdFromUrl) {
      setSelectedScanId(scanIdFromUrl);
      loadScanData(scanIdFromUrl);
    } else {
      setLoadingRecent(true);
      analyzerService
        .getScanHistory({ page: 1, limit: 5 })
        .then((res) => {
          if (res?.data?.data && Array.isArray(res.data.data)) {
            setRecentScans(res.data.data);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingRecent(false));
    }
  }, [scanIdFromUrl, loadScanData]);

  // Form submission handler
  const handleSubmit = async (status: "DRAFT" | "FINAL") => {
    if (!selectedScanId) {
      setFormError("Cannot create report without an active linked scan.");
      return;
    }
    if (!title.trim()) {
      setFormError("Report title is required.");
      return;
    }
    if (!description.trim()) {
      setFormError("Incident description is required.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const res = await reportService.createReport({
        scanId: selectedScanId,
        incidentType,
        title: title.trim(),
        description: description.trim(),
        incidentDate,
        source: source.trim(),
        affectedAccount: affectedAccount.trim(),
        userNotes: userNotes.trim(),
        status,
      });

      if (res.data && res.data.report) {
        const r = res.data.report;
        setCreatedReport(r);
        // Automatically route after brief confirmation
        setTimeout(() => {
          router.push(`/reports/${r._id}`);
        }, 1200);
      }
    } catch (err: unknown) {
      const errMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(
        errMsg || "Unable to save incident report. Your information has been preserved."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Extract scan metrics safely
  const threatLevel = (scan?.riskLevel || scan?.risk?.level || "SAFE").toUpperCase();
  const riskScore = scan?.riskScore !== undefined ? scan.riskScore : (scan?.risk?.score ?? 0);
  const confidence = scan?.confidence ?? 85;

  const badgeColor =
    threatLevel === "SAFE"
      ? "green"
      : threatLevel === "LOW"
      ? "blue"
      : threatLevel === "MODERATE"
      ? "amber"
      : "red";

  const riskColorHex =
    threatLevel === "SAFE"
      ? "#16c784"
      : threatLevel === "LOW"
      ? "#3478ff"
      : threatLevel === "MODERATE"
      ? "#f5a524"
      : "#ef4444";

  // Provider telemetry statuses
  const gsbClean = !scan?.safeBrowsing?.threatDetected;
  const gsbAvail = scan?.safeBrowsing?.available !== false;

  const vtMalicious = scan?.virusTotal?.maliciousCount ?? 0;
  const vtTotal = scan?.virusTotal?.totalEngines ?? 91;
  const vtAvail = scan?.virusTotal?.available !== false;

  const urlhausMatch = !!scan?.urlhaus?.match;
  const urlhausAvail = scan?.urlhaus?.available !== false;

  const sslValid = !!(scan?.ssl?.valid || scan?.sslAnalysis?.certificateStatus === "VALID");

  return (
    <div className="app-cg">
      <Sidebar />
      <div className="main-cg">
        <Header />
        <main className="content-cg" style={{ maxWidth: 1240, margin: "0 auto", width: "100%", padding: "24px 28px" }}>
          
          {/* Breadcrumb / Back Navigation */}
          <div style={{ marginBottom: 12 }}>
            <Link 
              href="/reports" 
              className="btn-cg" 
              style={{ border: "none", background: "transparent", padding: "4px 0", fontSize: 12, color: "var(--muted)" }}
            >
              <ArrowLeft size={14} />
              <span>Back to Reports</span>
            </Link>
          </div>

          {/* Page Header */}
          <div className="page-title-cg" style={{ alignItems: "center", marginBottom: 22 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700 }}>Create Incident Report</h1>
              <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                Document suspicious activity, link threat intelligence findings, and generate a downloadable security report.
              </p>
            </div>
            <div>
              <button 
                type="button" 
                onClick={() => setPreviewOpen(true)}
                className="btn-cg"
                style={{ gap: 8 }}
                title="Live Document Preview"
              >
                <Eye size={14} />
                <span>Live Preview</span>
              </button>
            </div>
          </div>

          {/* Error Notice */}
          {formError && (
            <div 
              className="notice-cg" 
              style={{ 
                borderColor: "rgba(239,68,68,0.35)", 
                background: "rgba(239,68,68,0.08)", 
                color: "#ff7777", 
                marginBottom: 18, 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between",
                padding: "12px 16px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <AlertTriangle size={17} style={{ flexShrink: 0 }} />
                <div>
                  <strong style={{ display: "block", fontSize: 12 }}>Unable to create incident report.</strong>
                  <span style={{ fontSize: 11, opacity: 0.9 }}>Your information has been preserved. {formError}</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => handleSubmit("FINAL")}
                className="btn-cg" 
                style={{ fontSize: 11, padding: "5px 12px", borderColor: "rgba(239,68,68,0.4)" }}
              >
                Try Again
              </button>
            </div>
          )}

          {/* Success Notice */}
          {createdReport && (
            <div 
              className="notice-cg" 
              style={{ 
                borderColor: "rgba(22,199,132,0.35)", 
                background: "rgba(22,199,132,0.09)", 
                color: "#50e3a4", 
                marginBottom: 18, 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between",
                padding: "12px 16px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CheckCircle2 size={18} />
                <div>
                  <strong style={{ display: "block", fontSize: 12 }}>Incident report created successfully.</strong>
                  <div style={{ fontSize: 11, opacity: 0.9 }}>
                    Report ID: <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{createdReport.reportId || createdReport._id}</span>
                  </div>
                </div>
              </div>
              <Link href={`/reports/${createdReport._id}`} className="btn-cg primary" style={{ fontSize: 11, padding: "6px 14px" }}>
                <span>View Report</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          )}

          {/* Scan Selection State or Active Scan Display */}
          {loadingScan ? (
            <div className="card-cg" style={{ padding: 48, textAlign: "center", marginBottom: 20 }}>
              <div 
                className="animate-spin" 
                style={{ 
                  width: 28, 
                  height: 28, 
                  border: "3px solid var(--blue)", 
                  borderTopColor: "transparent", 
                  borderRadius: "50%", 
                  margin: "0 auto 12px" 
                }} 
              />
              <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
                Retrieving threat intelligence scan telemetry...
              </p>
            </div>
          ) : !selectedScanId || scanError ? (
            <div className="card-cg" style={{ marginBottom: 20 }}>
              <div className="card-head-cg">
                <div>
                  <span className="section-tag-cg">SCAN CONTEXT SELECTION</span>
                  <h3>Select Linked Threat Scan</h3>
                  <p>Choose an analyzed URL to generate a comprehensive forensic report</p>
                </div>
                <Link href="/analyzer" className="btn-cg primary">
                  <span>New URL Scan</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
              <div className="card-body-cg">
                {scanError && (
                  <div className="notice-cg" style={{ marginBottom: 14 }}>
                    <AlertTriangle size={14} style={{ verticalAlign: "middle", marginRight: 7 }} />
                    {scanError}
                  </div>
                )}

                {loadingRecent ? (
                  <p style={{ fontSize: 12, color: "var(--muted)" }}>Loading recent scans...</p>
                ) : recentScans.length > 0 ? (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>
                      Choose from Recent URL Investigations:
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {recentScans.map((rScan) => {
                        const id = rScan.id || (rScan as any)._id;
                        const score = rScan.riskScore ?? rScan.risk?.score ?? 0;
                        const lvl = (rScan.riskLevel || rScan.risk?.level || "SAFE").toUpperCase();
                        const bColor = lvl === "SAFE" ? "green" : lvl === "LOW" ? "blue" : lvl === "MODERATE" ? "amber" : "red";

                        return (
                          <div 
                            key={id}
                            onClick={() => {
                              setSelectedScanId(id);
                              loadScanData(id);
                            }}
                            className="provider-cg"
                            style={{ 
                              cursor: "pointer", 
                              borderRadius: 8, 
                              padding: "10px 14px", 
                              background: "var(--panel-2)",
                              border: "1px solid var(--line)"
                            }}
                          >
                            <div className="provider-icon-cg">
                              <Globe size={16} />
                            </div>
                            <div className="provider-main-cg">
                              <strong style={{ fontFamily: "monospace", fontSize: 12 }}>{rScan.url}</strong>
                              <p>Confidence: {rScan.confidence ?? 85}% • {new Date(rScan.scannedAt).toLocaleDateString()}</p>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <span style={{ fontSize: 12, fontWeight: 700 }}>{score} / 100</span>
                              <span className={`badge-cg ${bColor}`}>{lvl}</span>
                              <ChevronRight size={14} style={{ color: "var(--muted)" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "28px 0" }}>
                    <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
                      No recent scans detected. Please run a URL scan first to establish threat telemetry.
                    </p>
                    <Link href="/analyzer" className="btn-cg primary">
                      <span>Launch URL Scanner</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* 1. LINKED THREAT SCAN CARD */}
              <div className="card-cg" style={{ marginBottom: 24 }}>
                <div className="card-head-cg" style={{ padding: "16px 20px" }}>
                  <div>
                    <span className="section-tag-cg">LINKED THREAT SCAN</span>
                    <div 
                      style={{ 
                        fontFamily: "monospace", 
                        fontSize: 13, 
                        fontWeight: 700, 
                        color: "var(--text)", 
                        wordBreak: "break-all", 
                        marginTop: 4 
                      }}
                    >
                      {scan?.url}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {scan?.scannedAt && (
                      <span style={{ fontSize: 10, color: "var(--muted)" }}>
                        Analyzed {new Date(scan.scannedAt).toLocaleDateString()}
                      </span>
                    )}
                    <Link 
                      href={`/analyzer?url=${encodeURIComponent(scan?.url || "")}`} 
                      className="btn-cg" 
                      style={{ padding: "5px 10px", fontSize: 11 }}
                      title="Inspect in Analyzer"
                    >
                      <ExternalLink size={12} />
                      <span>Inspect Scan</span>
                    </Link>
                  </div>
                </div>

                <div className="card-body-cg" style={{ padding: "16px 20px" }}>
                  <div className="grid-cg grid3-cg">
                    <div 
                      className="stat-cg" 
                      style={{ 
                        padding: "14px 18px", 
                        minHeight: "auto", 
                        background: "var(--panel-2)", 
                        borderRadius: 8, 
                        border: "1px solid var(--line)" 
                      }}
                    >
                      <div className="label-cg">RISK SCORE</div>
                      <div 
                        className="value-cg" 
                        style={{ fontSize: 26, marginTop: 6, display: "flex", alignItems: "baseline", gap: 4 }}
                      >
                        <span style={{ color: riskColorHex }}>{riskScore}</span>
                        <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500 }}>/ 100</span>
                      </div>
                      <div className="sub-cg">Deterministic calculation</div>
                    </div>

                    <div 
                      className="stat-cg" 
                      style={{ 
                        padding: "14px 18px", 
                        minHeight: "auto", 
                        background: "var(--panel-2)", 
                        borderRadius: 8, 
                        border: "1px solid var(--line)" 
                      }}
                    >
                      <div className="label-cg">RISK LEVEL</div>
                      <div style={{ marginTop: 10 }}>
                        <span className={`badge-cg ${badgeColor}`} style={{ fontSize: 12, padding: "5px 14px" }}>
                          {threatLevel}
                        </span>
                      </div>
                      <div className="sub-cg">Multi-factor severity rating</div>
                    </div>

                    <div 
                      className="stat-cg" 
                      style={{ 
                        padding: "14px 18px", 
                        minHeight: "auto", 
                        background: "var(--panel-2)", 
                        borderRadius: 8, 
                        border: "1px solid var(--line)" 
                      }}
                    >
                      <div className="label-cg">CONFIDENCE</div>
                      <div className="value-cg" style={{ fontSize: 26, marginTop: 6 }}>
                        {confidence}%
                      </div>
                      <div className="sub-cg">Telemetry consensus rating</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. THREAT INTELLIGENCE EVIDENCE (AUTOMATIC SECURITY EVIDENCE) */}
              <div className="card-cg" style={{ marginBottom: 24 }}>
                <div className="card-head-cg" style={{ padding: "16px 20px" }}>
                  <div>
                    <span className="section-tag-cg">AUTOMATICALLY COLLECTED SECURITY EVIDENCE</span>
                    <h3 style={{ fontSize: 14 }}>Threat Intelligence Evidence</h3>
                    <p>Provider findings linked to this incident from CyberGuard AI analysis</p>
                  </div>
                  <span className="badge-cg green">Connected</span>
                </div>

                <div className="card-body-cg" style={{ padding: "16px 20px" }}>
                  {/* Google Safe Browsing */}
                  <div className="provider-cg">
                    <div className="provider-icon-cg">
                      {gsbClean ? <ShieldCheck size={16} /> : <ShieldAlert size={16} style={{ color: "var(--red)" }} />}
                    </div>
                    <div className="provider-main-cg">
                      <strong>Google Safe Browsing</strong>
                      <p>Threat database result</p>
                    </div>
                    <span className={`badge-cg ${!gsbAvail ? "amber" : gsbClean ? "green" : "red"}`}>
                      {!gsbAvail ? "UNAVAILABLE" : gsbClean ? "CLEAN" : "THREAT DETECTED"}
                    </span>
                  </div>

                  {/* VirusTotal */}
                  <div className="provider-cg">
                    <div className="provider-icon-cg">
                      {vtMalicious === 0 ? <ShieldCheck size={16} /> : <ShieldAlert size={16} style={{ color: "var(--red)" }} />}
                    </div>
                    <div className="provider-main-cg">
                      <strong>VirusTotal</strong>
                      <p>Detection engines reporting a match</p>
                    </div>
                    <span className={`badge-cg ${!vtAvail ? "amber" : vtMalicious > 0 ? "red" : "green"}`}>
                      {!vtAvail ? "UNAVAILABLE" : vtMalicious > 0 ? `${vtMalicious} / ${vtTotal}` : `0 / ${vtTotal}`}
                    </span>
                  </div>

                  {/* URLhaus */}
                  <div className="provider-cg">
                    <div className="provider-icon-cg">
                      {!urlhausMatch ? <ShieldCheck size={16} /> : <ShieldAlert size={16} style={{ color: "var(--red)" }} />}
                    </div>
                    <div className="provider-main-cg">
                      <strong>URLhaus</strong>
                      <p>URL database result</p>
                    </div>
                    <span className={`badge-cg ${!urlhausAvail ? "amber" : urlhausMatch ? "red" : "green"}`}>
                      {!urlhausAvail ? "UNAVAILABLE" : urlhausMatch ? "MALWARE LISTED" : "CLEAN"}
                    </span>
                  </div>

                  {/* SSL/TLS */}
                  <div className="provider-cg">
                    <div className="provider-icon-cg">
                      {sslValid ? <Lock size={16} /> : <Unlock size={16} style={{ color: "var(--amber)" }} />}
                    </div>
                    <div className="provider-main-cg">
                      <strong>SSL / TLS</strong>
                      <p>Connection security</p>
                    </div>
                    <span className={`badge-cg ${sslValid ? "green" : "amber"}`}>
                      {sslValid ? "VALID HTTPS" : "HTTP"}
                    </span>
                  </div>

                  {/* URL Intelligence */}
                  {scan?.urlIntelligence && (
                    <div className="provider-cg">
                      <div className="provider-icon-cg">
                        <Globe size={16} />
                      </div>
                      <div className="provider-main-cg">
                        <strong>URL Intelligence</strong>
                        <p>Heuristic syntax & domain reputation telemetry</p>
                      </div>
                      <span className={`badge-cg ${scan.urlIntelligence.level === "HIGH" || scan.urlIntelligence.level === "CRITICAL" ? "red" : scan.urlIntelligence.level === "MODERATE" ? "amber" : "blue"}`}>
                        {scan.urlIntelligence.level || "ANALYZED"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. INCIDENT DETAILS (ANALYST-PROVIDED) */}
              <div className="card-cg" style={{ marginBottom: 24 }}>
                <div className="card-head-cg" style={{ padding: "16px 20px" }}>
                  <div>
                    <span className="section-tag-cg">ANALYST-PROVIDED INCIDENT DETAILS</span>
                    <h3 style={{ fontSize: 14 }}>Incident Details</h3>
                    <p>Provide contextual information about the incident.</p>
                  </div>
                </div>

                <div className="card-body-cg" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Two Column Layout on Desktop: Classification & Date */}
                  <div className="grid-cg grid2-cg">
                    <div>
                      <label 
                        htmlFor="incident-type" 
                        style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}
                      >
                        Incident Classification <span style={{ color: "var(--red)" }}>*</span>
                      </label>
                      <select
                        id="incident-type"
                        value={incidentType}
                        onChange={(e) => setIncidentType(e.target.value)}
                        className="select-cg"
                      >
                        {INCIDENT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label 
                        htmlFor="incident-date" 
                        style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}
                      >
                        Incident Date <span style={{ color: "var(--red)" }}>*</span>
                      </label>
                      <input
                        id="incident-date"
                        type="date"
                        value={incidentDate}
                        onChange={(e) => setIncidentDate(e.target.value)}
                        className="input-cg"
                      />
                    </div>
                  </div>

                  {/* Report Title */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <label 
                        htmlFor="report-title" 
                        style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}
                      >
                        Report Title <span style={{ color: "var(--red)" }}>*</span>
                      </label>
                      <span style={{ fontSize: 10, color: "var(--muted)" }}>
                        {title.length} / 200
                      </span>
                    </div>
                    <input
                      id="report-title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Cyber Incident: fgurb.cannca.shop"
                      maxLength={200}
                      className="input-cg"
                    />
                  </div>

                  {/* Incident Description */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <label 
                        htmlFor="incident-description" 
                        style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}
                      >
                        Incident Description <span style={{ color: "var(--red)" }}>*</span>
                      </label>
                      <span style={{ fontSize: 10, color: "var(--muted)" }}>
                        {description.length} / 5000
                      </span>
                    </div>
                    <textarea
                      id="incident-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe how the suspicious activity was discovered, where the URL was encountered, and any relevant observations."
                      maxLength={5000}
                      rows={5}
                      className="textarea-cg"
                      style={{ minHeight: 140 }}
                    />
                  </div>

                  {/* Optional Context Grid: Source & Affected Account */}
                  <div className="grid-cg grid2-cg">
                    <div>
                      <label 
                        htmlFor="incident-source" 
                        style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}
                      >
                        Encountered Platform / Source
                      </label>
                      <input
                        id="incident-source"
                        type="text"
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        placeholder="e.g. SMS, WhatsApp, Email, Telegram, Browser"
                        maxLength={500}
                        className="input-cg"
                      />
                    </div>

                    <div>
                      <label 
                        htmlFor="affected-account" 
                        style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}
                      >
                        Targeted Account Identifier (Optional)
                      </label>
                      <input
                        id="affected-account"
                        type="text"
                        value={affectedAccount}
                        onChange={(e) => setAffectedAccount(e.target.value)}
                        placeholder="e.g. user@gmail.com (NEVER enter passwords/PINs)"
                        maxLength={320}
                        className="input-cg"
                      />
                      <span style={{ fontSize: 10, color: "var(--muted)", marginTop: 4, display: "block" }}>
                        Only enter non-secret identifiers (like an email address). Never submit passwords or PINs.
                      </span>
                    </div>
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <label 
                      htmlFor="user-notes" 
                      style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}
                    >
                      Additional Investigation Notes
                    </label>
                    <textarea
                      id="user-notes"
                      value={userNotes}
                      onChange={(e) => setUserNotes(e.target.value)}
                      placeholder="Notes on steps already taken: alerted bank, blocked sender number, rotated credentials..."
                      maxLength={5000}
                      rows={3}
                      className="textarea-cg"
                      style={{ minHeight: 90 }}
                    />
                  </div>
                </div>
              </div>

              {/* 4. GEMINI AI ANALYSIS (CONDITIONAL) */}
              {scan?.aiAnalysis?.summary && (
                <div className="card-cg ai-panel-cg" style={{ marginBottom: 24 }}>
                  <div className="card-head-cg" style={{ borderBottomColor: "rgba(155,108,255,0.22)", padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="provider-icon-cg" style={{ color: "var(--purple)", background: "rgba(155,108,255,0.12)" }}>
                        <Sparkles size={16} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: 14 }}>Gemini AI Analysis</h3>
                        <p>Automated contextual assessment and analyst threat explanation</p>
                      </div>
                    </div>
                    <span className="badge-cg purple">AI EXPLANATION</span>
                  </div>

                  <div className="card-body-cg" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <span className="section-tag-cg" style={{ color: "var(--purple)" }}>
                        SECURITY SUMMARY
                      </span>
                      <div className="ai-summary-cg" style={{ marginTop: 6 }}>
                        {scan.aiAnalysis.summary}
                      </div>
                    </div>

                    {scan.aiAnalysis.keyIndicators && scan.aiAnalysis.keyIndicators.length > 0 && (
                      <div>
                        <span className="section-tag-cg">KEY INDICATORS</span>
                        <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 12, color: "var(--text)", lineHeight: 1.6 }}>
                          {scan.aiAnalysis.keyIndicators.map((ind: string, idx: number) => (
                            <li key={idx}>{ind}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {scan.aiAnalysis.recommendedActions && scan.aiAnalysis.recommendedActions.length > 0 && (
                      <div>
                        <span className="section-tag-cg">RECOMMENDED ACTIONS</span>
                        <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 12, color: "var(--text)", lineHeight: 1.6 }}>
                          {scan.aiAnalysis.recommendedActions.map((act: string, idx: number) => (
                            <li key={idx}>{act}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div style={{ fontSize: 10, color: "var(--muted)", fontStyle: "italic", borderTop: "1px solid rgba(155,108,255,0.15)", paddingTop: 10 }}>
                      Safety Note: AI explanations are generated to support analyst investigation. Deterministic risk scores, risk levels, and confidence ratings are strictly derived from automated security telemetry.
                    </div>
                  </div>
                </div>
              )}

              {/* 5. BOTTOM ACTION BAR */}
              <div 
                style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  paddingTop: 16, 
                  paddingBottom: 28, 
                  borderTop: "1px solid var(--line)", 
                  marginTop: 20, 
                  gap: 12, 
                  flexWrap: "wrap" 
                }}
              >
                <Link href="/reports" className="btn-cg">
                  Cancel
                </Link>

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => handleSubmit("DRAFT")}
                    disabled={submitting}
                    className="btn-cg"
                    title="Save current progress as a draft"
                  >
                    <Save size={14} />
                    <span>Save Draft</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSubmit("FINAL")}
                    disabled={submitting}
                    className="btn-cg primary"
                    style={{ minWidth: 200, justifyContent: "center" }}
                  >
                    {submitting ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Creating Report...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Incident Report</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

        </main>
      </div>

      {/* LIVE PREVIEW DRAWER (SLIDE-OVER DOCUMENT PREVIEW) */}
      {previewOpen && (
        <div 
          style={{ 
            position: "fixed", 
            inset: 0, 
            backgroundColor: "rgba(0,0,0,0.65)", 
            backdropFilter: "blur(4px)", 
            zIndex: 60, 
            display: "flex", 
            justifyContent: "flex-end" 
          }}
          onClick={() => setPreviewOpen(false)}
        >
          <div 
            style={{ 
              width: "100%", 
              maxWidth: 680, 
              height: "100%", 
              backgroundColor: "var(--card)", 
              borderLeft: "1px solid var(--line)", 
              display: "flex", 
              flexDirection: "column", 
              boxShadow: "-10px 0 35px rgba(0,0,0,0.5)",
              animation: "tw-slide-in-right 0.2s ease"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div 
              style={{ 
                padding: "16px 22px", 
                borderBottom: "1px solid var(--line)", 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                backgroundColor: "var(--panel)" 
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="logo-cg" style={{ width: 28, height: 28, borderRadius: 8 }}>
                  <FileText size={16} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                    Security Incident Report Preview
                  </h3>
                  <span style={{ fontSize: 10, color: "var(--muted)" }}>
                    Official CyberGuard AI Security Telemetry
                  </span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setPreviewOpen(false)}
                className="btn-cg"
                style={{ padding: "6px 8px" }}
                aria-label="Close Preview"
              >
                <X size={16} />
              </button>
            </div>

            {/* Document Body (Scrollable) */}
            <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
              
              {/* Document Banner */}
              <div 
                style={{ 
                  padding: "14px 18px", 
                  borderRadius: 10, 
                  backgroundColor: "var(--panel-2)", 
                  border: "1px solid var(--line)", 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center" 
                }}
              >
                <div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em" }}>
                    DOCUMENT CLASSIFICATION
                  </span>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginTop: 2 }}>
                    CYBERGUARD INCIDENT DOSSIER
                  </div>
                </div>
                <span className="badge-cg blue">
                  PREVIEW DRAFT
                </span>
              </div>

              {/* Title & Metadata */}
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", margin: "0 0 8px 0" }}>
                  {title || "Untitled Incident Case"}
                </h2>
                <div style={{ display: "flex", gap: 16, fontSize: 11, color: "var(--muted)", flexWrap: "wrap" }}>
                  <span><strong>Date:</strong> {incidentDate}</span>
                  <span><strong>Type:</strong> {incidentType}</span>
                  {source && <span><strong>Source:</strong> {source}</span>}
                  {affectedAccount && <span><strong>Targeted Account:</strong> {affectedAccount}</span>}
                </div>
              </div>

              {/* Target Scan Context */}
              <div 
                style={{ 
                  padding: 16, 
                  borderRadius: 10, 
                  backgroundColor: "var(--bg)", 
                  border: "1px solid var(--line)" 
                }}
              >
                <span className="section-tag-cg">TARGET URL INVESTIGATION</span>
                <div style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "var(--text)", wordBreak: "break-all", marginTop: 4 }}>
                  {scan?.url || "No scan URL attached"}
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 14 }}>
                  <div style={{ padding: "8px 10px", background: "var(--panel)", borderRadius: 6, border: "1px solid var(--line)" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "var(--muted)" }}>RISK SCORE</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: riskColorHex, marginTop: 2 }}>{riskScore} / 100</div>
                  </div>
                  <div style={{ padding: "8px 10px", background: "var(--panel)", borderRadius: 6, border: "1px solid var(--line)" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "var(--muted)" }}>SEVERITY LEVEL</div>
                    <div style={{ marginTop: 4 }}>
                      <span className={`badge-cg ${badgeColor}`}>{threatLevel}</span>
                    </div>
                  </div>
                  <div style={{ padding: "8px 10px", background: "var(--panel)", borderRadius: 6, border: "1px solid var(--line)" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "var(--muted)" }}>CONFIDENCE</div>
                    <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{confidence}%</div>
                  </div>
                </div>
              </div>

              {/* Threat Intelligence Findings Summary */}
              <div>
                <span className="section-tag-cg">THREAT INTELLIGENCE SUMMARY</span>
                <div style={{ border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden", marginTop: 6 }}>
                  <table className="table-cg">
                    <thead>
                      <tr>
                        <th>Provider Engine</th>
                        <th>Finding Telemetry</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Google Safe Browsing</td>
                        <td>Threat database scan</td>
                        <td><span className={`badge-cg ${gsbClean ? "green" : "red"}`}>{gsbClean ? "CLEAN" : "MALICIOUS"}</span></td>
                      </tr>
                      <tr>
                        <td>VirusTotal</td>
                        <td>Multi-engine AV engines</td>
                        <td><span className={`badge-cg ${vtMalicious > 0 ? "red" : "green"}`}>{vtMalicious > 0 ? `${vtMalicious} / ${vtTotal}` : "CLEAN"}</span></td>
                      </tr>
                      <tr>
                        <td>URLhaus</td>
                        <td>Malware distribution repository</td>
                        <td><span className={`badge-cg ${urlhausMatch ? "red" : "green"}`}>{urlhausMatch ? "FLAGGED" : "CLEAN"}</span></td>
                      </tr>
                      <tr>
                        <td>SSL / TLS</td>
                        <td>Connection security certificate</td>
                        <td><span className={`badge-cg ${sslValid ? "green" : "amber"}`}>{sslValid ? "HTTPS" : "HTTP"}</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Incident Description */}
              <div>
                <span className="section-tag-cg">INCIDENT NARRATIVE</span>
                <div 
                  style={{ 
                    padding: 14, 
                    borderRadius: 8, 
                    backgroundColor: "var(--panel-2)", 
                    border: "1px solid var(--line)", 
                    fontSize: 12, 
                    lineHeight: 1.6, 
                    color: "var(--text)", 
                    marginTop: 6,
                    whiteSpace: "pre-wrap"
                  }}
                >
                  {description || "No narrative description provided yet."}
                </div>
              </div>

              {/* Additional Notes */}
              {userNotes && (
                <div>
                  <span className="section-tag-cg">INVESTIGATION ACTIONS & MITIGATIONS</span>
                  <div 
                    style={{ 
                      padding: 14, 
                      borderRadius: 8, 
                      backgroundColor: "var(--panel-2)", 
                      border: "1px solid var(--line)", 
                      fontSize: 12, 
                      lineHeight: 1.6, 
                      color: "var(--text)", 
                      marginTop: 6,
                      whiteSpace: "pre-wrap"
                    }}
                  >
                    {userNotes}
                  </div>
                </div>
              )}

              {/* Gemini AI Synthesis */}
              {scan?.aiAnalysis?.summary && (
                <div>
                  <span className="section-tag-cg" style={{ color: "var(--purple)" }}>
                    GEMINI AI ASSESSMENT
                  </span>
                  <div className="ai-summary-cg" style={{ marginTop: 6, fontSize: 11 }}>
                    {scan.aiAnalysis.summary}
                  </div>
                </div>
              )}

            </div>

            {/* Drawer Footer Actions */}
            <div 
              style={{ 
                padding: "16px 22px", 
                borderTop: "1px solid var(--line)", 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                backgroundColor: "var(--panel)" 
              }}
            >
              <button 
                type="button" 
                onClick={() => setPreviewOpen(false)}
                className="btn-cg"
              >
                Close Preview
              </button>

              <button
                type="button"
                onClick={() => {
                  setPreviewOpen(false);
                  handleSubmit("FINAL");
                }}
                disabled={submitting}
                className="btn-cg primary"
              >
                <span>Save & Generate Final Report</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function CreateReportPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "var(--muted)", fontSize: 12 }}>
          Loading Incident Report Form...
        </div>
      }>
        <CreateReportContent />
      </Suspense>
    </ProtectedRoute>
  );
}
