"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Download,
  Edit3,
  Trash2,
  ArrowLeft,
  Shield,
  ShieldAlert,
  Lock,
  Cpu,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  Clock,
  ExternalLink,
  Bot,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RiskMeter } from "@/components/common/risk-meter";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";
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

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportIdParam = params?.id as string;

  const [report, setReport] = useState<IncidentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // PDF download state
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIncidentType, setEditIncidentType] = useState("");
  const [editIncidentDate, setEditIncidentDate] = useState("");
  const [editSource, setEditSource] = useState("");
  const [editAffectedAccount, setEditAffectedAccount] = useState("");
  const [editUserNotes, setEditUserNotes] = useState("");
  const [editStatus, setEditStatus] = useState<"DRAFT" | "FINAL" | "ARCHIVED">("DRAFT");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (!reportIdParam) return;

    reportService
      .getReportById(reportIdParam)
      .then((res) => {
        if (res.data && res.data.report) {
          const r = res.data.report;
          setReport(r);
          setEditTitle(r.title);
          setEditDescription(r.description);
          setEditIncidentType(r.incidentType);
          setEditIncidentDate(r.incidentDate ? r.incidentDate.substring(0, 10) : "");
          setEditSource(r.source || "");
          setEditAffectedAccount(r.affectedAccount || "");
          setEditUserNotes(r.userNotes || "");
          setEditStatus(r.status);
        } else {
          setError("Incident report not found.");
        }
      })
      .catch((err) => {
        setError(err?.response?.data?.message || "Failed to load incident report.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [reportIdParam]);

  const handleDownloadPdf = async () => {
    if (!report) return;
    setDownloadingPdf(true);
    try {
      await reportService.downloadReportPdf(
        report._id,
        `CyberGuard-Incident-Report-${report.reportId}.pdf`
      );
    } catch (err: any) {
      alert("Failed to download PDF report. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!report) return;
    if (!editTitle.trim()) {
      setEditError("Title cannot be empty.");
      return;
    }
    if (!editDescription.trim()) {
      setEditError("Description cannot be empty.");
      return;
    }

    setSavingEdit(true);
    setEditError(null);

    try {
      const res = await reportService.updateReport(report._id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        incidentType: editIncidentType,
        incidentDate: editIncidentDate,
        source: editSource.trim(),
        affectedAccount: editAffectedAccount.trim(),
        userNotes: editUserNotes.trim(),
        status: editStatus,
      });

      if (res.data && res.data.report) {
        setReport(res.data.report);
        setIsEditing(false);
      }
    } catch (err: any) {
      setEditError(err?.response?.data?.message || "Failed to update report.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!report) return;
    if (!confirm(`Are you sure you want to delete incident report ${report.reportId}?`)) {
      return;
    }

    try {
      await reportService.deleteReport(report._id);
      router.push("/reports");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete report.");
    }
  };

  const snap = report?.snapshot;
  const threatLevel = snap?.riskLevel || "SAFE";
  const riskScore = snap?.riskScore !== null && snap?.riskScore !== undefined ? snap.riskScore : null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFC]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
            {/* Top Navigation */}
            <div className="mb-6 flex items-center justify-between">
              <Link
                href="/reports"
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-4 h-4" /> Back to All Reports
              </Link>
              {report && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-xs border-[#E5E7EB] font-semibold flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    {isEditing ? "Cancel Edit" : "Edit Details"}
                  </Button>
                  <Button
                    size="sm"
                    disabled={downloadingPdf}
                    onClick={handleDownloadPdf}
                    className="bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {downloadingPdf ? "Generating PDF..." : "Download PDF"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    className="text-xs text-slate-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>

            {loading ? (
              <Card className="border-[#E5E7EB] bg-white p-12 text-center shadow-sm">
                <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-500 font-medium">Loading report records...</p>
              </Card>
            ) : error || !report ? (
              <Card className="border-red-200 bg-red-50 p-8 text-center shadow-sm">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-red-800">{error || "Report not found"}</p>
                <Link href="/reports" className="inline-block mt-4">
                  <Button className="bg-[#10B981] text-white text-xs">Back to Reports</Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Report Header Card */}
                <Card className="border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                          {report.reportId}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[11px] font-bold rounded border ${
                            report.status === "FINAL"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : report.status === "ARCHIVED"
                              ? "bg-slate-100 text-slate-600 border-slate-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {report.status}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-50 text-slate-600 text-[11px] font-semibold rounded border border-slate-200">
                          {report.incidentType}
                        </span>
                      </div>
                      <h1 className="text-2xl font-black text-[#1F2937] tracking-tight">
                        {report.title}
                      </h1>
                      <p className="text-xs text-slate-400 mt-1">
                        Incident Date: {new Date(report.incidentDate).toLocaleDateString()} • Created: {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="shrink-0">
                      <RiskMeter score={riskScore} threatLevel={threatLevel as any} size="md" />
                    </div>
                  </div>
                </Card>

                {/* Edit Form Modal/Card (if active) */}
                {isEditing && (
                  <Card className="border-emerald-200 bg-emerald-50/20 shadow-sm">
                    <CardHeader className="pb-3 border-b border-emerald-100">
                      <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-[#10B981]" /> Edit Incident Details
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500">
                        Update user context. Security snapshot findings remain authoritative and cannot be modified.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      {editError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
                          {editError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Incident Type
                          </label>
                          <select
                            value={editIncidentType}
                            onChange={(e) => setEditIncidentType(e.target.value)}
                            className="w-full text-xs bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-slate-800"
                          >
                            {INCIDENT_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Incident Date
                          </label>
                          <Input
                            type="date"
                            value={editIncidentDate}
                            onChange={(e) => setEditIncidentDate(e.target.value)}
                            className="text-xs h-9 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Lifecycle Status
                          </label>
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as any)}
                            className="w-full text-xs bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-slate-800"
                          >
                            <option value="DRAFT">DRAFT</option>
                            <option value="FINAL">FINAL</option>
                            <option value="ARCHIVED">ARCHIVED</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Report Title
                        </label>
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          maxLength={200}
                          className="text-xs h-9 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Incident Description
                        </label>
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          rows={4}
                          maxLength={5000}
                          className="w-full text-xs border border-[#E5E7EB] rounded-xl p-3 text-slate-800 bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Source / Platform
                          </label>
                          <Input
                            value={editSource}
                            onChange={(e) => setEditSource(e.target.value)}
                            maxLength={500}
                            className="text-xs h-9 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Affected Account Identifier
                          </label>
                          <Input
                            value={editAffectedAccount}
                            onChange={(e) => setEditAffectedAccount(e.target.value)}
                            maxLength={320}
                            className="text-xs h-9 bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Investigation Notes
                        </label>
                        <textarea
                          value={editUserNotes}
                          onChange={(e) => setEditUserNotes(e.target.value)}
                          rows={3}
                          maxLength={5000}
                          className="w-full text-xs border border-[#E5E7EB] rounded-xl p-3 text-slate-800 bg-white"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-emerald-100">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditing(false)}
                          className="text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          disabled={savingEdit}
                          onClick={handleSaveEdit}
                          className="bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold"
                        >
                          {savingEdit ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 1. Incident Details Card */}
                <Card className="border-[#E5E7EB] bg-white shadow-sm">
                  <CardHeader className="pb-3 border-b border-[#E5E7EB]">
                    <CardTitle className="text-sm font-bold text-[#1F2937]">
                      1. Incident Narrative & User Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <span className="text-slate-400 block font-medium">Incident Type</span>
                        <span className="font-bold text-slate-800">{report.incidentType}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Incident Date</span>
                        <span className="font-bold text-slate-800">
                          {new Date(report.incidentDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Source / Platform</span>
                        <span className="font-bold text-slate-800">{report.source || "None entered"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Targeted Account</span>
                        <span className="font-bold text-slate-800">{report.affectedAccount || "None entered"}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium mb-1">Description:</span>
                      <p className="p-4 bg-slate-50 rounded-xl text-slate-800 leading-relaxed border border-slate-100 text-xs">
                        {report.description}
                      </p>
                    </div>

                    {report.userNotes && (
                      <div>
                        <span className="text-slate-400 block font-medium mb-1">User Notes:</span>
                        <p className="p-4 bg-slate-50 rounded-xl text-slate-800 leading-relaxed border border-slate-100 text-xs">
                          {report.userNotes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 2. Frozen Security Analysis Snapshot Card */}
                <Card className="border-[#E5E7EB] bg-white shadow-sm">
                  <CardHeader className="pb-3 border-b border-[#E5E7EB]">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold text-[#1F2937]">
                        2. Technical Security Analysis Snapshot
                      </CardTitle>
                      <span className="text-[11px] font-mono text-slate-400">
                        Scanned: {snap?.scannedAt ? new Date(snap.scannedAt).toLocaleString() : "N/A"}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-5 text-xs">
                    {/* URL row */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Target URL
                      </span>
                      <div className="font-mono text-xs font-bold text-slate-900 break-all mt-0.5">
                        {snap?.url}
                      </div>
                    </div>

                    {/* Threat Intelligence Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      {/* Safe Browsing */}
                      <div className="p-3.5 bg-white border border-[#E5E7EB] rounded-xl space-y-1">
                        <span className="text-[10px] font-semibold text-slate-400 block">
                          Google Safe Browsing
                        </span>
                        <div className="font-bold text-slate-800">
                          {snap?.safeBrowsing?.threatDetected ? "Threat Flagged" : "Clean"}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">
                          {snap?.safeBrowsing?.threatTypes?.join(", ") || "No threat lists matched"}
                        </p>
                      </div>

                      {/* VirusTotal */}
                      <div className="p-3.5 bg-white border border-[#E5E7EB] rounded-xl space-y-1">
                        <span className="text-[10px] font-semibold text-slate-400 block">
                          VirusTotal Consensus
                        </span>
                        <div className="font-bold text-slate-800">
                          {snap?.virusTotal?.detectionRatio || `${snap?.virusTotal?.maliciousCount || 0} flagged`}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">
                          {snap?.virusTotal?.malicious ? "Malicious signatures detected" : "No engines flagged"}
                        </p>
                      </div>

                      {/* URLhaus */}
                      <div className="p-3.5 bg-white border border-[#E5E7EB] rounded-xl space-y-1">
                        <span className="text-[10px] font-semibold text-slate-400 block">
                          URLhaus Malware
                        </span>
                        <div className="font-bold text-slate-800">
                          {snap?.urlhaus?.match ? "Malware Listed" : "No Match"}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">
                          {snap?.urlhaus?.threatType || "Clean database check"}
                        </p>
                      </div>

                      {/* Local URL Intelligence */}
                      <div className="p-3.5 bg-white border border-[#E5E7EB] rounded-xl space-y-1">
                        <span className="text-[10px] font-semibold text-slate-400 block">
                          URL Intelligence
                        </span>
                        <div className="font-bold text-slate-800">
                          Score: {snap?.urlIntelligence?.score ?? "N/A"}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">
                          {snap?.urlIntelligence?.indicators?.map((i) => i.name).join(", ") || "Structural indicators"}
                        </p>
                      </div>

                      {/* SSL Analysis */}
                      <div className="p-3.5 bg-white border border-[#E5E7EB] rounded-xl space-y-1">
                        <span className="text-[10px] font-semibold text-slate-400 block">
                          SSL / Encryption
                        </span>
                        <div className="font-bold text-slate-800">
                          {snap?.sslAnalysis?.status || (snap?.ssl?.valid ? "VALID" : "INSECURE")}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">
                          {snap?.sslAnalysis?.protocol || (snap?.ssl?.valid ? "HTTPS" : "HTTP")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 3. Gemini AI Security Synthesis Card */}
                <Card className="border-[#E5E7EB] bg-white shadow-sm">
                  <CardHeader className="pb-3 border-b border-[#E5E7EB]">
                    <CardTitle className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
                      <Bot className="w-4 h-4 text-[#10B981]" /> 3. Gemini AI Security Synthesis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4 text-xs">
                    {snap?.aiAnalysis?.available ? (
                      <>
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                            Executive Threat Summary
                          </span>
                          <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                            {snap.aiAnalysis.summary}
                          </p>
                        </div>

                        {snap.aiAnalysis.explanation && (
                          <div>
                            <span className="text-slate-400 font-semibold block mb-1">
                              Technical Explanation:
                            </span>
                            <p className="text-slate-800 leading-relaxed text-xs">
                              {snap.aiAnalysis.explanation}
                            </p>
                          </div>
                        )}

                        {snap.aiAnalysis.keyIndicators && snap.aiAnalysis.keyIndicators.length > 0 && (
                          <div>
                            <span className="text-slate-400 font-semibold block mb-1">
                              Key Security Indicators:
                            </span>
                            <ul className="list-disc list-inside space-y-1 text-slate-800">
                              {snap.aiAnalysis.keyIndicators.map((ind, i) => (
                                <li key={i}>{ind}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {snap.aiAnalysis.recommendedActions && snap.aiAnalysis.recommendedActions.length > 0 && (
                          <div>
                            <span className="text-slate-400 font-semibold block mb-1">
                              Defensive Actions Recommended:
                            </span>
                            <div className="space-y-1.5">
                              {snap.aiAnalysis.recommendedActions.map((act, i) => (
                                <div key={i} className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                                  <span className="text-slate-800">{act}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-slate-500 italic p-4 bg-slate-50 rounded-xl">
                        AI security explanation was unavailable at the time of analysis.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* 4. Disclaimer & Helpline Notice */}
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-red-900 block">
                    Statutory Advisory & Cyber Crime Helpline Notice
                  </span>
                  <p className="text-red-800 leading-relaxed">
                    This report summarizes the security signals available to CyberGuard AI at the time of analysis. A security scan cannot guarantee that a website is completely safe or malicious. If financial fraud or identity theft has occurred, immediately contact the National Cyber Crime Helpline at <strong>1930</strong> or register an incident at <strong>https://cybercrime.gov.in</strong>.
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
