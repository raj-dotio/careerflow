# CareerFlow — Campus Placement Preparation & Career Simulation Platform

CareerFlow is an intelligent, unified campus-to-offer platform featuring an **AI-Guided Reactive Resume Builder**, **ATS Diagnostic Scanner**, **AI Mock Chamber** with live Gemini TTS and video avatars, **Personalized Learning Roadmaps**, **Daily Goals & 26-Week Heatmap**, **Skill Verification with GitHub Audits**, and **Adaptive Quick Challenges**.

---

## 📚 Complete Platform Documentation

For in-depth documentation, guides, and API contracts, refer to the `docs/` directory:
- 📖 [**CareerFlow Overview & Features Guide**](docs/CAREERFLOW_OVERVIEW.md): Comprehensive walkthrough of every module, user journey, architecture, and design philosophy.
- ⚡ [**CareerFlow API Catalog**](docs/API_CATALOG.md): Complete, compact API reference covering all 48 endpoints across 10 functional modules.

---

## 🌟 Core Modules

### 1. 📄 AI-Guided Reactive Resume Builder (`/builder`)
- **Conversational AI Guide:** Step-by-step coaching (`Basics ➔ Experience ➔ Education ➔ Skills ➔ Projects ➔ Honors ➔ Theme`).
- **Rough/Hinglish to ATS:** Converts informal shorthand into polished, active bullet points without fabricating numbers or metrics.
- **Live A4 Preview:** Real-time updates with highlight animations, empty section skeletons, and click-to-jump.
- **Voice Input:** Web Speech API integration for speaking answers.
- **Export Options:** Clean A4 PDF export (print-optimized) and JSON import/export.

### 2. 🎯 ATS Diagnostic Scanner (`/ats`)
- **Multi-Pillar Scoring:** Keyword match rate, quantifiable impact, structure & readability.
- **Bullet Redlines:** Detects weak phrasing and recommends high-signal STAR replacements.
- **Job Description Alignment:** Match your resume against any target tech job description.

### 3. 🎙️ AI Voice Mock Chamber (`/mock-chamber`)
- **Interviewer Personas:** Priya (Principal Systems Architect) & Rahul (Director of Engineering).
- **Gemini TTS & Video Sync:** High-fidelity speech synthesis with synchronized responsive video avatars.
- **Dynamic 5-Round Question Plan:** Role-driven or resume-driven personalized interview rounds.
- **Placement Diagnostic Report:** 3-pillar evaluation across Confidence, Communication, and Technical Correctness.

### 4. 📅 Daily Goals & Streak Analytics (`/goals`, `/dashboard`)
- **Habit Formation:** Track daily DSA, system design, mock tests, and revision targets.
- **26-Week Heatmap:** Visual GitHub-style contribution activity calendar.
- **Streak Tracking:** Current streaks, all-time best streaks, and weekly completion metrics.

### 5. 🗺️ Personalized AI Learning Roadmap (`/roadmap`)
- **Custom Curriculum:** AI-generated multi-week syllabus matched to dream role, academic year, and weekly hours.
- **Topic Mastery:** Confidence tracking, personal markdown notes, and auto-synced study streaks.
- **Smart Recommendations:** Real-time AI recommendations for tutorials, problem sets, and guides.

### 6. 🛡️ Skill Tracker & GitHub Proof Verification (`/skills`)
- **Skill Matrix:** Track competencies across Frontend, Backend, Programming, DSA, Database, and DevOps.
- **GitHub AST Audit:** Paste repository URLs for automated Gemini AI code analysis and verified skill badges.

### 7. ⚡ Adaptive AI Quick Challenges (`/challenge/setup`, `/challenge/:id`)
- **Rapid Micro-Challenges:** Fast technical screening rounds (3 to 25 questions).
- **Adaptive Difficulty:** Dynamically scales difficulty up or down based on response quality.
- **Comprehensive Scorecards:** Instant performance feedback with key strengths and improvement areas.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite 8, Tailwind CSS v4, Lucide React, React Router v7, Web Speech API.
- **Backend:** Node.js, Express v5, TypeScript, MongoDB / Mongoose v9, JWT (httpOnly cookie auth).
- **AI & Speech:** Google GenAI SDK (`@google/genai` v3.6.0) using Gemini 3.5 Flash Lite, Gemini 3.1 Flash Lite, and Gemini TTS.

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
GEMINI_API_KEY=your_gemini_api_key
GEMINI_TEXT_MODEL=gemini-3.5-flash-lite
GEMINI_TEXT_FALLBACK_MODEL=gemini-3.1-flash-lite
GEMINI_TTS_MODEL=gemini-3.8-flash-tts
GEMINI_TTS_FALLBACK_MODEL=gemini-3.1-flash-tts-preview
```

### 2. Frontend (`/client`)
```bash
cd client
npm install
npm run build
npm run dev
```
Client runs at `http://localhost:5173`.
