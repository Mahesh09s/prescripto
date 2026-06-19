/**
 * @fileoverview Patient Routes
 * Public routes: register, login, Google OAuth
 * Protected routes: profile CRUD (patient only)
 */

import express from "express";
import {
  registerPatient,
  loginPatient,
  googleAuthPatient,
  getPatientProfile,
  updatePatientProfile,
} from "../controllers/patientController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ── Public routes ─────────────────────────────────────────────────────────────
router.post("/register",     registerPatient);
router.post("/login",        loginPatient);

/** POST /api/patients/google-auth — Google OAuth 2.0 sign-in / auto-registration */
router.post("/google-auth",  googleAuthPatient);

// ── Protected routes (patient only) ──────────────────────────────────────────
router.get("/profile",  protect(["patient"]), getPatientProfile);
router.put("/profile",  protect(["patient"]), updatePatientProfile);

export default router;