import bcrypt from "bcrypt";
import doctorModel from "../models/doctorModel.js";
import generateToken from "../utils/generateToken.js";
import appointmentModel from "../models/appointmentModel.js";

/* ─── Register Doctor ──────────────────────────────────────────────────────── */
export const registerDoctor = async (req, res) => {
  try {
    const { name, email, password, speciality, address } = req.body;

    if (!name || !email || !password || !speciality) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const exists = await doctorModel.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const hash = await bcrypt.hash(password, 12);
    const doctor = await doctorModel.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hash,
      speciality,
      address: address || {},
      date: new Date(),
    });

    const token = generateToken({ id: doctor._id, role: "doctor" });
    const doctorData = doctor.toObject();
    delete doctorData.password;

    res.status(201).json({ success: true, token, role: "doctor", doctor: doctorData });
  } catch (e) {
    console.error("registerDoctor error:", e.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─── Login Doctor ─────────────────────────────────────────────────────────── */
export const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const doctor = await doctorModel.findOne({ email: email.toLowerCase() });
    if (!doctor) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, doctor.password);
    if (!match) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken({ id: doctor._id, role: "doctor" });
    const doctorData = doctor.toObject();
    delete doctorData.password;

    res.json({ success: true, token, role: "doctor", doctor: doctorData });
  } catch (e) {
    console.error("loginDoctor error:", e.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─── Get Doctor Profile (self) ────────────────────────────────────────────── */
export const getDoctorProfile = async (req, res) => {
  try {
    if (req.role !== "doctor") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    res.json({ success: true, doctor: req.user });
  } catch (e) {
    console.error("getDoctorProfile error:", e.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─── Get All Doctors (public) ─────────────────────────────────────────────── */
export const getDoctors = async (_req, res) => {
  try {
    const doctors = await doctorModel.find({ available: true }).select("-password -slots_booked");
    res.json({ success: true, doctors });
  } catch (e) {
    console.error("getDoctors error:", e.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─── Get Single Doctor ────────────────────────────────────────────────────── */
export const getDoctor = async (req, res) => {
  try {
    const doctor = await doctorModel.findById(req.params.id).select("-password");
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    res.json({ success: true, doctor });
  } catch (e) {
    if (e.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid doctor ID format" });
    }
    console.error("getDoctor error:", e.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─── Update Doctor Profile (self) ────────────────────────────────────────── */
export const updateDoctorProfile = async (req, res) => {
  try {
    if (req.role !== "doctor") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const allowedFields = ["name", "phone", "about", "available", "fees", "address", "image", "experience", "degree", "speciality"];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const updated = await doctorModel
      .findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
      .select("-password");

    res.json({ success: true, doctor: updated });
  } catch (e) {
    console.error("updateDoctorProfile error:", e.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─── Toggle Availability ──────────────────────────────────────────────────── */
export const setAvailability = async (req, res) => {
  try {
    if (req.role !== "doctor") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const { available } = req.body;
    if (typeof available !== "boolean") {
      return res.status(400).json({ success: false, message: "available must be boolean" });
    }

    const updated = await doctorModel
      .findByIdAndUpdate(req.user._id, { available }, { new: true })
      .select("-password");

    res.json({ success: true, doctor: updated });
  } catch (e) {
    console.error("setAvailability error:", e.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─── Generate Available Slots ─────────────────────────────────────────────── */
export const getAvailableSlots = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: "date query required (YYYY-MM-DD)" });
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, message: "date must be YYYY-MM-DD" });
    }

    const doctor = await doctorModel.findById(id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    if (!doctor.available) {
      return res.json({ success: true, date, slots: [] });
    }

    // Build 20-minute slots: 10:00–13:00 and 14:00–17:00
    const makeSlots = (start, end, intervalMin) => {
      const slots = [];
      const [sh, sm] = start.split(":").map(Number);
      const [eh, em] = end.split(":").map(Number);
      let cur = sh * 60 + sm;
      const endMin = eh * 60 + em;
      const f = (m) =>
        String(Math.floor(m / 60)).padStart(2, "0") +
        ":" +
        String(m % 60).padStart(2, "0");
      while (cur + intervalMin <= endMin) {
        const next = cur + intervalMin;
        slots.push(`${f(cur)}-${f(next)}`);
        cur = next;
      }
      return slots;
    };

    const allSlots = [
      ...makeSlots("10:00", "13:00", 20),
      ...makeSlots("14:00", "17:00", 20),
    ];

    const booked = await appointmentModel
      .find({ doctor: id, date, status: "booked" })
      .select("slot");
    const bookedSet = new Set(booked.map((a) => a.slot));
    const availableSlots = allSlots.filter((s) => !bookedSet.has(s));

    res.json({ success: true, date, slots: availableSlots });
  } catch (e) {
    if (e.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid doctor ID format" });
    }
    console.error("getAvailableSlots error:", e.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};