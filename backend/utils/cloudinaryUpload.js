import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

/**
 * Cloudinary upload helper.
 *
 * Configuration is lazy — only called if all three env vars are present.
 * If they are not set, every upload request returns a 503 with a clear message.
 */

let configured = false;

const ensureConfigured = () => {
  if (!configured) {
    const { CLOUDINARY_NAME, CLOUDINARY_API_KEY, CLOUDINARY_SECRET_KEY } = process.env;
    if (!CLOUDINARY_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_SECRET_KEY) {
      return false;
    }
    cloudinary.config({
      cloud_name: CLOUDINARY_NAME,
      api_key:    CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_SECRET_KEY,
      secure:     true,
    });
    configured = true;
  }
  return true;
};

// Use memory storage so we can pipe the buffer directly to Cloudinary
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

/**
 * Upload a file buffer to Cloudinary and return the secure URL.
 * @param {Buffer} buffer
 * @param {string} folder  — Cloudinary folder, e.g. "prescripto/doctors"
 * @returns {Promise<string>}  secure_url
 */
export const uploadToCloudinary = (buffer, folder = "prescripto") =>
  new Promise((resolve, reject) => {
    if (!ensureConfigured()) {
      return reject(new Error("Cloudinary is not configured — set CLOUDINARY_NAME, CLOUDINARY_API_KEY, CLOUDINARY_SECRET_KEY"));
    }

    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });

/**
 * Express route handler — POST /api/upload/image
 * Requires auth (patient or doctor). Returns { success, url }.
 */
export const uploadImageHandler = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No image file provided" });
  }
  try {
    const folder = req.role === "doctor" ? "prescripto/doctors" : "prescripto/patients";
    const url = await uploadToCloudinary(req.file.buffer, folder);
    res.json({ success: true, url });
  } catch (err) {
    console.error("uploadImageHandler error:", err.message);
    if (err.message.includes("not configured")) {
      return res.status(503).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: "Image upload failed" });
  }
};
