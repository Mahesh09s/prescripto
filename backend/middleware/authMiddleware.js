import jwt from "jsonwebtoken";
import doctorModel from "../models/doctorModel.js";
import patientModel from "../models/patientModel.js";

/**
 * protect(allowedRoles?)
 * Usage:
 *   protect()                 – any authenticated user
 *   protect(["doctor"])       – doctors only
 *   protect(["patient"])      – patients only
 *   protect(["doctor","patient"]) – either role
 */
export const protect = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "No token provided" });
      }

      const token = authHeader.split(" ")[1];

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({ success: false, message: "Token expired, please log in again" });
        }
        return res.status(401).json({ success: false, message: "Invalid token" });
      }

      if (!decoded.id || !decoded.role) {
        return res.status(401).json({ success: false, message: "Malformed token" });
      }

      let user;
      if (decoded.role === "doctor") {
        user = await doctorModel.findById(decoded.id).select("-password");
      } else if (decoded.role === "patient") {
        user = await patientModel.findById(decoded.id).select("-password");
      }

      if (!user) {
        return res.status(401).json({ success: false, message: "Account no longer exists" });
      }

      req.user = user;
      req.role = decoded.role;

      if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ success: false, message: "You do not have permission to access this resource" });
      }

      next();
    } catch (err) {
      console.error("authMiddleware error:", err.message);
      return res.status(500).json({ success: false, message: "Authentication error" });
    }
  };
};