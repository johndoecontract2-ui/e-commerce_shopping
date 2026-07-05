import dotenv from "dotenv";
dotenv.config();

/**
 * Central config. Everything sensitive is read from the environment.
 * We fail fast in production if a required secret is missing, but fall
 * back to safe development defaults so the app is runnable out of the box.
 */
const isProd = process.env.NODE_ENV === "production";

function required(name, devFallback) {
  const value = process.env[name];
  if (value && value.trim() !== "") return value;
  if (isProd) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return devFallback;
}

export const config = {
  isProd,
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",

  mongoUri: required("MONGO_URI", "mongodb://127.0.0.1:27017/shopcart"),

  jwtSecret: required(
    "JWT_SECRET",
    // Dev-only ephemeral secret — never used in production because required() throws there.
    "dev_only_insecure_secret_change_me"
  ),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  cookieName: process.env.COOKIE_NAME || "shopcart_token",

  bcryptRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || "12", 10),
  maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || "5", 10),
  lockMinutes: parseInt(process.env.LOCK_MINUTES || "15", 10),

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
  },
};
