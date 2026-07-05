import mongoose from "mongoose";
import { config } from "./env.js";

mongoose.set("strictQuery", true);

/**
 * Connect to MongoDB. Accepts an optional URI override (used by the
 * in-memory test harness). Retries are left to the caller / process manager.
 */
export async function connectDB(uriOverride) {
  const uri = uriOverride || config.mongoUri;
  const conn = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000,
  });
  console.log(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
