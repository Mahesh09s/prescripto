/**
 * @fileoverview Chat Controller
 * Handles AI chatbot sessions: send messages, retrieve history, manage sessions.
 * Works for both patients and doctors (role-agnostic).
 */

import chatModel from "../models/chatModel.js";
import { generateAIResponse } from "../services/aiService.js";
import mongoose from "mongoose";

/* ── Helper: truncate session title from first user message ─────────────── */
const makeTitleFromMessage = (text) =>
  text.length > 60 ? text.substring(0, 57) + "..." : text;

/* ── Helper: validate MongoDB ObjectId ─────────────────────────────────── */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * POST /api/chat/message
 * Sends a user message and returns the AI reply.
 * Creates a new session if sessionId is not provided.
 * Requires authentication (patient or doctor).
 */
export const sendMessage = async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Message cannot be empty" });
    }

    if (message.trim().length > 2000) {
      return res.status(400).json({ success: false, message: "Message too long (max 2000 characters)" });
    }

    const userId = req.user._id;
    const userRole = req.role || "patient"; // fallback for safety

    let session;

    // ── Find existing session or create new one ───────────────────────────
    if (sessionId && isValidObjectId(sessionId)) {
      session = await chatModel.findOne({
        _id: sessionId,
        userId,
        isDeleted: false,
      });
      if (!session) {
        return res.status(404).json({ success: false, message: "Chat session not found" });
      }
    } else {
      // Create a new session; title will be set from first message
      session = await chatModel.create({
        userId,
        userRole,
        title: makeTitleFromMessage(message.trim()),
        messages: [],
      });
    }

    // ── Append user message to session ────────────────────────────────────
    const userMsg = {
      role: "user",
      content: message.trim(),
      timestamp: new Date(),
    };
    session.messages.push(userMsg);

    // ── Build conversation history for multi-turn context ─────────────────
    // Pass all prior messages (excluding the one we just pushed) for context
    const historyForAI = session.messages
      .slice(0, -1) // exclude the just-added user message
      .map((m) => ({ role: m.role, content: m.content }));

    // ── Call AI service ───────────────────────────────────────────────────
    const { reply, suggestedDoctors, detectedSpecialty } =
      await generateAIResponse(message.trim(), historyForAI);

    // ── Append AI reply to session ────────────────────────────────────────
    const assistantMsg = {
      role: "assistant",
      content: reply,
      suggestedDoctorIds: suggestedDoctors.map((d) => d._id),
      timestamp: new Date(),
    };
    session.messages.push(assistantMsg);

    // ── Update title if this was the first message ────────────────────────
    if (session.messages.length === 2) {
      session.title = makeTitleFromMessage(message.trim());
    }

    await session.save();

    res.json({
      success: true,
      sessionId: session._id,
      reply,
      suggestedDoctors,
      detectedSpecialty,
      messageCount: session.messages.length,
    });
  } catch (err) {
    console.error("[chatController] sendMessage error:", err.message);
    res.status(500).json({ success: false, message: "Server error processing message" });
  }
};

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * GET /api/chat/history
 * Returns all non-deleted chat sessions for the logged-in user.
 * Each session includes metadata (title, messageCount, updatedAt) but NOT full messages.
 */
export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const sessions = await chatModel
      .find({ userId, isDeleted: false })
      .select("title messageCount createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    // Attach message count (virtual doesn't serialize in lean, compute manually)
    const sessionsWithCount = sessions.map((s) => ({
      ...s,
      // messageCount is a virtual — fallback to 0 if not available in lean
      messageCount: s.messageCount ?? 0,
    }));

    res.json({ success: true, sessions: sessionsWithCount });
  } catch (err) {
    console.error("[chatController] getChatHistory error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * GET /api/chat/:sessionId
 * Returns all messages in a specific chat session.
 * Also populates suggestedDoctors for each message.
 */
export const getChatSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!isValidObjectId(sessionId)) {
      return res.status(400).json({ success: false, message: "Invalid session ID" });
    }

    const session = await chatModel
      .findOne({ _id: sessionId, userId: req.user._id, isDeleted: false })
      .populate({
        path: "messages.suggestedDoctorIds",
        select: "name speciality image fees experience _id",
        model: "doctor",
      });

    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    res.json({ success: true, session });
  } catch (err) {
    console.error("[chatController] getChatSession error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * DELETE /api/chat/:sessionId
 * Soft-deletes a chat session (sets isDeleted = true).
 * Only the session owner can delete.
 */
export const deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!isValidObjectId(sessionId)) {
      return res.status(400).json({ success: false, message: "Invalid session ID" });
    }

    const session = await chatModel.findOne({
      _id: sessionId,
      userId: req.user._id,
      isDeleted: false,
    });

    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    session.isDeleted = true;
    await session.save();

    res.json({ success: true, message: "Chat session deleted" });
  } catch (err) {
    console.error("[chatController] deleteSession error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * DELETE /api/chat/history/all
 * Soft-deletes ALL chat sessions for the logged-in user.
 */
export const clearAllHistory = async (req, res) => {
  try {
    await chatModel.updateMany(
      { userId: req.user._id, isDeleted: false },
      { isDeleted: true }
    );
    res.json({ success: true, message: "All chat history cleared" });
  } catch (err) {
    console.error("[chatController] clearAllHistory error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
