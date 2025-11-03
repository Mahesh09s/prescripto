import bcrypt from "bcrypt";
import doctorModel from "../models/doctorModel.js";
import generateToken from "../utils/generateToken.js";
import appointmentModel from "../models/appointmentModel.js";

/* Register Doctor */
export const registerDoctor = async (req, res) => {
  try {
    const { name, email, password, speciality ,address} = req.body;
    if (!name || !email || !password || !speciality || !address)
      return res.status(400).json({ message: "Missing required fields" });

    const exists = await doctorModel.findOne({ email });
    if (exists) return res.status(400).json({ message: "Doctor already exists" });

    const hash = await bcrypt.hash(password, 10);
    const doctor = await doctorModel.create({
      name,
      email,
      password: hash,
      image:"default.jpg",
      speciality,
      degree:"MBBS",
      experience:"0 years",
      about:"New doctor",
      available:true,
      fees:500,
      address,
      date: new Date()
    });

    const token = generateToken({ id: doctor._id, role:"doctor" });
    res.status(201).json({ token, role:"doctor", doctor: { ...doctor.toObject(), password: undefined } });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/* Login Doctor */
export const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;
    const doctor = await doctorModel.findOne({ email });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    const match = await bcrypt.compare(password, doctor.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });
    const token = generateToken({ id: doctor._id, role:"doctor" });
    res.json({ token, role:"doctor", doctor: { ...doctor.toObject(), password: undefined } });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/* Get All Doctors (public) */
export const getDoctors = async (_req, res) => {
  const doctors = await doctorModel.find().select("-password -slots_booked");
  res.json(doctors);
};

/* Get Single Doctor */
export const getDoctor = async (req, res) => {
  const doctor = await doctorModel.findById(req.params.id).select("-password");
  if (!doctor) return res.status(404).json({ message: "Doctor not found" });
  res.json(doctor);
};

/* Update Doctor Profile (self) */
export const updateDoctorProfile = async (req, res) => {
  if (req.role !== "doctor") return res.status(403).json({ message:"Not doctor" });
  const updates = { ...req.body };
  delete updates.password; // use separate route for password change
  const updated = await doctorModel.findByIdAndUpdate(req.user._id, updates, { new:true }).select("-password");
  res.json(updated);
};

/* Toggle Availability */
export const setAvailability = async (req, res) => {
  if (req.role !== "doctor") return res.status(403).json({ message:"Not doctor" });
  const { available } = req.body;
  const updated = await doctorModel.findByIdAndUpdate(req.user._id, { available }, { new:true }).select("-password");
  res.json(updated);
};

/* Generate Available Slots for a Given Date */
export const getAvailableSlots = async (req, res) => {
  const { id } = req.params; // doctor id
  const { date } = req.query; // "YYYY-MM-DD"
  if (!date) return res.status(400).json({ message:"date query required (YYYY-MM-DD)" });

  const doctor = await doctorModel.findById(id);
  if (!doctor) return res.status(404).json({ message:"Doctor not found" });

  // Example fixed schedule: 10:00-13:00 & 14:00-17:00 every 20 minutes
  const makeSlots = (start, end, intervalMin) => {
    const slots = [];
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    let cur = sh * 60 + sm;
    const endMin = eh * 60 + em;
    while (cur + intervalMin <= endMin) {
      const next = cur + intervalMin;
      const f = (m)=>String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0");
      slots.push(`${f(cur)}-${f(next)}`);
      cur = next;
    }
    return slots;
  };

  const allSlots = [
    ...makeSlots("10:00","13:00",20),
    ...makeSlots("14:00","17:00",20)
  ];

  // Fetch already booked slots from appointments collection
  const bookedAppointments = await appointmentModel.find({ doctor:id, date, status:"booked" }).select("slot");
  const bookedSet = new Set(bookedAppointments.map(a=>a.slot));
  const availableSlots = allSlots.filter(s => !bookedSet.has(s));

  res.json({ date, slots: availableSlots });
};