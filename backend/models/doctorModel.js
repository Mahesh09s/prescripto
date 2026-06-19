import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true, trim: true },
    email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:   { type: String, required: true },
    image:      { type: String, default: "default.jpg" },
    speciality: { type: String, required: true },
    // Not required — defaults prevent validation errors when these aren't supplied at registration
    degree:     { type: String, default: "MBBS" },
    experience: { type: String, default: "0 Years" },
    about:      { type: String, default: "Profile not yet set up." },
    available:  { type: Boolean, default: true },
    fees:       { type: Number, default: 500 },
    address: {
      street:  { type: String, default: "" },
      city:    { type: String, default: "" },
      state:   { type: String, default: "" },
      pincode: { type: String, default: "" },
    },
    date:         { type: Date, default: Date.now },
    // Map: date string → array of booked slot strings
    slots_booked: { type: Map, of: [String], default: {} },
  },
  { minimize: false, timestamps: true }
);

const doctorModel =
  mongoose.models.doctor || mongoose.model("doctor", doctorSchema);

export default doctorModel;