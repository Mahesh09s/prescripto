import express from "express";
import {
  registerDoctor,
  loginDoctor,
  getDoctorProfile,
  getDoctors,
  getDoctor,
  updateDoctorProfile,
  setAvailability,
  getAvailableSlots,
} from "../controllers/doctorController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ── Specific named routes FIRST (before /:id wildcards) ───────────────────────

// Public auth
router.post("/register", registerDoctor);
router.post("/login",    loginDoctor);

// Protected doctor-self routes (must be before /:id to avoid "profile" matching as ObjectId)
router.get("/profile",      protect(["doctor"]), getDoctorProfile);    // GET  /api/doctors/profile
router.put("/profile",      protect(["doctor"]), updateDoctorProfile); // PUT  /api/doctors/profile
router.put("/availability", protect(["doctor"]), setAvailability);     // PUT  /api/doctors/availability

// ── Wildcard param routes LAST ─────────────────────────────────────────────────
router.get("/",             getDoctors);         // GET /api/doctors
router.get("/:id",          getDoctor);          // GET /api/doctors/:id
router.get("/:id/slots",    getAvailableSlots);  // GET /api/doctors/:id/slots?date=YYYY-MM-DD

export default router;