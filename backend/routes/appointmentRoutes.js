import express from "express";
import {
  bookAppointment,
  getMyAppointments,
  getDoctorAppointments,
  cancelAppointment,
  completeAppointment
} from "../controllers/appointmentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Patient
router.post("/book", protect(["patient"]), bookAppointment);
router.get("/my", protect(["patient"]), getMyAppointments);

// Doctor
router.get("/doctor", protect(["doctor"]), getDoctorAppointments);
router.put("/complete/:id", protect(["doctor"]), completeAppointment);

// Both doctor/patient can cancel (authorization inside controller)
router.put("/cancel/:id", protect(["doctor","patient"]), cancelAppointment);

export default router;