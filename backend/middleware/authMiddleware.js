import jwt from "jsonwebtoken";
import doctorModel from "../models/doctorModel.js";
import patientModel from "../models/patientModel.js";

export const protect = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer "))
        return res.status(401).json({ message: "No token provided" });

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // decoded: { id, role }
      let user;
      if (decoded.role === "doctor") user = await doctorModel.findById(decoded.id).select("-password");
      else if (decoded.role === "patient") user = await patientModel.findById(decoded.id).select("-password");

      if (!user) return res.status(401).json({ message: "Invalid token user" });

      req.user = user;
      req.role = decoded.role;

      if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ message: "Not authorized for this resource" });
      }

      next();
    } catch (err) {
      return res.status(401).json({ message: err.message || "Token failed" });
    }
  };
};