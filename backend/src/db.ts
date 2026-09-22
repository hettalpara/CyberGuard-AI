import mongoose from "mongoose";
import dns from "node:dns";

// Fix for Node.js SRV record lookup issues on Windows / local ISP resolvers
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore if running in environments where setServers is restricted
}

export const isDBConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

// Cache the connection promise to avoid duplicate connections in serverless
let connectionPromise: Promise<void> | null = null;

export const connectDB = async (): Promise<void> => {
  // Already connected — nothing to do
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // Connection in progress — wait for it
  if (connectionPromise) {
    return connectionPromise;
  }

  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI || mongoURI.trim() === "") {
    console.error("❌ MONGODB_URI is not defined in environment variables (.env).");
    console.error("👉 Please set MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net in backend/.env");
    return;
  }

  connectionPromise = mongoose
    .connect(mongoURI, {
      dbName: "cyberguard",
      serverSelectionTimeoutMS: 8000,
    })
    .then(() => {
      console.log("✅ MongoDB Atlas connected successfully (database: cyberguard).");
    })
    .catch((error) => {
      connectionPromise = null; // Reset so next request can retry
      console.error("❌ MongoDB Atlas connection error:", error instanceof Error ? error.message : error);
    });

  return connectionPromise;
};

