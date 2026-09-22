import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import cors from "cors";
import { connectDB, isDBConnected } from "./db";
import { notFoundHandler, errorHandler } from "./middleware";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import analyzerRoutes from "./routes/analyzer.routes";
import assistantRoutes from "./routes/assistant.routes";
import reportRoutes from "./routes/report.routes";

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// ─── Middleware ────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const allowedOrigins = [
  FRONTEND_URL,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      return callback(null, true); // Permissive fallback with credentials enabled
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Ensure DB Connection (Serverless Compatible) ──────────────
// On Vercel, each request may be a cold start — ensure MongoDB is connected
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.error("DB connection middleware error:", err);
  }
  next();
});

// ─── Health Check Endpoints (Root & API) ───────────────────────

// Root endpoint
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    name: "CyberGuard AI API",
    version: "1.0.0",
    status: "active",
    docs: "/api/health",
  });
});

// General API Health Checks
app.get(["/health", "/api/health"], (_req: Request, res: Response) => {
  const isKeyConfigured = (val?: string, placeholder?: string) =>
    Boolean(val && val.trim() !== "" && val !== placeholder && val !== "YOUR_API_KEY");

  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    message: "AI Cyber Crime Assistance Platform backend is running",
    providers: {
      safeBrowsing: isKeyConfigured(process.env.GOOGLE_SAFE_BROWSING_API_KEY, "your_google_safe_browsing_api_key")
        ? "configured"
        : "not_configured",
      urlhaus: isKeyConfigured(process.env.URLHAUS_AUTH_KEY, "your_urlhaus_auth_key")
        ? "configured"
        : "not_configured",
      virusTotal: isKeyConfigured(process.env.VIRUSTOTAL_API_KEY, "your_virustotal_api_key")
        ? "configured"
        : "not_configured",
      gemini: isKeyConfigured(process.env.GEMINI_API_KEY, "your_gemini_api_key")
        ? "configured"
        : "not_configured",
    },
  });
});

// Database Health Checks (MongoDB Atlas Connectivity)
app.get(["/health/db", "/api/health/db"], (_req: Request, res: Response) => {
  if (isDBConnected()) {
    res.status(200).json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(503).json({
      status: "error",
      database: "disconnected",
      timestamp: new Date().toISOString(),
    });
  }
});

// ─── Routes ────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/analyzer", analyzerRoutes);
app.use("/api/v1/analyzer", analyzerRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/v1/assistant", assistantRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/v1/reports", reportRoutes);

// ─── 404 & Global Error Handling ───────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Server Startup & Lifecycle ────────────────────────────────
let server: ReturnType<typeof app.listen>;

const startServer = async (): Promise<void> => {
  // Connect to MongoDB before accepting incoming requests
  await connectDB();

  server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📍 API Health: http://localhost:${PORT}/api/health`);
    console.log(`📍 DB Health:  http://localhost:${PORT}/api/health/db`);
  });
};

// Graceful Shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  if (server) {
    server.close(() => {
      console.log("🔒 HTTP server closed.");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

startServer();

export default app;
