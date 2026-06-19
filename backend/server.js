// ─── Load env vars FIRST (must precede all other imports that read process.env)
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";

// Route imports
import doctorRoutes      from "./routes/doctorRoutes.js";
import patientRoutes     from "./routes/patientRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import uploadRoutes      from "./routes/uploadRoutes.js";
import chatRoutes        from "./routes/chatRoutes.js";

// Error handling middleware
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

// ─── Custom NoSQL sanitizer ──────────────────────────────────────────────────
// Compatible with Express 5 (req.query is a getter-only property in Express 5).
// Strips MongoDB operators ($, .) from req.body only.
const sanitizeBody = (obj) => {
  if (!obj || typeof obj !== "object") return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete obj[key];
    } else if (typeof obj[key] === "object" && !Array.isArray(obj[key])) {
      sanitizeBody(obj[key]);
    }
  }
};
const mongoSanitize = (req, _res, next) => {
  sanitizeBody(req.body);
  next();
};

// ─── Validate required environment variables ──────────────────────────────────
const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET"];
REQUIRED_ENV.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

// Warn about optional env vars (but never crash for these)
const OPTIONAL_ENV = {
  GOOGLE_CLIENT_ID: "Google OAuth sign-in will be disabled",
  GEMINI_API_KEY:   "AI Chatbot will use keyword-based fallback responses",
  CLIENT_URL:       "CORS will only allow localhost in development",
};
Object.entries(OPTIONAL_ENV).forEach(([key, note]) => {
  if (!process.env[key]) {
    console.warn(`⚠️  ${key} not set — ${note}`);
  }
});

// Security: warn if JWT secret looks like a placeholder
const WEAK_SECRETS = ["your_secret_key", "your_strong_random_secret", "secret", "password", "changeme"];
if (WEAK_SECRETS.some((w) => process.env.JWT_SECRET?.toLowerCase().includes(w))) {
  console.warn("⚠️  WARNING: JWT_SECRET appears to be a weak placeholder. Replace it with a strong random secret.");
}

// ─── Connect to MongoDB ───────────────────────────────────────────────────────
connectDB();

// ─── Express app ─────────────────────────────────────────────────────────────
const app = express();

// Trust first proxy hop — required on Render / any reverse-proxy host.
// Fixes ERR_ERL_UNEXPECTED_X_FORWARDED_FOR from express-rate-limit.
app.set("trust proxy", 1);

// ─── Security: Helmet (HTTP headers) ─────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // allow cross-origin images
    contentSecurityPolicy: false, // handled by frontend separately
  })
);

// ─── Compression ─────────────────────────────────────────────────────────────
// Gzip all responses >1KB — significantly reduces bandwidth on Render free tier
app.use(compression());

// ─── CORS ─────────────────────────────────────────────────────────────────────
// CLIENT_URL is the canonical env var for production frontend URL (Vercel URL)
// FRONTEND_URL is also accepted as an alias for backward compatibility
const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL;

const allowedOrigins = [
  "http://localhost:5173", // Vite dev server
  "http://localhost:4173", // Vite preview
  clientUrl,              // Production frontend (set in Render env vars)
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no Origin header: Postman, curl, server-to-server
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // In development, also allow any localhost origin
      if (process.env.NODE_ENV !== "production" && origin.startsWith("http://localhost")) {
        return callback(null, true);
      }
      // Block unknown origins
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
// 500 KB limit supports chat message payloads with conversation history
app.use(express.json({ limit: "500kb" }));
app.use(express.urlencoded({ extended: true, limit: "500kb" }));

// ─── NoSQL Injection Prevention ───────────────────────────────────────────────
app.use(mongoSanitize);

// ─── Rate Limiting ────────────────────────────────────────────────────────────
// Key generator: use real IP (works behind Render's proxy with trust proxy: 1)
const keyGenerator = (req) => {
  return req.ip || req.connection.remoteAddress || "unknown";
};

// General API limiter — 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: { success: false, message: "Too many requests, please try again in 15 minutes." },
  skip: () => process.env.NODE_ENV === "test",
});

// Strict auth limiter — prevents brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: { success: false, message: "Too many login attempts, please try again in 15 minutes." },
  skip: () => process.env.NODE_ENV === "test",
});

// Chat-specific limiter — 20 AI requests per minute per IP (protects Gemini API costs)
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: { success: false, message: "Too many messages, please wait a moment before sending more." },
  skip: () => process.env.NODE_ENV === "test",
});

// Apply limiters
app.use("/api", apiLimiter);
app.use("/api/doctors/login",        authLimiter);
app.use("/api/doctors/register",     authLimiter);
app.use("/api/patients/login",       authLimiter);
app.use("/api/patients/register",    authLimiter);
app.use("/api/patients/google-auth", authLimiter);
app.use("/api/chat/message",         chatLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({
    success:     true,
    message:     "Prescripto API is running 🚀",
    version:     "2.0.0",
    environment: process.env.NODE_ENV || "development",
    timestamp:   new Date().toISOString(),
    features: {
      googleOAuth: !!process.env.GOOGLE_CLIENT_ID,
      aiChatbot:   !!process.env.GEMINI_API_KEY,
    },
    endpoints: {
      patients: [
        "POST /api/patients/register",
        "POST /api/patients/login",
        "POST /api/patients/google-auth",
        "GET  /api/patients/profile     [auth]",
        "PUT  /api/patients/profile     [auth]",
      ],
      doctors: [
        "POST /api/doctors/register",
        "POST /api/doctors/login",
        "GET  /api/doctors",
        "GET  /api/doctors/:id",
        "GET  /api/doctors/profile      [auth]",
        "PUT  /api/doctors/profile      [auth]",
        "PUT  /api/doctors/availability [auth]",
      ],
      appointments: [
        "POST /api/appointments/book        [patient]",
        "GET  /api/appointments/my          [patient]",
        "GET  /api/appointments/doctor      [doctor]",
        "PUT  /api/appointments/complete/:id [doctor]",
        "PUT  /api/appointments/cancel/:id   [auth]",
      ],
      chat: [
        "POST   /api/chat/message        [auth]",
        "GET    /api/chat/history        [auth]",
        "GET    /api/chat/:sessionId     [auth]",
        "DELETE /api/chat/:sessionId     [auth]",
        "DELETE /api/chat/history/all   [auth]",
      ],
    },
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/doctors",      doctorRoutes);
app.use("/api/patients",     patientRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/upload",       uploadRoutes);
app.use("/api/chat",         chatRoutes);

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
  console.log(`🌐 Health check: http://localhost:${PORT}/`);
  console.log(`🔑 Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? "✅ Enabled" : "⚠️  Disabled (set GOOGLE_CLIENT_ID)"}`);
  console.log(`🤖 AI Chatbot:   ${process.env.GEMINI_API_KEY   ? "✅ Enabled" : "⚠️  Fallback mode (set GEMINI_API_KEY)"}`);
  if (clientUrl) console.log(`🔗 CORS allow:   ${clientUrl}`);
});

// ─── Graceful process error handlers ─────────────────────────────────────────
process.on("unhandledRejection", (reason) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  console.error("❌ Unhandled Rejection:", msg);
  // Transient MongoDB/network errors — log but don't crash (db.js retries)
  if (msg.includes("buffering timed out") || msg.includes("ECONNRESET") || msg.includes("ENOTFOUND")) {
    console.warn("⚠️  Transient network error — server continues.");
    return;
  }
  server.close(() => process.exit(1));
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err.message);
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received — graceful shutdown");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});
