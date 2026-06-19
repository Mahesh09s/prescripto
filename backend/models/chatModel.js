/**
 * @fileoverview Chat History Model
 * Stores AI chatbot conversations per user (patient or doctor).
 * Each document represents one chat session containing multiple messages.
 */

import mongoose from "mongoose";

/* ── Message sub-document schema ─────────────────────────────────────────── */
const messageSchema = new mongoose.Schema(
  {
    /** "user" | "assistant" — mirrors the Gemini roles */
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    /** Raw text content of the message */
    content: {
      type: String,
      required: true,
      maxlength: 10000,
    },
    /**
     * Optional array of doctor IDs suggested in this message.
     * Populated on read via a separate query to avoid deeply nested refs.
     */
    suggestedDoctorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "doctor" }],
    /** Timestamp of this individual message */
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
);

/* ── Chat session schema ──────────────────────────────────────────────────── */
const chatSchema = new mongoose.Schema(
  {
    /** References patient or doctor — supports both roles */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    /** "patient" | "doctor" — determines which collection to look up for userId */
    userRole: {
      type: String,
      enum: ["patient", "doctor"],
      required: true,
    },
    /** Auto-generated session title (first user message, truncated) */
    title: {
      type: String,
      default: "New Chat",
      maxlength: 100,
    },
    /** Ordered array of all messages in this session */
    messages: [messageSchema],
    /** Soft-delete flag — sessions are never hard-deleted by default */
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true } // adds createdAt & updatedAt
);

/* ── Compound index for efficient per-user history queries ───────────────── */
chatSchema.index({ userId: 1, createdAt: -1 });

/* ── Virtual: message count helper ──────────────────────────────────────── */
chatSchema.virtual("messageCount").get(function () {
  return this.messages.length;
});

const chatModel = mongoose.models.chat || mongoose.model("chat", chatSchema);

export default chatModel;
