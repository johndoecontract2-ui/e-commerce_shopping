import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";

import { config } from "./config/env.js";
import { notFound, errorHandler } from "./middleware/index.js";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  // Secure HTTP headers (OWASP A05). CSP is set with sensible defaults;
  // tighten `scriptSrc` per your CDN/analytics domains in production.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          connectSrc: ["'self'"],
        },
      },
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  // CORS restricted to the trusted frontend origin, with credentials for cookies.
  app.use(
    cors({
      origin: config.clientOrigin,
      credentials: true,
    })
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Strip keys containing $ or . to defeat NoSQL operator injection (OWASP A03).
  app.use(mongoSanitize());

  if (config.env !== "test") {
    app.use(morgan("dev"));
  }

  // Global, lenient rate limit (per-route limits are stricter).
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 200,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.get("/api/health", (_req, res) =>
    res.json({ status: "ok", env: config.env, time: new Date().toISOString() })
  );

  app.use("/api/auth", authRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/orders", orderRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
