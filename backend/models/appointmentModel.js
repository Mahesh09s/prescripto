import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "doctor", required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "patient", required: true },
  date: { type: String, required: true },   // store as "YYYY-MM-DD"
  slot: { type: String, required: true },   // e.g. "10:00-10:20"
  status: { type: String, enum:["booked","cancelled","completed"], default:"booked" },
  reason: { type: String }, // optional reason symptom summary
  fees: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

appointmentSchema.index({ doctor:1, date:1, slot:1 }, { unique: true }); // prevents duplicate bookings

const appointmentModel = mongoose.models.appointment || mongoose.model("appointment", appointmentSchema);
export default appointmentModel;