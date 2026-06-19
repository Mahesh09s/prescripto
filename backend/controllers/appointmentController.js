import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";

/* ─── Book Appointment (patient only) ─────────────────────────────────────── */
export const bookAppointment = async (req, res) => {
  try {
    if (req.role !== "patient") {
      return res.status(403).json({ success: false, message: "Only patients can book" });
    }

    const { doctorId, date, slot, reason } = req.body;

    if (!doctorId || !date || !slot) {
      return res.status(400).json({ success: false, message: "doctorId, date, and slot are required" });
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, message: "date must be YYYY-MM-DD" });
    }

    const doctor = await doctorModel.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    if (!doctor.available) {
      return res.status(400).json({ success: false, message: "Doctor is not available" });
    }

    // Check if this slot is already booked (application-level — cancelled slots may be rebooked)
    const existing = await appointmentModel.findOne({
      doctor: doctorId,
      date,
      slot,
      status: 'booked',
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'This slot is already booked' });
    }

    const appointment = await appointmentModel.create({
      doctor: doctorId,
      patient: req.user._id,
      date,
      slot,
      reason: reason || '',
      fees: doctor.fees,
    });

    // Update doctor's slots_booked map
    const current = doctor.slots_booked.get(date) || [];
    current.push(slot);
    doctor.slots_booked.set(date, current);
    await doctor.save();

    res.status(201).json({ success: true, message: "Appointment booked", appointment });
  } catch (e) {
    console.error('bookAppointment error:', e.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ─── List Patient's Own Appointments ─────────────────────────────────────── */
export const getMyAppointments = async (req, res) => {
  try {
    if (req.role !== "patient") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const appointments = await appointmentModel
      .find({ patient: req.user._id })
      .populate("doctor", "name speciality image fees")
      .sort({ createdAt: -1 });

    res.json({ success: true, appointments });
  } catch (e) {
    console.error("getMyAppointments error:", e.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─── List Doctor's Appointments ───────────────────────────────────────────── */
export const getDoctorAppointments = async (req, res) => {
  try {
    if (req.role !== "doctor") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const appointments = await appointmentModel
      .find({ doctor: req.user._id })
      .populate("patient", "name phone email")
      .sort({ createdAt: -1 });

    res.json({ success: true, appointments });
  } catch (e) {
    console.error("getDoctorAppointments error:", e.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─── Cancel Appointment (patient or doctor) ───────────────────────────────── */
export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appt = await appointmentModel.findById(id);
    if (!appt) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    // Authorization check
    if (req.role === "patient" && String(appt.patient) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not your appointment" });
    }
    if (req.role === "doctor" && String(appt.doctor) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not your appointment" });
    }

    if (appt.status !== "booked") {
      return res.status(400).json({ success: false, message: `Cannot cancel appointment with status: ${appt.status}` });
    }

    appt.status = "cancelled";
    await appt.save();

    // Remove slot from doctor's slots_booked map
    const doctor = await doctorModel.findById(appt.doctor);
    if (doctor && doctor.slots_booked && doctor.slots_booked.get(appt.date)) {
      const arr = doctor.slots_booked.get(appt.date).filter((s) => s !== appt.slot);
      doctor.slots_booked.set(appt.date, arr);
      await doctor.save();
    }

    res.json({ success: true, message: "Appointment cancelled", appointment: appt });
  } catch (e) {
    console.error("cancelAppointment error:", e.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─── Mark Appointment as Completed (doctor only) ─────────────────────────── */
export const completeAppointment = async (req, res) => {
  try {
    if (req.role !== "doctor") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const { id } = req.params;
    const appt = await appointmentModel.findById(id);
    if (!appt) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }
    if (String(appt.doctor) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not your appointment" });
    }
    if (appt.status !== "booked") {
      return res.status(400).json({ success: false, message: `Cannot complete appointment with status: ${appt.status}` });
    }

    appt.status = "completed";
    await appt.save();

    res.json({ success: true, message: "Appointment completed", appointment: appt });
  } catch (e) {
    console.error("completeAppointment error:", e.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};