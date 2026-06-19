/**
 * @fileoverview Patient Model
 * Extended from base schema to support:
 *  - Standard email/password authentication
 *  - Google OAuth 2.0 (googleId, googlePicture)
 *
 * Backward compatibility: password is now optional (null for OAuth-only accounts).
 * phone is also optional for OAuth users who haven't completed their profile yet.
 */

import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },

    /**
     * Null for Google OAuth users who haven't set a password.
     * Required validation is skipped by making it not required.
     */
    password: { type: String, default: null },

    /** Optional until profile completion for OAuth users */
    phone:    { type: String, default: "" },

    gender:   { type: String, enum: ["Male", "Female", "Other"], default: "Other" },
    dob:      { type: Date },
    address: {
      line1: { type: String, default: "" },
      line2: { type: String, default: "" },
    },

    /** Cloudinary URL or "default.jpg" */
    image: { type: String, default: "default.jpg" },

    // ── Google OAuth fields ───────────────────────────────────────────────────

    /**
     * Google's unique user ID ("sub" claim from the ID token).
     * Sparse index allows multiple null values while enforcing uniqueness for set values.
     */
    googleId: {
      type: String,
      default: null,
      sparse: true,
    },

    /**
     * Profile picture URL from Google.
     * Used as fallback when the patient hasn't uploaded a custom image.
     */
    googlePicture: {
      type: String,
      default: null,
    },

    /**
     * Authentication method — helps track how the account was created.
     * "local" = email/password | "google" = Google OAuth | "both" = linked both
     */
    authProvider: {
      type: String,
      enum: ["local", "google", "both"],
      default: "local",
    },
  },
  { timestamps: true }
);

/* ── Indexes ─────────────────────────────────────────────────────────────── */
patientSchema.index({ googleId: 1 }, { sparse: true });

const patientModel =
  mongoose.models.patient || mongoose.model("patient", patientSchema);

export default patientModel;