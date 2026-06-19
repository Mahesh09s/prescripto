import mongoose from "mongoose";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

const connectDB = async (attempt = 1) => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("❌ MONGO_URI is not defined in environment variables");
    process.exit(1);
  }

  // Register lifecycle events once (on first attempt only)
  if (attempt === 1) {
    mongoose.connection.on("connected", () => {
      console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
    });
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB error:", err.message);
    });
    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected");
    });
  }

  try {
    await mongoose.connect(uri, {
      // Raised from 8 s to accommodate Render cold-start + Atlas SSL handshake
      serverSelectionTimeoutMS: 15000,
      // Keep socket alive across Render's idle timeouts
      socketTimeoutMS: 45000,
      // Reconnect automatically on transient network drops
      heartbeatFrequencyMS: 10000,
    });
    // "connected" event above will log success
  } catch (error) {
    console.error(
      `❌ MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed: ${error.message}`
    );

    if (attempt < MAX_RETRIES) {
      console.log(`🔄 Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return connectDB(attempt + 1);
    }

    // All retries exhausted — log clearly but DO NOT exit.
    // The server stays alive; individual route handlers will return 503
    // because Mongoose will be in disconnected state.
    console.error(
      "❌ MongoDB: all retry attempts exhausted.\n" +
      "   Check MONGO_URI, Atlas Network Access (allow 0.0.0.0/0 for Render),\n" +
      "   and that the cluster is not paused.\n" +
      "   Server will continue running — API calls will return 503 until DB reconnects."
    );
  }
};

export default connectDB;