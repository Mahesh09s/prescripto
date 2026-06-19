/**
 * @fileoverview Patient Controller
 * Handles patient registration, login, profile management, and Google OAuth.
 */

import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import patientModel from "../models/patientModel.js";
import generateToken from "../utils/generateToken.js";

/* ── Google OAuth client (lazy init — only needed when GOOGLE_CLIENT_ID is set) ── */
/* NOTE: We verify ID tokens only — GOOGLE_CLIENT_SECRET is NOT required.        */
let googleClient = null;
const getGoogleClient = () => {
  if (!googleClient && process.env.GOOGLE_CLIENT_ID) {
    googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }
  return googleClient;
};

/* ─── Register Patient ─────────────────────────────────────────────────────── */
export const registerPatient = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const exists = await patientModel.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const hash = await bcrypt.hash(password, 12);
    const patient = await patientModel.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hash,
      phone,
      authProvider: "local",
    });

    const token = generateToken({ id: patient._id, role: "patient" });
    const patientData = patient.toObject();
    delete patientData.password;

    res.status(201).json({ success: true, token, role: "patient", patient: patientData });
  } catch (e) {
    console.error("registerPatient error:", e.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─── Login Patient ────────────────────────────────────────────────────────── */
export const loginPatient = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const patient = await patientModel.findOne({ email: email.toLowerCase() });
    if (!patient) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Prevent login with password for OAuth-only accounts
    if (!patient.password) {
      return res.status(400).json({
        success: false,
        message: "This account uses Google Sign-In. Please use 'Continue with Google'.",
      });
    }

    const match = await bcrypt.compare(password, patient.password);
    if (!match) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken({ id: patient._id, role: "patient" });
    const patientData = patient.toObject();
    delete patientData.password;

    res.json({ success: true, token, role: "patient", patient: patientData });
  } catch (e) {
    console.error("loginPatient error:", e.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─── Google OAuth — Patient ───────────────────────────────────────────────── */
/**
 * POST /api/patients/google-auth
 * Verifies a Google ID token and logs in or auto-registers the patient.
 *
 * Flow:
 *  1. Receive { credential } — the ID token from @react-oauth/google
 *  2. Verify with google-auth-library
 *  3. Extract name, email, picture, sub (googleId)
 *  4. Find patient by googleId OR email
 *  5. If not found → auto-register (authProvider: "google")
 *  6. If found via email (local account) → link googleId (authProvider: "both")
 *  7. Return JWT + patient data
 */
export const googleAuthPatient = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ success: false, message: "Google credential is required" });
    }

    const client = getGoogleClient();
    if (!client) {
      return res.status(503).json({
        success: false,
        message: "Google OAuth is not configured on this server. Contact support.",
      });
    }

    // ── Verify ID token with Google ───────────────────────────────────────
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      console.error("Google token verification failed:", verifyErr.message);
      return res.status(401).json({ success: false, message: "Invalid Google token" });
    }

    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ success: false, message: "Google account has no email" });
    }

    // ── Find or create patient ────────────────────────────────────────────
    let patient = await patientModel.findOne({
      $or: [{ googleId }, { email: email.toLowerCase() }],
    });

    if (!patient) {
      // Auto-register new Google user
      patient = await patientModel.create({
        name: name || email.split("@")[0],
        email: email.toLowerCase(),
        googleId,
        googlePicture: picture || null,
        image: picture || "default.jpg",
        authProvider: "google",
        phone: "", // Will be completed in profile
      });
    } else {
      // Link Google ID to existing local account if not already linked
      let changed = false;
      if (!patient.googleId) {
        patient.googleId = googleId;
        patient.authProvider = patient.password ? "both" : "google";
        changed = true;
      }
      if (!patient.googlePicture && picture) {
        patient.googlePicture = picture;
        changed = true;
      }
      // Use Google picture as profile image if patient has default
      if (patient.image === "default.jpg" && picture) {
        patient.image = picture;
        changed = true;
      }
      if (changed) await patient.save();
    }

    const token = generateToken({ id: patient._id, role: "patient" });
    const patientData = patient.toObject();
    delete patientData.password;

    res.json({ success: true, token, role: "patient", patient: patientData });
  } catch (e) {
    console.error("googleAuthPatient error:", e.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─── Get Patient Profile ──────────────────────────────────────────────────── */
export const getPatientProfile = async (req, res) => {
  try {
    if (req.role !== "patient") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    res.json({ success: true, patient: req.user });
  } catch (e) {
    console.error("getPatientProfile error:", e.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─── Update Patient Profile ───────────────────────────────────────────────── */
export const updatePatientProfile = async (req, res) => {
  try {
    if (req.role !== "patient") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const allowedFields = ["name", "phone", "gender", "dob", "address", "image"];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const updated = await patientModel
      .findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
      .select("-password");

    res.json({ success: true, patient: updated });
  } catch (e) {
    console.error("updatePatientProfile error:", e.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};