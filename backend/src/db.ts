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

export const connectDB = async (): Promise<void> => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI || mongoURI.trim() === "") {
    console.error("❌ MONGODB_URI is not defined in environment variables (.env).");
    console.error("👉 Please set MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net in backend/.env");
    return;
  }

  try {
    await mongoose.connect(mongoURI, {
      dbName: "cyberguard",
      serverSelectionTimeoutMS: 8000,
    });
    console.log("✅ MongoDB Atlas connected successfully (database: cyberguard).");
  } catch (error) {
    console.error("❌ MongoDB Atlas connection error:", error instanceof Error ? error.message : error);
  }
};
