import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";

/* Book Appointment (patient only) */
export const bookAppointment = async (req, res) => {
  try {
    if (req.role !== "patient")
      return res.status(403).json({ message:"Only patients can book" });

    const { doctorId, date, slot, reason } = req.body;
    if (!doctorId || !date || !slot)
      return res.status(400).json({ message:"doctorId, date, slot required" });

    const doctor = await doctorModel.findById(doctorId);
    if (!doctor) return res.status(404).json({ message:"Doctor not found" });
    if (!doctor.available) return res.status(400).json({ message:"Doctor not available" });

    // Create appointment (index will prevent duplicates)
    const appointment = await appointmentModel.create({
      doctor: doctorId,
      patient: req.user._id,
      date,
      slot,
      reason,
      fees: doctor.fees
    });

    // (Optional) also update doctor.slots_booked map
    if (doctor.slots_booked) {
      const current = doctor.slots_booked.get(date) || [];
      current.push(slot);
      doctor.slots_booked.set(date, current);
      await doctor.save();
    }

    res.status(201).json({ message:"Booked", appointment });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ message:"Slot already booked" });
    }
    res.status(500).json({ message:e.message });
  }
};

/* List Patient Appointments */
export const getMyAppointments = async (req, res) => {
  if (req.role !== "patient") return res.status(403).json({ message:"Not patient" });
  const appts = await appointmentModel.find({ patient:req.user._id }).populate("doctor","name speciality");
  res.json(appts);
};

/* List Doctor Appointments */
export const getDoctorAppointments = async (req, res) => {
  if (req.role !== "doctor") return res.status(403).json({ message:"Not doctor" });
  const appts = await appointmentModel.find({ doctor:req.user._id }).populate("patient","name phone");
  res.json(appts);
};

/* Cancel Appointment (patient or doctor) */
export const cancelAppointment = async (req, res) => {
  const { id } = req.params;
  const appt = await appointmentModel.findById(id);
  if (!appt) return res.status(404).json({ message:"Not found" });

  // Authorization
  if (req.role === "patient" && String(appt.patient) !== String(req.user._id))
    return res.status(403).json({ message:"Not your appointment" });
  if (req.role === "doctor" && String(appt.doctor) !== String(req.user._id))
    return res.status(403).json({ message:"Not your appointment" });

  if (appt.status !== "booked")
    return res.status(400).json({ message:`Cannot cancel status=${appt.status} `});

  appt.status = "cancelled";
  await appt.save();

  // (Optional) remove slot from doctor.slots_booked map
  const doctor = await doctorModel.findById(appt.doctor);
  if (doctor.slots_booked && doctor.slots_booked.get(appt.date)) {
    const arr = doctor.slots_booked.get(appt.date).filter(s=>s!==appt.slot);
    doctor.slots_booked.set(appt.date, arr);
    await doctor.save();
  }

  res.json({ message:"Cancelled", appointment: appt });
};

/* Mark Completed (doctor only) */
export const completeAppointment = async (req, res) => {
  const { id } = req.params;
  if (req.role !== "doctor") return res.status(403).json({ message:"Not doctor" });
  const appt = await appointmentModel.findById(id);
  if (!appt) return res.status(404).json({ message:"Not found" });
  if (String(appt.doctor) !== String(req.user._id))
    return res.status(403).json({ message:"Not your appointment" });
  if (appt.status !== "booked")
    return res.status(400).json({ message:`Cannot complete status=${appt.status} `});
  appt.status = "completed";
  await appt.save();
  res.json({ message:"Completed", appointment: appt });
};