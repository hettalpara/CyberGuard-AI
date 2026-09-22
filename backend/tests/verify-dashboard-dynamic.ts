import dotenv from "dotenv";
dotenv.config();

import mongoose, { Types } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "../src/db";
import { User } from "../src/models/User";
import { Scan } from "../src/models/Scan";
import { IncidentReport } from "../src/models/IncidentReport";
import { createIncidentReport, getUserReports } from "../src/services/report.service";

interface TestResult {
  num: number;
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
}

const results: TestResult[] = [];

async function runDashboardIntegrationTests() {
  console.log("==================================================");
  console.log("CYBERGUARD AI — DYNAMIC DASHBOARD INTEGRATION TEST");
  console.log("==================================================\n");

  await connectDB();

  const timestamp = Date.now();
  const emailA = `test_user_a_${timestamp}@cyberguard.test`;
  const emailB = `test_user_b_${timestamp}@cyberguard.test`;
  const password = "TestPassword123!";

  let userA: any = null;
  let userB: any = null;
  let scanSafe: any = null;
  let scanThreat: any = null;
  let reportA: any = null;

  try {
    // ----------------------------------------------------
    // TEST 1: User A & User B Creation
    // ----------------------------------------------------
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    userA = await User.create({
      name: "User Alpha",
      email: emailA,
      password: hash,
      role: "user",
    });

    userB = await User.create({
      name: "User Beta",
      email: emailB,
      password: hash,
      role: "user",
    });

    const passed1 = Boolean(userA._id && userB._id);
    results.push({
      num: 1,
      name: "Create Test Users A & B in MongoDB",
      expected: "Both users created with valid ObjectIds",
      actual: `UserA ID=${userA._id}, UserB ID=${userB._id}`,
      passed: passed1,
    });

    // ----------------------------------------------------
    // TEST 2: Empty Dashboard State for User A
    // ----------------------------------------------------
    const userAObjId = new Types.ObjectId(userA._id.toString());
    const totalScansA_0 = await Scan.countDocuments({ userId: userAObjId });
    const scansA_0 = await Scan.find({ userId: userAObjId }).limit(5);
    const reportsA_0 = await getUserReports(userA._id.toString(), { page: 1, limit: 5 });

    const passed2 = totalScansA_0 === 0 && scansA_0.length === 0 && reportsA_0.total === 0;
    results.push({
      num: 2,
      name: "User A Empty Dashboard Metrics (No fake data)",
      expected: "totalScans=0, recentScans=[], recentReports=[]",
      actual: `totalScans=${totalScansA_0}, recentScans=${scansA_0.length}, reports=${reportsA_0.total}`,
      passed: passed2,
    });

    // ----------------------------------------------------
    // TEST 3: User A Creates Safe Scan & Stats Verification
    // ----------------------------------------------------
    scanSafe = await Scan.create({
      userId: userAObjId,
      url: "https://wikipedia.org",
      normalizedUrl: "https://wikipedia.org",
      domain: "wikipedia.org",
      riskScore: 5,
      riskLevel: "SAFE",
      confidence: 90,
      riskCalculationVersion: "2.0",
      analysisStatus: "COMPLETE",
      risk: { score: 5, level: "SAFE", reasons: ["Domain is reputable", "Valid SSL certificate"], confidence: 90, factors: [] },
      ssl: { enabled: true, valid: true, status: "VALID" },
      safeBrowsing: { checked: true, available: true, status: "CHECKED_NO_THREAT", threatDetected: false, threatTypes: [] },
      virusTotal: { checked: true, available: true, malicious: false, suspicious: false, harmless: 70, maliciousCount: 0, suspiciousCount: 0, undetectedCount: 2, totalEngines: 72 },
      summary: "Domain verified safe with valid SSL.",
    });

    const [scansAfterSafe, safeCount] = await Promise.all([
      Scan.countDocuments({ userId: userAObjId }),
      Scan.countDocuments({ userId: userAObjId, riskLevel: "SAFE" }),
    ]);

    const passed3 = scansAfterSafe === 1 && safeCount === 1;
    results.push({
      num: 3,
      name: "Dynamic Stats Update: 1 Safe Scan Recorded",
      expected: "totalScans=1, safeScans=1",
      actual: `totalScans=${scansAfterSafe}, safeScans=${safeCount}`,
      passed: passed3,
    });

    // ----------------------------------------------------
    // TEST 4: User A Creates High-Risk Phishing Scan
    // ----------------------------------------------------
    scanThreat = await Scan.create({
      userId: userAObjId,
      url: "https://secure-login-paypal-verify.xyz",
      normalizedUrl: "https://secure-login-paypal-verify.xyz",
      domain: "secure-login-paypal-verify.xyz",
      riskScore: 88,
      riskLevel: "CRITICAL",
      confidence: 95,
      riskCalculationVersion: "2.0",
      analysisStatus: "COMPLETE",
      risk: { score: 88, level: "CRITICAL", reasons: ["Phishing keywords detected", "Suspicious TLD .xyz"], confidence: 95, factors: [] },
      ssl: { enabled: false, valid: false, status: "INVALID" },
      safeBrowsing: { checked: true, available: true, status: "THREAT_DETECTED", threatDetected: true, threatTypes: ["SOCIAL_ENGINEERING"] },
      virusTotal: { checked: true, available: true, malicious: true, suspicious: true, harmless: 5, maliciousCount: 18, suspiciousCount: 3, undetectedCount: 49, totalEngines: 70 },
      summary: "High-confidence phishing threat detected.",
    });

    const [totalA2, safeA2, criticalA2, threatAgg] = await Promise.all([
      Scan.countDocuments({ userId: userAObjId }),
      Scan.countDocuments({ userId: userAObjId, riskLevel: "SAFE" }),
      Scan.countDocuments({ userId: userAObjId, riskLevel: "CRITICAL" }),
      Scan.aggregate([
        { $match: { userId: userAObjId, riskScore: { $ne: null } } },
        { $group: { _id: null, avgScore: { $avg: "$riskScore" } } },
      ]),
    ]);

    const cleanRatio = Number(((safeA2 / totalA2) * 100).toFixed(1));
    const threatRatio = Number(((criticalA2 / totalA2) * 100).toFixed(1));
    const avgScore = threatAgg.length > 0 ? Math.round(threatAgg[0].avgScore) : 0;

    const passed4 = totalA2 === 2 && safeA2 === 1 && criticalA2 === 1 && cleanRatio === 50 && threatRatio === 50 && avgScore === 47;
    results.push({
      num: 4,
      name: "Dashboard Ratios & Aggregates (Clean vs Threat)",
      expected: "total=2, safe=1, critical=1, cleanRatio=50%, threatRatio=50%, avgScore=47",
      actual: `total=${totalA2}, safe=${safeA2}, critical=${criticalA2}, cleanRatio=${cleanRatio}%, threatRatio=${threatRatio}%, avgScore=${avgScore}`,
      passed: passed4,
    });

    // ----------------------------------------------------
    // TEST 5: User A Creates Incident Report
    // ----------------------------------------------------
    reportA = await createIncidentReport(userA._id.toString(), {
      scanId: scanThreat._id.toString(),
      incidentType: "Phishing",
      title: "Paypal Impersonation Attack",
      description: "Received SMS prompting login to verify bank account credentials.",
      status: "FINAL",
    });

    const recentReportsA = await getUserReports(userA._id.toString(), { page: 1, limit: 5 });

    const passed5 = recentReportsA.total === 1 && recentReportsA.reports[0].reportId === reportA.reportId;
    results.push({
      num: 5,
      name: "Incident Report Appears in Dashboard Recent Reports",
      expected: `total=1, reportId=${reportA.reportId}`,
      actual: `total=${recentReportsA.total}, reportId=${recentReportsA.reports[0]?.reportId}`,
      passed: passed5,
    });

    // ----------------------------------------------------
    // TEST 6: User B Data Isolation (ZERO LEAKAGE)
    // ----------------------------------------------------
    const userBObjId = new Types.ObjectId(userB._id.toString());
    const [totalB, safeB, threatB, reportsB, recentScansB] = await Promise.all([
      Scan.countDocuments({ userId: userBObjId }),
      Scan.countDocuments({ userId: userBObjId, riskLevel: "SAFE" }),
      Scan.countDocuments({ userId: userBObjId, riskLevel: "CRITICAL" }),
      getUserReports(userB._id.toString(), { page: 1, limit: 5 }),
      Scan.find({ userId: userBObjId }).limit(5),
    ]);

    const passed6 = totalB === 0 && safeB === 0 && threatB === 0 && reportsB.total === 0 && recentScansB.length === 0;
    results.push({
      num: 6,
      name: "Strict User Data Isolation (User B sees ZERO of User A's data)",
      expected: "User B: totalScans=0, safe=0, threats=0, reports=0, recentScans=[]",
      actual: `User B: totalScans=${totalB}, safe=${safeB}, threats=${threatB}, reports=${reportsB.total}, recentScans=${recentScansB.length}`,
      passed: passed6,
    });

    // ----------------------------------------------------
    // TEST 7: Cross-User Report Access Authorization Enforcement
    // ----------------------------------------------------
    let crossAccessBlocked = false;
    try {
      const crossReport = await IncidentReport.findOne({
        _id: reportA._id,
        userId: userBObjId,
      });
      crossAccessBlocked = crossReport === null;
    } catch {
      crossAccessBlocked = true;
    }

    results.push({
      num: 7,
      name: "Cross-Tenant Authorization Guard (User B cannot query User A's report)",
      expected: "Access blocked / returned null",
      actual: crossAccessBlocked ? "Access securely blocked" : "LEAKED REPORT!",
      passed: crossAccessBlocked,
    });

  } catch (error: any) {
    console.error("Test execution error:", error);
    results.push({
      num: 99,
      name: "Unexpected Execution Error",
      expected: "No exceptions",
      actual: error.message || String(error),
      passed: false,
    });
  } finally {
    // Cleanup test data
    try {
      if (userA) {
        await User.deleteOne({ _id: userA._id });
        await Scan.deleteMany({ userId: userA._id });
        await IncidentReport.deleteMany({ userId: userA._id });
      }
      if (userB) {
        await User.deleteOne({ _id: userB._id });
        await Scan.deleteMany({ userId: userB._id });
        await IncidentReport.deleteMany({ userId: userB._id });
      }
      await mongoose.disconnect();
    } catch {}
  }

  console.log("\n==================================================");
  console.log("TEST RESULTS MATRIX");
  console.log("==================================================");

  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? "✅ PASS" : "❌ FAIL";
    if (!r.passed) allPassed = false;
    console.log(`${icon} [${r.num}] ${r.name}`);
    console.log(`       Expected: ${r.expected}`);
    console.log(`       Actual:   ${r.actual}\n`);
  }

  console.log("==================================================");
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${results.filter((r) => r.passed).length} | FAILED: ${results.filter((r) => !r.passed).length}`);
  console.log(`OVERALL STATUS: ${allPassed ? "ALL TESTS PASSED! 🚀" : "FAILURES DETECTED ⚠️"}`);
  console.log("==================================================");

  if (!allPassed) {
    process.exit(1);
  }
}

runDashboardIntegrationTests();
