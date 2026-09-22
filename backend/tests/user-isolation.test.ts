import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import reportRoutes from "../src/routes/report.routes";
import { notFoundHandler, errorHandler } from "../src/middleware";
import { IncidentReport } from "../src/models/IncidentReport";
import { User } from "../src/models/User";
import { processAssistantChat } from "../src/services/assistant.service";
import { Scan } from "../src/models/Scan";

const app = express();
app.use(express.json());
app.use("/api/reports", reportRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

describe("Multi-Tenant User Data Isolation Security Suite", () => {
  const JWT_SECRET = "isolation_test_secret";

  const userA_id = new Types.ObjectId();
  const userB_id = new Types.ObjectId();

  const userA_token = jwt.sign({ userId: userA_id.toString() }, JWT_SECRET, { expiresIn: "1h" });
  const userB_token = jwt.sign({ userId: userB_id.toString() }, JWT_SECRET, { expiresIn: "1h" });

  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    vi.restoreAllMocks();

    // Mock User lookup for authMiddleware
    vi.spyOn(User, "findById").mockImplementation(((id: any) => {
      const idStr = id?.toString();
      const isA = idStr === userA_id.toString();
      return {
        select: vi.fn().mockResolvedValue({
          _id: isA ? userA_id : userB_id,
          name: isA ? "User A" : "User B",
          email: isA ? "userA@test.com" : "userB@test.com",
          role: "user",
        }),
      };
    }) as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prevents User B from accessing User A's incident report details", async () => {
    const reportA = {
      _id: new Types.ObjectId(),
      reportId: "CR-2026-0001",
      userId: userA_id,
      incidentType: "phishing",
      status: "open",
      snapshot: { url: "https://phish-attack.test", riskScore: 85, riskLevel: "CRITICAL" },
    };

    // User A can access it
    vi.spyOn(IncidentReport, "findOne").mockImplementation(((query: any) => {
      if (query.reportId === "CR-2026-0001" && query.userId?.toString() === userA_id.toString()) {
        return Promise.resolve(reportA);
      }
      return Promise.resolve(null);
    }) as any);

    const resUserA = await request(app)
      .get("/api/reports/CR-2026-0001")
      .set("Authorization", `Bearer ${userA_token}`);

    expect(resUserA.status).toBe(200);
    expect(resUserA.body.report.reportId).toBe("CR-2026-0001");

    // User B attempts to access User A's report
    const resUserB = await request(app)
      .get("/api/reports/CR-2026-0001")
      .set("Authorization", `Bearer ${userB_token}`);

    expect(resUserB.status).toBe(404);
    expect(resUserB.body.success).toBe(false);
    expect(resUserB.body.message).toContain("not found");
  });

  it("prevents User B from updating User A's incident report", async () => {
    vi.spyOn(IncidentReport, "findOne").mockImplementation(((query: any) => {
      // Report belongs to User A, so querying with User B's ID yields null
      if (query.reportId === "CR-2026-0001" && query.userId?.toString() === userA_id.toString()) {
        return Promise.resolve({
          reportId: "CR-2026-0001",
          userId: userA_id,
          save: vi.fn(),
        });
      }
      return Promise.resolve(null);
    }) as any);

    const res = await request(app)
      .patch("/api/reports/CR-2026-0001")
      .set("Authorization", `Bearer ${userB_token}`)
      .send({ notes: "Malicious modification by User B" });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("not found");
  });

  it("prevents User B from deleting User A's incident report", async () => {
    vi.spyOn(IncidentReport, "findOne").mockImplementation(((query: any) => {
      // Report belongs to User A, so querying with User B's ID yields null
      if (query.reportId === "CR-2026-0001" && query.userId?.toString() === userA_id.toString()) {
        return Promise.resolve({
          _id: new Types.ObjectId(),
          reportId: "CR-2026-0001",
          userId: userA_id,
        });
      }
      return Promise.resolve(null);
    }) as any);

    const res = await request(app)
      .delete("/api/reports/CR-2026-0001")
      .set("Authorization", `Bearer ${userB_token}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("not found");
  });

  it("prevents User B from querying AI assistant with User A's scan ID", async () => {
    const scanA_id = new Types.ObjectId();
    const mockScanA = {
      _id: scanA_id,
      userId: userA_id, // Belongs to User A
      url: "https://confidential-userA-site.com",
      riskScore: 70,
      riskLevel: "HIGH",
    };

    vi.spyOn(Scan, "findById").mockResolvedValue(mockScanA as any);

    const chatResult = await processAssistantChat({
      message: "Explain the threats on this scan",
      userId: userB_id.toString(), // User B is making the request
      scanId: scanA_id.toString(),
    });

    expect(chatResult.success).toBe(false);
    expect(chatResult.status).toBe(403);
    expect(chatResult.errorCode).toBe("FORBIDDEN_SCAN_ACCESS");
    expect(chatResult.message).toContain("permission");
  });
});
