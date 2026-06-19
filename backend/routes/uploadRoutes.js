import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { upload, uploadImageHandler } from "../utils/cloudinaryUpload.js";

const router = express.Router();

/**
 * POST /api/upload/image
 * Auth required (doctor or patient).
 * Body: multipart/form-data with field "image" (max 5 MB).
 * Returns: { success: true, url: "https://res.cloudinary.com/..." }
 */
router.post("/image", protect(["doctor", "patient"]), upload.single("image"), uploadImageHandler);

export default router;
