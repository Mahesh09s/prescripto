import bcrypt from "bcrypt";
import patientModel from "../models/patientModel.js";
import generateToken from "../utils/generateToken.js";

export const registerPatient = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password || !phone)
      return res.status(400).json({ message:"Missing required fields" });
    const exists = await patientModel.findOne({ email });
    if (exists) return res.status(400).json({ message:"Patient already exists" });
    const hash = await bcrypt.hash(password, 10);
    const patient = await patientModel.create({ name, email, password:hash, phone });
    const token = generateToken({ id: patient._id, role:"patient" });
    res.status(201).json({ token, role:"patient", patient: { ...patient.toObject(), password:undefined }});
  } catch (e) {
    res.status(500).json({ message:e.message });
  }
};

export const loginPatient = async (req, res) => {
  try {
    const { email, password } = req.body;
    const patient = await patientModel.findOne({ email });
    if (!patient) return res.status(404).json({ message:"Patient not found" });
    const match = await bcrypt.compare(password, patient.password);
    if (!match) return res.status(400).json({ message:"Invalid credentials" });
    const token = generateToken({ id: patient._id, role:"patient" });
    res.json({ token, role:"patient", patient: { ...patient.toObject(), password:undefined }});
  } catch (e) {
    res.status(500).json({ message:e.message });
  }
};

export const getPatientProfile = async (req, res) => {
  if (req.role !== "patient") return res.status(403).json({ message:"Not patient" });
  res.json(req.user);
};

export const updatePatientProfile = async (req, res) => {
  if (req.role !== "patient") return res.status(403).json({ message:"Not patient" });
  const updates = { ...req.body };
  delete updates.password;
  const updated = await patientModel.findByIdAndUpdate(req.user._id, updates, { new:true }).select("-password");
  res.json(updated);
};