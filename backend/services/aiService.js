/**
 * @fileoverview AI Service — Gemini-powered medical assistant
 *
 * Architecture is provider-agnostic: the exported `generateAIResponse` function
 * abstracts over the AI SDK so a different provider (OpenAI, Anthropic, Groq, …)
 * can be swapped in by changing only this file.
 *
 * Features:
 *  • Symptom → specialty mapping with doctor recommendations
 *  • System prompt injection with live doctor roster from MongoDB
 *  • Conversation history passed to Gemini for multi-turn context
 *  • Graceful degradation if GEMINI_API_KEY is absent (returns static reply)
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import doctorModel from "../models/doctorModel.js";

// ── Symptom → Specialty mapping ───────────────────────────────────────────────
// Extend this map to support more symptoms without touching the controller.
const SYMPTOM_MAP = {
  // Dermatology
  "skin allergy": "Dermatologist",
  "rash": "Dermatologist",
  "acne": "Dermatologist",
  "eczema": "Dermatologist",
  "psoriasis": "Dermatologist",
  "itching": "Dermatologist",
  "hives": "Dermatologist",

  // Cardiology
  "chest pain": "Cardiologist",
  "heart palpitation": "Cardiologist",
  "high blood pressure": "Cardiologist",
  "hypertension": "Cardiologist",
  "shortness of breath": "Cardiologist",

  // Neurology
  "headache": "Neurologist",
  "migraine": "Neurologist",
  "seizure": "Neurologist",
  "dizziness": "Neurologist",
  "numbness": "Neurologist",
  "memory loss": "Neurologist",

  // Gastroenterology
  "stomach pain": "Gastroenterologist",
  "abdominal pain": "Gastroenterologist",
  "diarrhea": "Gastroenterologist",
  "constipation": "Gastroenterologist",
  "acid reflux": "Gastroenterologist",
  "nausea": "Gastroenterologist",
  "vomiting": "Gastroenterologist",
  "bloating": "Gastroenterologist",

  // Orthopedics
  "joint pain": "Orthopedic Surgeon",
  "back pain": "Orthopedic Surgeon",
  "knee pain": "Orthopedic Surgeon",
  "fracture": "Orthopedic Surgeon",
  "bone pain": "Orthopedic Surgeon",

  // Pediatrics
  "child fever": "Pediatrician",
  "child cough": "Pediatrician",
  "vaccination": "Pediatrician",

  // ENT
  "ear pain": "ENT Specialist",
  "sore throat": "ENT Specialist",
  "runny nose": "ENT Specialist",
  "hearing loss": "ENT Specialist",
  "sinusitis": "ENT Specialist",

  // Ophthalmology
  "eye pain": "Ophthalmologist",
  "blurred vision": "Ophthalmologist",
  "eye infection": "Ophthalmologist",

  // Psychiatry
  "anxiety": "Psychiatrist",
  "depression": "Psychiatrist",
  "stress": "Psychiatrist",
  "insomnia": "Psychiatrist",
  "mental health": "Psychiatrist",

  // Gynecology
  "menstrual": "Gynecologist",
  "pregnancy": "Gynecologist",
  "pelvic pain": "Gynecologist",

  // General
  "fever": "General physician",
  "cold": "General physician",
  "cough": "General physician",
  "fatigue": "General physician",
  "weakness": "General physician",
  "diabetes": "General physician",
  "thyroid": "General physician",
};

// ── System prompt factory ─────────────────────────────────────────────────────
/**
 * Builds the Gemini system prompt with live doctor context injected.
 * @param {Array} doctors - Available doctors from MongoDB
 * @returns {string} System prompt string
 */
const buildSystemPrompt = (doctors) => {
  const doctorList = doctors
    .slice(0, 20) // Limit context size
    .map(
      (d) =>
        `• Dr. ${d.name} — ${d.speciality} | Fees: ₹${d.fees} | ${d.experience} experience`
    )
    .join("\n");

  return `You are MediBot, an intelligent medical assistant for Prescripto — a doctor appointment booking platform in India.

## Your Role
- Help users understand their symptoms and recommend the right medical specialist
- Provide general health guidance (not a substitute for professional medical advice)
- Assist with appointment booking and platform navigation
- Answer questions about medicines, procedures, and medical specialties
- Be empathetic, professional, and clear

## Available Doctors on Prescripto
${doctorList || "No doctors currently listed."}

## Guidelines
1. When a user describes symptoms, ALWAYS recommend the appropriate specialist first
2. Then suggest 2-3 specific available doctors from the list above if they match
3. Use simple, non-technical language
4. Always add a disclaimer for serious symptoms: "Please seek emergency care immediately"
5. Never diagnose. Always encourage professional consultation.
6. For appointment booking, guide users to the doctor's profile page
7. Respond in the same language as the user (default English)
8. Keep responses concise (under 300 words unless detail is explicitly requested)
9. Use markdown formatting: **bold**, bullet points, and headers where helpful
10. For medicine queries: explain purpose and common side effects, but always say "consult your doctor before taking any medication"

## Response Format for Symptom Queries
When a user mentions a symptom:
1. Brief empathetic acknowledgment
2. Recommended specialty
3. 2-3 available doctors (if applicable)
4. General care tips
5. When to seek emergency care (if relevant)

You are friendly, concise, and medically informed. Always prioritize patient safety.`;
};

