import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { env } from "./src/config/env.js";
import { errorHandler } from "./src/middleware/errorHandler.js";
import { requestId } from "./src/middleware/requestId.js";
import routes from "./src/routes/index.js";
import { logger } from "./src/utils/logger.js";
import { requestLogger } from "./src/middleware/requestLogger.js";

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.supabase.co", "https://*.razorpay.com"],
      frameSrc: ["'self'", "https://www.youtube.com"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));
app.use(cors({
  origin: env.NODE_ENV === "production" ? "https://ibisphysics.com" : "http://localhost:3002",
  credentials: true
}));
app.use(compression());
// Fix 1: Raw body parser for webhook HMAC validation MUST precede global JSON parser
app.use("/api/webhooks/razorpay", express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(requestId);

app.use(requestLogger);

// API Routes
app.use("/api", routes);

// Global Error Handler (must be last)
app.use(errorHandler);

// Start Server
const server = app.listen(env.PORT, (err) => {
  if (err) {
    logger.error(`❌ Failed to start server: ${err.message}`);
    process.exit(1);
  }
  logger.info(`🚀 Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

// Graceful Shutdown
const shutdown = () => {
  logger.info("SIGTERM/SIGINT received. Shutting down gracefully...");
  server.close(() => {
    logger.info("HTTP server closed.");
    // In a real app, close Redis and Database connections here if they are stateful
    process.exit(0);
  });
  
  // Force exit if taking too long
  setTimeout(() => {
    logger.error("Forcing shutdown due to timeout.");
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

process.on('uncaughtException', (err) => console.error("UNCAUGHT EXCEPTION:", err));
process.on('unhandledRejection', (err) => console.error("UNHANDLED REJECTION:", err));
