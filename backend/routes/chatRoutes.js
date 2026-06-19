/**
 * @fileoverview Chat Routes
 * All routes require authentication (patient or doctor).
 * Rate limiting is inherited from the global /api limiter in server.js.
 */

import express from "express";
import {
  sendMessage,
  getChatHistory,
  getChatSession,
  deleteSession,
  clearAllHistory,
} from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All chat routes require a valid JWT (patient or doctor)
router.use(protect(["patient", "doctor"]));

// ── Session management ────────────────────────────────────────────────────────

/** POST  /api/chat/message          — Send a message (creates or continues session) */
router.post("/message", sendMessage);

/** GET   /api/chat/history          — List all sessions (metadata only) */
router.get("/history", getChatHistory);

/** DELETE /api/chat/history/all     — Clear all sessions for this user */
router.delete("/history/all", clearAllHistory);

/** GET   /api/chat/:sessionId       — Get full message list for one session */
router.get("/:sessionId", getChatSession);

/** DELETE /api/chat/:sessionId      — Soft-delete one session */
router.delete("/:sessionId", deleteSession);

export default router;
