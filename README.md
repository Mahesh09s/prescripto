# 🏥 Prescripto — Doctor Appointment Booking System v2

A full-stack healthcare platform built with the MERN stack, featuring Google OAuth 2.0 authentication and a Gemini-powered AI medical chatbot.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)](https://mongodb.com)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

---

## ✨ Features

### Core (v1 — Preserved)
- 👤 **Patient Registration & Login** (email/password)
- 🩺 **Doctor Registration & Login**
- 📅 **Appointment Booking** with slot selection
- 💳 **Payment Page** integration
- 👨‍⚕️ **Doctor Dashboard** — appointments, availability toggle
- 🔒 **JWT Authentication** — protected routes
- ☁️ **Cloudinary** image uploads

### New in v2
- 🔐 **Google OAuth 2.0** — "Continue with Google" for patients
  - Auto-registers new users from Google
  - Links existing accounts seamlessly
  - Generates JWT after OAuth — works with all existing flows
- 🤖 **AI Medical Chatbot** — powered by Google Gemini
  - Floating bottom-right chat button
  - Symptom → specialty detection (30+ symptoms mapped)
  - Live doctor recommendations from MongoDB
  - Markdown rendering with code blocks
  - Typing animation
  - Multi-turn conversation with context
  - Persistent chat history in MongoDB
  - Collapsible history sidebar
  - Mobile responsive
  - Works without Gemini API key (fallback mode)

---

## 🗂️ Project Structure

```
Prescripto3/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/
│   │   ├── patientController.js  # + googleAuthPatient (NEW)
│   │   ├── doctorController.js
│   │   ├── appointmentController.js
│   │   └── chatController.js     # NEW — AI chat CRUD
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT protect()
│   │   └── errorMiddleware.js
│   ├── models/
│   │   ├── patientModel.js       # + googleId, googlePicture (UPDATED)
│   │   ├── doctorModel.js
│   │   ├── appointmentModel.js
│   │   └── chatModel.js          # NEW — chat sessions
│   ├── routes/
│   │   ├── patientRoutes.js      # + /google-auth (UPDATED)
│   │   ├── doctorRoutes.js
│   │   ├── appointmentRoutes.js
│   │   ├── uploadRoutes.js
│   │   └── chatRoutes.js         # NEW — AI chat endpoints
│   ├── services/
│   │   └── aiService.js          # NEW — Gemini wrapper + doctor recommendations
│   ├── utils/
│   │   ├── generateToken.js
│   │   └── cloudinaryUpload.js
│   ├── server.js                 # UPDATED — chat routes, rate limits
│   ├── .env                      # Local secrets (git-ignored)
│   └── .env.example              # Template (committed)
│
└── frontend/
    ├── src/
    │   ├── Components/
    │   │   ├── ChatBot/           # NEW — AI chatbot components
    │   │   │   ├── index.jsx      # Barrel export
    │   │   │   ├── ChatWindow.jsx # Main chat UI
    │   │   │   ├── Message.jsx    # Message bubble + markdown
    │   │   │   ├── TypingAnimation.jsx
    │   │   │   ├── InputBox.jsx   # Auto-resize input
    │   │   │   └── FloatingButton.jsx
    │   │   ├── Navbar.jsx
    │   │   └── ...
    │   ├── Context/
    │   │   ├── AppContext.jsx     # Auth + doctors state
    │   │   └── ChatContext.jsx    # NEW — chat state management
    │   ├── Pages/
    │   │   ├── Login.jsx          # UPDATED — Google sign-in button
    │   │   └── ...
    │   ├── App.jsx                # UPDATED — ChatBot + ChatProvider
    │   └── main.jsx               # UPDATED — GoogleOAuthProvider
    ├── .env
    └── .env.example
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Git

### 1. Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd Prescripto3

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

**Backend (`backend/.env`):**

```env
PORT=5000
NODE_ENV=development

MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/prescripto

JWT_SECRET=your_super_long_random_secret_here

FRONTEND_URL=http://localhost:5173

# Cloudinary (for image uploads)
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_SECRET_KEY=your_secret

# Google OAuth (optional — enables "Continue with Google")
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret

# Gemini AI (optional — enables AI chatbot)
GEMINI_API_KEY=your_gemini_api_key
```

**Frontend (`frontend/.env`):**

```env
# In development: leave blank (Vite proxy handles /api → localhost:5000)
# In production: set to your Render backend URL
VITE_API_URL=

# Required for Google OAuth button
VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
```

### 3. Run Development Servers

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Visit: `http://localhost:5173`

---

## 🔑 Setting Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → **APIs & Services** → **Credentials**
3. Click **Create Credentials** → **OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Add Authorized JavaScript origins:
   - `http://localhost:5173` (development)
   - `https://your-app.vercel.app` (production)
6. Add Authorized redirect URIs:
   - `http://localhost:5000` (not strictly required for token-based flow)
7. Copy the **Client ID** to both:
   - `backend/.env` → `GOOGLE_CLIENT_ID`
   - `frontend/.env` → `VITE_GOOGLE_CLIENT_ID`

---

## 🤖 Setting Up Gemini AI Chatbot

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **Create API Key**
3. Copy to `backend/.env` → `GEMINI_API_KEY`

> **Free Tier**: Gemini 1.5 Flash offers generous free-tier limits (60 requests/minute).

> **Without API Key**: The chatbot still works with rule-based symptom matching and doctor recommendations. Only the natural language AI response requires the API key.

---

## 🌐 API Endpoints

### Patients
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/patients/register` | Public | Register with email/password |
| POST | `/api/patients/login` | Public | Login with email/password |
| POST | `/api/patients/google-auth` | Public | Google OAuth sign-in/register |
| GET | `/api/patients/profile` | Patient | Get own profile |
| PUT | `/api/patients/profile` | Patient | Update profile |

### Doctors
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/doctors/register` | Public | Register |
| POST | `/api/doctors/login` | Public | Login |
| GET | `/api/doctors` | Public | List all available doctors |
| GET | `/api/doctors/:id` | Public | Get doctor details |
| GET | `/api/doctors/:id/slots` | Public | Get available time slots |
| GET/PUT | `/api/doctors/profile` | Doctor | Self profile |
| PUT | `/api/doctors/availability` | Doctor | Toggle availability |

### Appointments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/appointments/book` | Patient | Book appointment |
| GET | `/api/appointments/my` | Patient | My appointments |
| GET | `/api/appointments/doctor` | Doctor | Doctor's appointments |
| PUT | `/api/appointments/complete/:id` | Doctor | Mark complete |
| PUT | `/api/appointments/cancel/:id` | Patient/Doctor | Cancel |

### AI Chat
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/chat/message` | Patient/Doctor | Send message, get AI reply |
| GET | `/api/chat/history` | Patient/Doctor | List all sessions |
| GET | `/api/chat/:sessionId` | Patient/Doctor | Get session messages |
| DELETE | `/api/chat/:sessionId` | Patient/Doctor | Delete session |
| DELETE | `/api/chat/history/all` | Patient/Doctor | Clear all history |

---

## 🚢 Deployment

### Backend on Render

1. Connect your GitHub repo to Render
2. Create a new **Web Service** → select `backend` directory
3. Build command: `npm install`
4. Start command: `npm start`
5. Set all environment variables from `backend/.env.example`

### Frontend on Vercel

1. Connect repo to Vercel
2. Set root directory to `frontend`
3. Add environment variables:
   - `VITE_API_URL` → your Render backend URL + `/api`
   - `VITE_GOOGLE_CLIENT_ID` → your Google OAuth client ID
4. Deploy

---

## 🔒 Security

- **JWT** — 7-day expiry, HS256 signing
- **bcrypt** — password hashing (12 rounds)
- **Helmet** — secure HTTP headers
- **CORS** — allowlist-based (dev + production URLs)
- **Rate limiting** — API (100/15min), auth (10/15min), chat (20/1min)
- **NoSQL injection** — custom sanitizer strips `$` and `.` from req.body
- **Input validation** — all endpoints validate required fields
- **Environment variables** — no secrets in source code
- **Google token verification** — server-side verification via `google-auth-library`

---

## 🏗️ Architecture — AI Chat Flow

```
User types message
      ↓
POST /api/chat/message (JWT protected)
      ↓
chatController.sendMessage()
      ↓
aiService.generateAIResponse()
  ├── detectSpecialty() — keyword matching
  ├── getDoctorsBySpecialty() — MongoDB query
  └── Gemini API (gemini-1.5-flash)
        └── buildSystemPrompt() — live doctor context injected
      ↓
Save to MongoDB (chatModel)
      ↓
Return { reply, suggestedDoctors, detectedSpecialty, sessionId }
      ↓
Frontend renders markdown + doctor cards
```

---

## 🏗️ Architecture — Google OAuth Flow

```
User clicks "Continue with Google"
      ↓
Google Identity Services popup
      ↓
Returns { credential: ID_TOKEN }
      ↓
POST /api/patients/google-auth { credential }
      ↓
google-auth-library.verifyIdToken()
      ↓
Extract { email, name, picture, sub (googleId) }
      ↓
findOne({ googleId }) OR findOne({ email })
  ├── Not found → create patient (authProvider: "google")
  └── Found via email → link googleId (authProvider: "both")
      ↓
generateToken({ id, role: "patient" })
      ↓
Return { token, patient, role }
      ↓
Frontend: login() → localStorage → navigate("/")
```

---

## 🧩 Extending the Platform

The architecture is designed for easy extension:

- **New AI provider**: Modify only `backend/services/aiService.js` — swap Gemini for OpenAI/Groq
- **Voice input**: Add Web Speech API in `InputBox.jsx`
- **RAG (document retrieval)**: Inject vector search results into `buildSystemPrompt()`
- **New OAuth provider**: Add handler in `patientController.js` + new route
- **Admin dashboard**: Add `adminModel`, `adminController`, `adminRoutes`
- **Push notifications**: Add FCM token to patient model

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, Tailwind CSS 3 |
| Routing | React Router v7 |
| HTTP | Axios |
| AI | Google Gemini 1.5 Flash |
| OAuth | @react-oauth/google + google-auth-library |
| Markdown | react-markdown + remark-gfm |
| Backend | Node.js 18, Express 5 |
| Database | MongoDB Atlas + Mongoose 8 |
| Auth | JWT (jsonwebtoken) |
| Security | Helmet, express-rate-limit, bcrypt |
| Files | Cloudinary + Multer |
| Dev | Nodemon, ESLint |

---

## 📝 License

ISC © 2024 Prescripto
