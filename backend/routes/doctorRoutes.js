import express from "express";
import {
  registerDoctor,
  loginDoctor,
  getDoctors,
  getDoctor,
  updateDoctorProfile,
  setAvailability,
  getAvailableSlots
} from "../controllers/doctorController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerDoctor);
router.post("/login", loginDoctor);

router.get("/", getDoctors);
router.get("/:id", getDoctor);
router.get("/:id/slots", getAvailableSlots);          // /api/doctors/:id/slots?date=YYYY-MM-DD

router.put("/profile", protect(["doctor"]), updateDoctorProfile);
router.put("/availability", protect(["doctor"]), setAvailability);

export default router;