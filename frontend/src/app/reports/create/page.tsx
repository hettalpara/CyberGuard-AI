"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  Send,
  Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RiskMeter } from "@/components/common/risk-meter";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { analyzerService } from "@/services/analyzer.service";
import { reportService } from "@/services/report.service";

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
  const scanId = searchParams.get("scanId");

  const [scan, setScan] = useState<any>(null);
  const [loadingScan, setLoadingScan] = useState(true);
  const [scanError, setScanError] = useState<string | null>(null);

  // Form State
  const [incidentType, setIncidentType] = useState("Phishing");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [incidentDate, setIncidentDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [source, setSource] = useState("");
  const [affectedAccount, setAffectedAccount] = useState("");
  const [userNotes, setUserNotes] = useState("");
  const [previewMode, setPreviewMode] = useState(false);

  // Submitting
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!scanId) {
      setLoadingScan(false);
      setScanError("No scan selected. Please select a scan from History or analyze a new URL.");
      return;
    }

    analyzerService
      .getScanById(scanId)
      .then((res) => {
        if (res.data && res.data.scan) {
          const s = res.data.scan;
          setScan(s);
          setTitle(`Cyber Incident: ${s.domain || "Suspicious URL"}`);
        } else {
          setScanError("Scan could not be loaded. Please ensure you own this scan.");
        }
      })
      .catch((err) => {
        setScanError(err?.response?.data?.message || "Failed to load scan context.");
      })
      .finally(() => {
        setLoadingScan(false);
      });
  }, [scanId]);

  const handleSubmit = async (status: "DRAFT" | "FINAL") => {
    if (!scanId) {
      setFormError("Cannot create report without an active scan.");
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
        scanId,
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
        router.push(`/reports/${res.data.report._id}`);
      }
    } catch (err: any) {
      setFormError(
        err?.response?.data?.message || "Failed to save incident report. Please verify inputs."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const threatLevel = scan?.risk?.level || scan?.riskLevel || "SAFE";
  const riskScore = scan?.riskScore !== undefined ? scan.riskScore : scan?.risk?.score ?? 0;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
          {/* Breadcrumb / Back button */}
          <div className="mb-6 flex items-center justify-between">
            <Link
              href={scanId ? `/analyzer?url=${encodeURIComponent(scan?.url || "")}` : "/reports"}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Scanner / Reports
            </Link>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
                className="text-xs border-[#E5E7EB] font-semibold flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                {previewMode ? "Edit Form" : "Live Preview"}
              </Button>
            </div>
          </div>

          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-[#10B981] border border-emerald-200 rounded-full text-xs font-semibold mb-2">
              <FileText className="w-3.5 h-3.5" /> Formal Cybersecurity Case Filing
            </div>
            <h1 className="text-3xl font-extrabold text-[#1F2937] tracking-tight">
              Create Incident Report
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Document suspicious activity, link threat intelligence findings, and generate a downloadable PDF for formal reporting.
            </p>
          </div>

          {formError && (
            <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              {formError}
            </div>
          )}

          {loadingScan ? (
            <Card className="border-[#E5E7EB] bg-white p-12 text-center shadow-sm">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-medium">Loading security scan context...</p>
            </Card>
          ) : scanError ? (
            <Card className="border-red-200 bg-red-50 p-8 text-center shadow-sm">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-red-800">{scanError}</p>
              <Link href="/analyzer" className="inline-block mt-4">
                <Button className="bg-[#10B981] hover:bg-[#059669] text-white text-xs">
                  Go to URL Analyzer
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Linked Scan Snapshot Header */}
              <Card className="border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
                <CardHeader className="pb-3 border-b border-[#E5E7EB] bg-slate-50/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Linked Threat Scan Context
                      </span>
                      <div className="font-mono text-xs font-bold text-[#1F2937] break-all">
                        {scan?.url}
                      </div>
                    </div>
                    <RiskMeter score={riskScore} threatLevel={threatLevel as any} size="sm" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 text-[10px] block font-semibold">Safe Browsing</span>
                    <span className="font-bold text-[#1F2937]">
                      {scan?.safeBrowsing?.threatDetected ? "Threat Flagged" : "Clean"}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 text-[10px] block font-semibold">VirusTotal</span>
                    <span className="font-bold text-[#1F2937]">
                      {scan?.virusTotal?.detectionRatio || `${scan?.virusTotal?.maliciousCount || 0} engines`}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 text-[10px] block font-semibold">URLhaus</span>
                    <span className="font-bold text-[#1F2937]">
                      {scan?.urlhaus?.match ? "Malware Listed" : "Clean"}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 text-[10px] block font-semibold">SSL Status</span>
                    <span className="font-bold text-[#1F2937]">
                      {scan?.ssl?.valid ? "Valid HTTPS" : "Plain HTTP / Invalid"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Form vs Preview */}
              {!previewMode ? (
                <Card className="border-[#E5E7EB] bg-white shadow-sm">
                  <CardHeader className="pb-4 border-b border-[#E5E7EB]">
                    <CardTitle className="text-base font-bold text-[#1F2937]">
                      Incident Details
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Provide contextual information regarding when, where, and how you encountered this malicious link.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Incident Classification *
                        </label>
                        <select
                          value={incidentType}
                          onChange={(e) => setIncidentType(e.target.value)}
                          className="w-full text-xs bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#10B981]"
                        >
                          {INCIDENT_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Incident Date *
                        </label>
                        <Input
                          type="date"
                          value={incidentDate}
                          onChange={(e) => setIncidentDate(e.target.value)}
                          className="text-xs h-9"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Report Title * (max 200 chars)
                      </label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. NetBanking Credential Phishing Attempt via WhatsApp"
                        maxLength={200}
                        className="text-xs h-9"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Incident Description * (max 5000 chars)
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        placeholder="Describe what occurred, any text messages received, sender phone numbers, or suspicious prompts on the page..."
                        maxLength={5000}
                        className="w-full text-xs border border-[#E5E7EB] rounded-xl p-3 text-slate-800 focus:outline-none focus:border-[#10B981]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Encountered Platform / Source (e.g. SMS, Email, Telegram)
                        </label>
                        <Input
                          value={source}
                          onChange={(e) => setSource(e.target.value)}
                          placeholder="e.g. SMS from unknown sender"
                          maxLength={500}
                          className="text-xs h-9"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Targeted Account Identifier (Optional)
                        </label>
                        <Input
                          value={affectedAccount}
                          onChange={(e) => setAffectedAccount(e.target.value)}
                          placeholder="e.g. user@gmail.com (NEVER enter passwords/PINs)"
                          maxLength={320}
                          className="text-xs h-9"
                        />
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Only enter non-secret identifiers (like an email address). Never submit passwords or PINs.
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Additional Investigation Notes
                      </label>
                      <textarea
                        value={userNotes}
                        onChange={(e) => setUserNotes(e.target.value)}
                        rows={3}
                        placeholder="Notes on steps already taken: alerted bank, blocked number, rotated credentials..."
                        maxLength={5000}
                        className="w-full text-xs border border-[#E5E7EB] rounded-xl p-3 text-slate-800 focus:outline-none focus:border-[#10B981]"
                      />
                    </div>

                    <div className="pt-4 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-end gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={submitting}
                        onClick={() => handleSubmit("DRAFT")}
                        className="w-full sm:w-auto border-[#E5E7EB] text-slate-700 hover:bg-slate-50 text-xs px-5 h-10 rounded-xl font-semibold"
                      >
                        <Save className="w-4 h-4 mr-1.5" /> Save as Draft
                      </Button>
                      <Button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleSubmit("FINAL")}
                        className="w-full sm:w-auto bg-[#10B981] hover:bg-[#059669] text-white text-xs px-6 h-10 rounded-xl font-bold flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        {submitting ? "Saving Report..." : "Generate Final Report"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* Live Preview Mode */
                <div className="space-y-6 bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm">
                  <div className="border-b border-[#E5E7EB] pb-4 flex items-center justify-between">
                    <div>
                      <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-mono font-bold">
                        PREVIEW • DRAFT
                      </span>
                      <h2 className="text-xl font-bold text-[#1F2937] mt-2">
                        {title || "Untitled Incident"}
                      </h2>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setPreviewMode(false)}
                      className="bg-[#10B981] text-white text-xs"
                    >
                      Back to Edit Form
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block font-medium">Incident Type:</span>
                      <span className="font-bold text-slate-800">{incidentType}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Incident Date:</span>
                      <span className="font-bold text-slate-800">{incidentDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Source / Platform:</span>
                      <span className="font-bold text-slate-800">{source || "Not specified"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Targeted Account:</span>
                      <span className="font-bold text-slate-800">{affectedAccount || "None"}</span>
                    </div>
                  </div>

                  <div className="text-xs">
                    <span className="text-slate-400 block font-medium mb-1">Description:</span>
                    <p className="p-3 bg-slate-50 rounded-xl text-slate-800 leading-relaxed border border-slate-100">
                      {description || "No description entered."}
                    </p>
                  </div>

                  {userNotes && (
                    <div className="text-xs">
                      <span className="text-slate-400 block font-medium mb-1">Investigation Notes:</span>
                      <p className="p-3 bg-slate-50 rounded-xl text-slate-800 leading-relaxed border border-slate-100">
                        {userNotes}
                      </p>
                    </div>
                  )}

                  {/* AI Synthesis Preview */}
                  {scan?.aiAnalysis?.summary && (
                    <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                      <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Gemini AI Threat Assessment
                      </span>
                      <p className="text-xs text-emerald-950 leading-relaxed font-medium">
                        {scan.aiAnalysis.summary}
                      </p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-[#E5E7EB] flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setPreviewMode(false)}
                      className="text-xs"
                    >
                      Continue Editing
                    </Button>
                    <Button
                      disabled={submitting}
                      onClick={() => handleSubmit("FINAL")}
                      className="bg-[#10B981] text-white text-xs font-bold"
                    >
                      Confirm & Save Report
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function CreateReportPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Report Form...</div>}>
        <CreateReportContent />
      </Suspense>
    </ProtectedRoute>
  );
}