// ── Specialty detector ────────────────────────────────────────────────────────
/**
 * Detects medical specialty from user message text using keyword matching.
 * @param {string} message - User's message
 * @returns {string|null} Detected specialty or null
 */
export const detectSpecialty = (message) => {
  const lower = message.toLowerCase();
  for (const [keyword, specialty] of Object.entries(SYMPTOM_MAP)) {
    if (lower.includes(keyword)) {
      return specialty;
    }
  }
  return null;
};

// ── Doctor recommender ────────────────────────────────────────────────────────
/**
 * Fetches doctors matching a specialty from MongoDB.
 * Returns up to 3 available doctors.
 * @param {string} specialty - Medical specialty string
 * @returns {Promise<Array>} Array of doctor objects
 */
export const getDoctorsBySpecialty = async (specialty) => {
  if (!specialty) return [];
  try {
    const doctors = await doctorModel
      .find({ speciality: specialty, available: true })
      .select("name speciality image fees experience _id")
      .limit(3)
      .lean();
    return doctors;
  } catch (err) {
    console.error("[aiService] getDoctorsBySpecialty error:", err.message);
    return [];
  }
};

// ── Main AI response generator ────────────────────────────────────────────────
/**
 * Generates an AI response using Google Gemini.
 * Falls back to a static response if GEMINI_API_KEY is not configured.
 *
 * @param {string} userMessage - The user's latest message
 * @param {Array}  history     - Prior messages [{role, content}] for multi-turn context
 * @returns {Promise<{reply: string, suggestedDoctors: Array, detectedSpecialty: string|null}>}
 */
export const generateAIResponse = async (userMessage, history = []) => {
  // ── Detect specialty and fetch matching doctors regardless of AI provider ──
  const detectedSpecialty = detectSpecialty(userMessage);
  const suggestedDoctors = detectedSpecialty
    ? await getDoctorsBySpecialty(detectedSpecialty)
    : [];

  // ── Fallback if API key missing ───────────────────────────────────────────
  if (!process.env.GEMINI_API_KEY) {
    console.warn("[aiService] GEMINI_API_KEY not set — using static fallback response");
    const fallback = detectedSpecialty
      ? `I understand you're experiencing symptoms related to **${detectedSpecialty}**. I recommend consulting a ${detectedSpecialty}. ${
          suggestedDoctors.length > 0
            ? "Here are some available doctors on Prescripto:"
            : "Please use the Doctors page to find an available specialist."
        }`
      : "I'm your medical assistant. Please describe your symptoms and I'll help you find the right specialist. (Note: AI features require GEMINI_API_KEY configuration.)";
    return { reply: fallback, suggestedDoctors, detectedSpecialty };
  }

  try {
    // ── Fetch all available doctors for system context ─────────────────────
    const allDoctors = await doctorModel
      .find({ available: true })
      .select("name speciality fees experience")
      .limit(30)
      .lean();

    // ── Initialize Gemini client ───────────────────────────────────────────
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: buildSystemPrompt(allDoctors),
    });

    // ── Build conversation history for multi-turn context ─────────────────
    // Gemini expects: [{role: "user"|"model", parts: [{text}]}]
    const geminiHistory = history
      .slice(-10) // Keep last 10 messages to stay within token limits
      .map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

    // ── Start chat session with history ───────────────────────────────────
    const chat = model.startChat({ history: geminiHistory });

    // ── Send message and get response ─────────────────────────────────────
    const result = await chat.sendMessage(userMessage);
    const reply = result.response.text();

    return { reply, suggestedDoctors, detectedSpecialty };
  } catch (err) {
    console.error("[aiService] Gemini API error:", err.message);

    // Graceful degradation — return helpful message instead of crashing
    const fallback = `I apologize, I'm having trouble connecting to my AI brain right now. ${
      detectedSpecialty
        ? `Based on your symptoms, I'd suggest consulting a **${detectedSpecialty}**.`
        : "Please describe your symptoms or browse our doctors directory."
    }`;
    return { reply: fallback, suggestedDoctors, detectedSpecialty };
  }
};
