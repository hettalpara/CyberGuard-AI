import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import cors from "cors";
import { connectDB, isDBConnected } from "./db";
import { notFoundHandler, errorHandler } from "./middleware";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import analyzerRoutes from "./routes/analyzer.routes";

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// ─── Middleware ────────────────────────────────────────────────
app.use(express.json());
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// ─── Routes ────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/analyzer", analyzerRoutes);
app.use("/api/v1/analyzer", analyzerRoutes);

// ─── Health Check Endpoints ────────────────────────────────────

// General API Health Check
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    message: "AI Cyber Crime Assistance Platform backend is running",
  });
});

// Database Health Check (MongoDB Atlas Connectivity)
app.get("/api/health/db", (_req: Request, res: Response) => {
  if (isDBConnected()) {
    res.status(200).json({
      status: "ok",
      database: "connected",
    });
  } else {
    res.status(503).json({
      status: "error",
      database: "disconnected",
    });
  }
});

// ─── 404 & Global Error Handling ───────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Server Startup ────────────────────────────────────────────
const startServer = async (): Promise<void> => {
  // Connect to MongoDB Atlas before accepting incoming requests
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📍 API Health: http://localhost:${PORT}/api/health`);
    console.log(`📍 DB Health:  http://localhost:${PORT}/api/health/db`);
  });
};

startServer();

export default app;
