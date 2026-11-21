# CareerFlow — Placement Preparation & AI Mock Chamber

CareerFlow is an intelligent campus-to-offer platform featuring an interactive Resume Builder, ATS Diagnostic Scanner, and an **AI Voice Mock Chamber** powered by Gemini AI and conversational speech synthesis.

---

## 🎙️ AI Voice Mock Chamber

The AI Voice Mock Chamber replicates high-stakes campus placement and technical interviews with responsive AI video avatars, synchronized Web Speech TTS, and real-time voice speech-to-text recognition.

### Key Capabilities
- **Avatar Selection**: Choose between Female Interviewer (*Aria Chen*) and Male Interviewer (*Marcus Vance*).
- **Video Sync**: Realistic video loop plays while the interviewer is speaking; pauses in idle state when the candidate responds.
- **Adaptive Question Generation**: Tailored questions based on role (Full-Stack, Backend, Frontend, DevOps, Data Science), experience tier, and tech stack.
- **Real-Time Voice Answer Capture**: Web Speech Recognition with real-time transcript preview, auto-silence detection, and manual typing fallback.
- **3-Pillar Evaluation**: Assesses every response across **Confidence**, **Communication**, and **Technical Correctness**.
- **Placement Readiness Report**: Generates overall placement readiness score, actionable strengths, improvement areas, and question-by-question breakdown with print/PDF support.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Lucide Icons, Web Speech API (`SpeechSynthesis` & `webkitSpeechRecognition`).
- **Backend**: Node.js, Express, TypeScript, MongoDB (Mongoose), `@google/genai` (Gemini 2.5 Flash).
- **Avatars**: Synced MP4 video assets in `client/src/assets/videos/`.

---

## 🚀 Setup & Installation

### 1. Backend (`/server`)
```bash
cd server
npm install
npm run build
npm run dev
```

#### Environment Variables (`server/.env`)
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/careerflow
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key  # Optional: Fallback intelligence activates if not set
```

### 2. Frontend (`/client`)
```bash
cd client
npm install
npm run build
npm run dev
```
Runs at `http://localhost:5173`.

---

## 🔌 API Endpoints (`/api/mock-interview`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/mock-interview/start` | Generates 5 adaptive questions and creates an interview session |
| `POST` | `/api/mock-interview/answer` | Evaluates a candidate's voice/text answer on 3 pillars |
| `POST` | `/api/mock-interview/finish` | Calculates aggregate metrics, strengths, and summary feedback |
| `GET` | `/api/mock-interview/report/:id` | Retrieves comprehensive scorecard for an interview session |
| `GET` | `/api/mock-interview/my-interviews` | Retrieves candidate's past interview history |

---

## 🖥️ Frontend Routes

- `/mock-chamber`: Setup & interviewer avatar selection landing page.
- `/mock-chamber/room`: Live interactive voice interview chamber with video avatar.
- `/mock-chamber/report/:id`: Final performance evaluation & PDF export.
