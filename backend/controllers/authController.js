import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import doctorModel from "../models/doctorModel.js";

export const registerDoctor = async (req, res) => {
  try {
    const { name, email, password, speciality } = req.body;
    const existingDoctor = await doctorModel.findOne({ email });
    if (existingDoctor) return res.status(400).json({ message: "Doctor already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const doctor = new doctorModel({
      name,
      email,
      password: hashedPassword,
      image: "default.jpg",
      speciality,
      degree: "MBBS",
      experience: "0 years",
      about: "New doctor",
      available: true,
      fees: 0,
      address: { street: "", city: "", state: "", pincode: "" },
      date: new Date()
    });

    await doctor.save();
    res.status(201).json({ message: "Doctor registered successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;
    const doctor = await doctorModel.findOne({ email });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, doctor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};