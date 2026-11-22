# CareerFlow API Catalog

> Compact API reference for AI coding tasks and backend integration. Inspect this catalog before scanning codebase files.
> Last Updated: 2026-11-23 (Includes Features from Main, Piyush, Ritesh, Kush, and Raj)

---

## Compact API Index

| Method | Endpoint | Purpose | Auth | Source File |
| :--- | :--- | :--- | :--- | :--- |
| **System** | | | | |
| `GET` | `/api/health` | Health check & environment operational status | None | `server/src/app.ts` |
| **Auth & Profile** | | | | |
| `POST` | `/api/auth/google` | Google OAuth login / registration & cookie token | None | `server/src/controllers/authController.ts` |
| `POST` | `/api/auth/logout` | Clear authentication token cookie | None | `server/src/controllers/authController.ts` |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Required | `server/src/controllers/userController.ts` |
| `GET` | `/api/auth/current-user` | Alias for `/api/auth/me` | Required | `server/src/controllers/userController.ts` |
| **Resume Builder** | | | | |
| `GET` | `/api/resumes` | Get all user resumes | Optional / Guest | `server/src/controllers/resumeController.ts` |
| `GET` | `/api/resumes/sample` | Get default technical starter resume template | None | `server/src/controllers/resumeController.ts` |
| `GET` | `/api/resumes/:id` | Get resume document by Mongo ID or `'sample'` | None | `server/src/controllers/resumeController.ts` |
| `POST` | `/api/resumes` | Create a new resume document | Optional / Guest | `server/src/controllers/resumeController.ts` |
| `PUT` | `/api/resumes/:id` | Update an existing resume document | Optional / Guest | `server/src/controllers/resumeController.ts` |
| `DELETE` | `/api/resumes/:id` | Delete a resume by ID | Optional / Guest | `server/src/controllers/resumeController.ts` |
| `POST` | `/api/resumes/:id/duplicate` | Duplicate an existing resume as a copy | Optional / Guest | `server/src/controllers/resumeController.ts` |
| **AI Resume Guide** | | | | |
| `POST` | `/api/resume-ai/chat` | Conversational ATS resume guide (Hinglish, patch ops) | Optional / Guest | `server/src/controllers/resumeAi.controller.ts` |
| `POST` | `/api/resume-ai/parse` | Upload resume file (PDF/DOCX/TXT) & parse into JSON | Optional / Guest | `server/src/controllers/resumeAi.controller.ts` |
| **ATS Diagnostics** | | | | |
| `POST` | `/api/ats/analyze` | Evaluate raw text or JSON resume against ATS & JD | None | `server/src/controllers/atsController.ts` |
| `POST` | `/api/ats/upload` | Upload resume file (PDF/DOCX/TXT) for ATS analysis | None | `server/src/controllers/atsController.ts` |
| **Daily Goals & Streaks (Piyush)** | | | | |
| `GET` | `/api/goals` | Fetch all user daily targets | Optional / Guest | `server/src/controllers/goalController.ts` |
| `GET` | `/api/goals/stats` | Streaks, 26-wk heatmap, weekly & per-goal analytics | Optional / Guest | `server/src/controllers/goalController.ts` |
| `POST` | `/api/goals` | Create a new daily target | Optional / Guest | `server/src/controllers/goalController.ts` |
| `PUT` | `/api/goals/:id` | Update target properties | Optional / Guest | `server/src/controllers/goalController.ts` |
| `DELETE` | `/api/goals/:id` | Delete goal and historical progress logs | Optional / Guest | `server/src/controllers/goalController.ts` |
| `POST` | `/api/goals/:id/progress` | Adjust progress delta or toggle completion | Optional / Guest | `server/src/controllers/goalController.ts` |
| **Mock Chamber (AI Interview)** | | | | |
| `POST` | `/api/mock-interview/start` | Start interview session & generate 5-round plan + Q1 | Optional / Guest | `server/src/controllers/interview.controller.ts` |
| `POST` | `/api/mock-interview/answer` | Submit answer; evaluate 3 pillars & generate next Q | Optional / Guest | `server/src/controllers/interview.controller.ts` |
| `POST` | `/api/mock-interview/next` | Skip or advance to next question | Optional / Guest | `server/src/controllers/interview.controller.ts` |
| `POST` | `/api/mock-interview/finish` | Finish session, compute final scores & diagnostic report | Optional / Guest | `server/src/controllers/interview.controller.ts` |
| `GET` | `/api/mock-interview/report/:id` | Get interview evaluation diagnostic report by ID | Optional / Guest | `server/src/controllers/interview.controller.ts` |
| `GET` | `/api/mock-interview/my-interviews` | Get list of recent interview sessions | Optional / Guest | `server/src/controllers/interview.controller.ts` |
| `POST` | `/api/mock-interview/upload-resume` | Upload candidate resume for personalized interview | Optional / Guest | `server/src/controllers/interview.controller.ts` |
| `POST` | `/api/mock-interview/tts` | Synthesize interviewer voice via Gemini TTS (Priya/Rahul) | Optional / Guest | `server/src/controllers/interview.controller.ts` |
| `POST` | `/api/mock-interview/transcribe` | Transcribe mic audio via Gemini Multimodal STT | Optional / Guest | `server/src/controllers/interview.controller.ts` |
| **Learning Roadmap (Ritesh)** | | | | |
| `GET` | `/api/roadmap` | Get active roadmap with weekly progress & stats | Optional / Guest | `server/src/controllers/roadmapController.ts` |
| `POST` | `/api/roadmap/generate` | Generate personalized multi-week curriculum with AI | Optional / Guest | `server/src/controllers/roadmapController.ts` |
| `PATCH` | `/api/roadmap/topics/:topicId` | Update topic progress, confidence score & notes | Optional / Guest | `server/src/controllers/roadmapController.ts` |
| `GET` | `/api/roadmap/recommendations` | Get smart AI study resources & recommendations | Optional / Guest | `server/src/controllers/roadmapController.ts` |
| `POST` | `/api/roadmap/recommendations/refresh` | Regenerate recommendations based on progress | Optional / Guest | `server/src/controllers/roadmapController.ts` |
| `POST` | `/api/roadmap/reset` | Archive active roadmap to allow reconfiguration | Optional / Guest | `server/src/controllers/roadmapController.ts` |
| **Skill Tracker (Kush)** | | | | |
| `GET` | `/api/skills` | List all tracked skills with proficiency & status | Optional / Guest | `server/src/controllers/skillController.ts` |
| `GET` | `/api/skills/stats` | Overall skill stats: verified count, %, category split | Optional / Guest | `server/src/controllers/skillController.ts` |
| `POST` | `/api/skills/verify-proof` | Verify GitHub repo proof via AST code audit & AI | Optional / Guest | `server/src/controllers/skillController.ts` |
| `GET` | `/api/skills/:id` | Get single skill details | Optional / Guest | `server/src/controllers/skillController.ts` |
| `POST` | `/api/skills` | Create new skill (auto-verifies if proof URL supplied) | Optional / Guest | `server/src/controllers/skillController.ts` |
| `PUT` | `/api/skills/:id` | Update skill or trigger re-verification | Optional / Guest | `server/src/controllers/skillController.ts` |
| `DELETE` | `/api/skills/:id` | Delete skill by ID | Optional / Guest | `server/src/controllers/skillController.ts` |
| **AI Quick Challenges (Kush)** | | | | |
| `POST` | `/api/challenges/start` | Start adaptive interview challenge (optional resume) | Optional / Guest | `server/src/controllers/challengeController.ts` |
| `GET` | `/api/challenges/:id` | Retrieve active challenge session state | Optional / Guest | `server/src/controllers/challengeController.ts` |
| `POST` | `/api/challenges/:id/answer` | Submit answer, evaluate & adaptively get next Q | Optional / Guest | `server/src/controllers/challengeController.ts` |
| `GET` | `/api/challenges/:id/results` | Retrieve final scorecard & question breakdown | Optional / Guest | `server/src/controllers/challengeController.ts` |

---

## 1. System Health

### `GET /api/health`
- **Purpose**: Verify backend operational status and uptime.
- **Auth**: None (Public)
- **Parameters**: None
- **Response `200 OK`**:
  ```json
  {
    "status": "success",
    "message": "CareerFlow API server is up and running!",
    "timestamp": "2026-11-21T10:00:00.000Z",
    "environment": "development"
  }
  ```
- **Source**: `server/src/app.ts`

---

## 2. Authentication & User Profile

### `POST /api/auth/google`
- **Purpose**: Authenticate user via Google login, create user if not existing, set httpOnly JWT cookie.
- **Auth**: None (Public)
- **Request Body**:
  ```json
  {
    "email": "student@college.edu",
    "name": "Student Name"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "_id": "60d0fe4f5311236168a109ca",
    "name": "Student Name",
    "email": "student@college.edu",
    "credits": 1000,
    "createdAt": "2026-11-20T12:00:00.000Z",
    "updatedAt": "2026-11-20T12:00:00.000Z"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{ "message": "Email is required" }`
  - `500 Internal Server Error`: `{ "message": "Google Auth Error : <error>" }`
- **Source**: `server/src/controllers/authController.ts` (Router: `server/src/routes/authRoute.ts`)
- **Model**: `User` in `server/src/models/user.model.ts`

### `POST /api/auth/logout`
- **Purpose**: Clear JWT authentication cookie.
- **Auth**: None (Public)
- **Response `200 OK`**: `{ "message": "Logged Out Successfully" }`
- **Source**: `server/src/controllers/authController.ts` (Router: `server/src/routes/authRoute.ts`)

### `GET /api/auth/me` & `GET /api/auth/current-user`
- **Purpose**: Retrieve currently logged-in user details.
- **Auth**: Required (`isAuth` middleware reads `req.cookies.token` or `Authorization: Bearer <token>`).
- **Response `200 OK`**: User profile object.
- **Source**: `server/src/controllers/userController.ts` (Router: `server/src/routes/authRoute.ts`)

---

## 3. Resume Builder Management

### `GET /api/resumes`
- **Purpose**: Get all resumes belonging to user (or guest).
- **Auth**: Optional / Guest (`req.userId || req.query.userId || 'guest'`).
- **Query Parameters**: `userId?: string`
- **Response `200 OK`**: `{ "success": true, "count": 1, "data": [ ... ] }`
- **Source**: `server/src/controllers/resumeController.ts` (Router: `server/src/routes/resumeRoute.ts`)
- **Model**: `Resume` in `server/src/models/resume.model.ts`

### `GET /api/resumes/sample`
- **Purpose**: Fetch standard starter engineering resume data (Sarah Lin template).
- **Auth**: None (Public)
- **Response `200 OK`**: `{ "success": true, "data": { /* ResumeData */ } }`
- **Source**: `server/src/controllers/resumeController.ts`

### `GET /api/resumes/:id`
- **Purpose**: Fetch a single resume by Mongo ID or string `'sample'`.
- **Auth**: None (Public)
- **Response `200 OK`**: `{ "success": true, "data": { /* Resume document */ } }`
- **Source**: `server/src/controllers/resumeController.ts`

### `POST /api/resumes`
- **Purpose**: Create and persist a new resume document.
- **Auth**: Optional / Guest
- **Request Body**: `ResumeData` structure
- **Response `201 Created`**: `{ "success": true, "message": "Resume created successfully", "data": { ... } }`
- **Source**: `server/src/controllers/resumeController.ts`

### `PUT /api/resumes/:id`
- **Purpose**: Update an existing resume.
- **Auth**: Optional / Guest
- **Response `200 OK`**: `{ "success": true, "message": "Resume updated successfully", "data": { ... } }`
- **Source**: `server/src/controllers/resumeController.ts`

### `DELETE /api/resumes/:id`
- **Purpose**: Delete a resume by ID.
- **Response `200 OK`**: `{ "success": true, "message": "Resume deleted successfully" }`
- **Source**: `server/src/controllers/resumeController.ts`

### `POST /api/resumes/:id/duplicate`
- **Purpose**: Duplicate an existing resume as a copy.
- **Response `201 Created`**: `{ "success": true, "message": "Resume duplicated successfully", "data": { ... } }`
- **Source**: `server/src/controllers/resumeController.ts`

---

## 4. AI Resume Guide (Conversational ATS Builder)

### `POST /api/resume-ai/chat`
- **Purpose**: Interactive conversational AI guide for building/refining ATS-friendly resumes. Accepts rough notes and Hinglish, applies strict honesty rules (no fabricated metrics), and generates structured JSON patches for live preview updates.
- **Auth**: Optional / Guest
- **Request Body**:
  ```json
  {
    "sessionId": "user-session-id",
    "userMessage": "stripe me intern tha, redis caching kiya",
    "selectedOption": "Full-Stack Engineer",
    "currentSection": "experience",
    "resume": { /* Current ResumeData JSON */ },
    "history": [ { "role": "assistant", "content": "Tell me about your work experience." } ],
    "targetJd": "Senior Backend Engineer with Go & Redis",
    "isInitial": false
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "assistant_message": "Awesome! I captured your software engineering internship at Stripe optimizing backend latency with Redis clusters.",
      "question": "Would you like to add another internship or work experience?",
      "input_type": "yes_no",
      "quick_options": ["Yes, add another", "No, move to next section"],
      "allow_custom_answer": true,
      "resume_patch": [
        {
          "op": "add",
          "path": "sections.experience",
          "value": [{
            "id": "exp-stripe",
            "company": "Stripe",
            "position": "Software Engineering Intern",
            "location": "",
            "date": "",
            "summary": "• Engineered and deployed Redis caching clusters to optimize database queries and decrease latency."
          }]
        }
      ],
      "current_section": "experience",
      "section_complete": false,
      "next_section": "education",
      "progress_percent": 30,
      "suggestions": ["Adding concrete numbers (e.g. 'reduced latency by 40%') will make this bullet even stronger if you have metrics!"]
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{ "success": false, "message": "Current resume state is required for AI guidance." }`
  - `429 Too Many Requests`: `{ "success": false, "error": "RATE_LIMITED", "message": "AI Coach rate limit reached..." }`
- **Source**: `server/src/controllers/resumeAi.controller.ts` (Service: `server/src/services/resumeAi.service.ts`)

### `POST /api/resume-ai/parse`
- **Purpose**: Upload an existing resume file (`PDF`, `DOCX`, or `TXT`), extract text, and parse it directly into structured `ResumeData` with missing section diagnosis.
- **Auth**: Optional / Guest
- **Request Format**: `multipart/form-data`
  - `resume`: File binary (`.pdf`, `.docx`, `.txt`)
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "fileName": "my_resume.pdf",
    "data": {
      "resume": { /* Parsed ResumeData */ },
      "missingSections": ["certifications", "projects"],
      "initialGreeting": "I have extracted your resume data! Let us review and boost its ATS score."
    }
  }
  ```
- **Source**: `server/src/controllers/resumeAi.controller.ts` (Router: `server/src/routes/resumeAi.routes.ts`)

---

## 5. ATS Diagnostics & Resume Checker

### `POST /api/ats/analyze`
- **Purpose**: Analyze plain text or structured JSON resume for ATS compatibility and job description matching.
- **Auth**: None (Public)
- **Request Body**:
  ```json
  {
    "resumeText": "...",
    "resumeData": { /* Optional ResumeData structure */ },
    "jobDescription": "..."
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "overallScore": 86,
      "rating": "Competitive",
      "summaryFeedback": "Strong backend project architecture with high impact verbs.",
      "scores": { "keywordMatch": 80, "quantifiableImpact": 90, "structureAndFormat": 85, "readabilityAndLength": 90 },
      "metrics": { "wordCount": 420, "bulletCount": 12, "metricBulletCount": 8, "actionVerbCount": 10, "readingTimeMinutes": 2 },
      "keywords": { "matchedKeywords": ["react", "node.js", "redis"], "missingKeywords": ["docker", "grpc"], "matchRate": 80 },
      "bulletRedlines": [ { "original": "Worked on redis cache", "suggested": "Engineered Redis caching layer slashing p99 latency by 35%", "reason": "Weak action verb and unquantified impact" } ],
      "checklist": [ { "category": "Contact Information", "item": "Professional Email Present", "passed": true } ]
    }
  }
  ```
- **Source**: `server/src/controllers/atsController.ts` (Router: `server/src/routes/atsRoute.ts`)

### `POST /api/ats/upload`
- **Purpose**: Upload document file (`PDF`, `DOCX`, or `TXT`) and execute ATS evaluation.
- **Auth**: None (Public)
- **Request Format**: `multipart/form-data` with `resume` file.
- **Response `200 OK`**: `{ "success": true, "fileName": "resume.pdf", "data": { /* AtsEvaluationResult */ } }`
- **Source**: `server/src/controllers/atsController.ts`

---

## 6. Daily Goals & Streak Analytics (Piyush)

### `GET /api/goals`
- **Purpose**: Fetch all daily targets for a user.
- **Auth**: Optional / Guest (`req.userId || req.query.userId || 'guest'`).
- **Response `200 OK`**: `{ "success": true, "goals": [ ... ], "today": "2026-11-23" }`
- **Source**: `server/src/controllers/goalController.ts` (Router: `server/src/routes/goalRoute.ts`)

### `GET /api/goals/stats`
- **Purpose**: Calculate overall current streak, all-time best streak, 26-week (182-day) GitHub contribution activity heatmap, weekly summary, and per-goal analytics.
- **Auth**: Optional / Guest
- **Response `200 OK`**: `{ "success": true, "stats": { "currentStreak": 19, "bestStreak": 28, "heatmap": [ ... ] } }`
- **Source**: `server/src/controllers/goalController.ts`

### `POST /api/goals`
- **Purpose**: Create a new daily target.
- **Request Body**: `{ title, description?, category?, targetValue, unit, color?, userId? }`
- **Response `201 Created`**: `{ "success": true, "goal": { ... }, "message": "Daily goal created successfully" }`
- **Source**: `server/src/controllers/goalController.ts`

### `PUT /api/goals/:id`
- **Purpose**: Update target properties.
- **Source**: `server/src/controllers/goalController.ts`

### `DELETE /api/goals/:id`
- **Purpose**: Delete goal and historical progress logs.
- **Source**: `server/src/controllers/goalController.ts`

### `POST /api/goals/:id/progress`
- **Purpose**: Adjust progress delta or toggle completion for a given calendar date.
- **Request Body**: `{ date: "2026-11-23", delta?: 1, value?: 2, completed?: true, userId?: "guest" }`
- **Source**: `server/src/controllers/goalController.ts`

---

## 7. Mock Chamber (AI Placement Interview Simulator)

### `POST /api/mock-interview/start`
- **Purpose**: Start an interview session with Priya or Rahul persona, generate a 5-round personalized interview plan, and return Question #1.
- **Auth**: Optional / Guest
- **Request Body**:
  ```json
  {
    "role": "Full-Stack Developer",
    "experience": "Fresher / Entry-Level",
    "mode": "Technical",
    "techStack": ["React", "Node.js", "PostgreSQL"],
    "interviewerGender": "female",
    "resumeText": "Optional candidate resume text for personalized questions"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "interviewId": "67401d89b14f6b1e604f5678",
    "interviewerGender": "female",
    "role": "Full-Stack Developer",
    "mode": "Technical",
    "modeType": "RESUME_DRIVEN",
    "experience": "Fresher / Entry-Level",
    "interviewPlan": [
      { "roundNumber": 1, "roundName": "Project Architecture & System Overview", "subtopics": ["Microservices", "Data consistency"] }
    ],
    "totalRounds": 5,
    "questions": [
      {
        "index": 0,
        "question": "Can you walk me through the highest-scale backend component you engineered and how you handled concurrency?",
        "spokenText": "Hey there! I would love to hear about the highest-scale backend component you built...",
        "topic": "System Design",
        "difficulty": "Medium",
        "timeLimit": 120
      }
    ],
    "creditsLeft": 950
  }
  ```
- **Source**: `server/src/controllers/interview.controller.ts` (Router: `server/src/routes/interview.routes.ts`)

### `POST /api/mock-interview/answer`
- **Purpose**: Submit candidate voice/text answer; evaluates response across Confidence, Communication, and Correctness, and dynamically generates next question.
- **Auth**: Optional / Guest
- **Request Body**:
  ```json
  {
    "interviewId": "67401d89b14f6b1e604f5678",
    "questionIndex": 0,
    "answer": "We used Redis distributed locks with idempotent tokens to prevent duplicate payment processing...",
    "timeTaken": 45
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "questionIndex": 0,
    "evaluation": {
      "score": 8.5,
      "confidence": 8.5,
      "communication": 9.0,
      "correctness": 8.5,
      "feedback": "Strong explanation of idempotency and distributed locking.",
      "spokenJudgment": "Excellent explanation of idempotent token management."
    },
    "nextQuestion": {
      "index": 1,
      "question": "How did you monitor Redis cluster failover and handle split-brain scenarios?",
      "spokenText": "That makes total sense. Now, how did you handle Redis cluster failover?",
      "topic": "Reliability & Failover",
      "difficulty": "Hard",
      "timeLimit": 120
    },
    "hasMore": true
  }
  ```
- **Source**: `server/src/controllers/interview.controller.ts`

### `POST /api/mock-interview/next`
- **Purpose**: Skip or advance to the next round question without answering.
- **Request Body**: `{ "interviewId": "...", "currentQuestionIndex": 0 }`
- **Source**: `server/src/controllers/interview.controller.ts`

### `POST /api/mock-interview/finish` (or `/end`)
- **Purpose**: Conclude interview session, compute weighted 3-pillar aggregate scores, and generate diagnostic report with strengths, growth recommendations, and question redlines.
- **Request Body**: `{ "interviewId": "..." }`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "interviewId": "...",
    "finalScore": 84.5,
    "avgConfidence": 82.0,
    "avgCommunication": 86.0,
    "avgCorrectness": 84.0,
    "summaryFeedback": "Solid placement readiness. Demonstrates good grasp of distributed systems...",
    "strengths": ["Clear communication", "Idempotency design"],
    "improvements": ["Elaborate on edge-case testing"],
    "questions": [ ... ]
  }
  ```
- **Source**: `server/src/controllers/interview.controller.ts`

### `GET /api/mock-interview/report/:id`
- **Purpose**: Fetch interview performance diagnostic report by interview ID.
- **Response `200 OK`**: `{ "success": true, "data": { /* Interview Document */ } }`
- **Source**: `server/src/controllers/interview.controller.ts`

### `GET /api/mock-interview/my-interviews`
- **Purpose**: Retrieve historical list of candidate's completed and pending mock sessions.
- **Source**: `server/src/controllers/interview.controller.ts`

### `POST /api/mock-interview/upload-resume`
- **Purpose**: Upload candidate resume (PDF/DOCX/TXT) to personalize interview questions to real candidate projects.
- **Request Format**: `multipart/form-data` with `resume` file.
- **Source**: `server/src/controllers/interview.controller.ts`

### `POST /api/mock-interview/tts`
- **Purpose**: High-fidelity Gemini voice synthesis for AI interviewer personas (Priya: Kore, Rahul: Puck).
- **Request Body**: `{ "text": "...", "gender": "female" | "male" }`
- **Response `200 OK`**: `{ "success": true, "audioData": "data:audio/mp3;base64,...", "gender": "female" }`
- **Source**: `server/src/controllers/interview.controller.ts` (Service: `server/src/services/interviewTts.service.ts`)

### `POST /api/mock-interview/transcribe`
- **Purpose**: Transcribe candidate microphone audio via Gemini Multimodal STT into text.
- **Request Format**: `multipart/form-data` with `audio` blob.
- **Response `200 OK`**: `{ "success": true, "transcript": "..." }`
- **Source**: `server/src/controllers/interview.controller.ts`

---

## 8. Learning Roadmap & Blueprint (Ritesh)

### `GET /api/roadmap`
- **Purpose**: Fetch candidate's active roadmap, topics progress, current week, and completion statistics.
- **Auth**: Optional / Guest (`req.userId`, `x-guest-user-id`, or `'guest-student'`).
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "roadmap": {
        "_id": "...",
        "title": "Full-Stack Engineer Career Blueprint",
        "careerGoal": "Full-Stack Developer",
        "academicYear": "3rd Year",
        "totalWeeks": 8,
        "currentWeek": 1,
        "topics": [
          {
            "_id": "top-1",
            "week": 1,
            "title": "React 19 & State Primitives",
            "description": "Deep dive into hooks, concurrent mode, and compiler",
            "status": "in_progress",
            "confidenceScore": 85,
            "estimatedHours": 6,
            "completionPercent": 50,
            "subtopics": ["useTransition", "Server Components"],
            "resources": [{ "title": "React 19 Docs", "url": "https://react.dev" }]
          }
        ]
      },
      "stats": {
        "totalTopics": 24,
        "completedTopics": 8,
        "inProgressTopics": 2,
        "pendingTopics": 14,
        "completionPercent": 33,
        "averageConfidence": 78,
        "totalHours": 64,
        "completedHours": 22,
        "currentWeek": 2,
        "streakCount": 7
      }
    }
  }
  ```
- **Source**: `server/src/controllers/roadmapController.ts` (Router: `server/src/routes/roadmapRoute.ts`)
- **Model**: `Roadmap` in `server/src/models/roadmap.model.ts`

### `POST /api/roadmap/generate`
- **Purpose**: Create or regenerate a custom multi-week syllabus tailored to student's career goal, academic year, and weekly commitment.
- **Request Body**:
  ```json
  {
    "careerGoal": "DevOps Engineer",
    "academicYear": "Final Year",
    "experienceLevel": "intermediate",
    "interests": ["Kubernetes", "AWS", "Terraform"],
    "weeklyHours": 10,
    "targetWeeks": 10,
    "forceRegenerate": false
  }
  ```
- **Response `201 Created`**: Returns generated roadmap document and initial recommendations.
- **Source**: `server/src/controllers/roadmapController.ts` (Service: `server/src/services/roadmapAiService.ts`)

### `PATCH /api/roadmap/topics/:topicId`
- **Purpose**: Update a topic's checkbox completion, confidence rating, notes, or progress percent; automatically updates daily learning streak.
- **Route Parameters**: `topicId: string`
- **Request Body**:
  ```json
  {
    "status": "completed",
    "confidenceScore": 90,
    "notes": "Built sliding window rate limiter in Go",
    "completionPercent": 100
  }
  ```
- **Response `200 OK`**: `{ "success": true, "data": { "roadmap": { ... }, "stats": { ... } }, "message": "Topic progress updated successfully" }`
- **Source**: `server/src/controllers/roadmapController.ts`

### `GET /api/roadmap/recommendations`
- **Purpose**: Retrieve AI-curated study resources, practical projects, and interview questions matched to candidate's roadmap.
- **Response `200 OK`**: `{ "success": true, "data": { "focusTopics": [ ... ], "recommendedResources": [ ... ], "practiceQuestions": [ ... ] } }`
- **Source**: `server/src/controllers/roadmapController.ts`

### `POST /api/roadmap/recommendations/refresh`
- **Purpose**: Force regeneration of recommendations based on newly completed topics.
- **Source**: `server/src/controllers/roadmapController.ts`

### `POST /api/roadmap/reset`
- **Purpose**: Archive active roadmap to allow student to start fresh wizard.
- **Response `200 OK`**: `{ "success": true, "message": "Active roadmap archived..." }`
- **Source**: `server/src/controllers/roadmapController.ts`

---

## 9. Skill Tracker & Proof Verification (Kush)

### `GET /api/skills`
- **Purpose**: List all skills tracked by candidate, including category, verified status, proficiency, progress %, and AI review summaries.
- **Auth**: Optional / Guest
- **Query Parameters**: `userId?: string`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "count": 6,
    "data": [
      {
        "_id": "skill-1",
        "name": "React & Next.js",
        "category": "Frontend",
        "proficiency": "Advanced",
        "progress": 88,
        "proofUrl": "https://github.com/myusername/my-react-app",
        "repoName": "myusername/my-react-app",
        "isVerified": true,
        "verifiedAt": "2026-11-20T10:00:00.000Z",
        "aiReviewSummary": "Verified deep React 19 architecture with concurrent features and state management.",
        "aiKeyStrengths": ["React 19 Hooks", "Modular Components"],
        "description": "Developed single-page apps with server components."
      }
    ]
  }
  ```
- **Source**: `server/src/controllers/skillController.ts` (Router: `server/src/routes/skillRoute.ts`)
- **Model**: `Skill` in `server/src/models/skill.model.ts`

### `GET /api/skills/stats`
- **Purpose**: Compute high-level skill metrics: total skills, verified count, verification percentage, average progress, and category distribution.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "stats": {
      "totalSkills": 6,
      "verifiedCount": 5,
      "unverifiedCount": 1,
      "verificationRate": 83,
      "averageProgress": 78,
      "categoryBreakdown": { "Frontend": 1, "Backend": 1, "Programming": 1, "Core CS & DSA": 1, "Database": 1, "DevOps & Cloud": 1 }
    }
  }
  ```
- **Source**: `server/src/controllers/skillController.ts`

### `POST /api/skills/verify-proof`
- **Purpose**: Verify GitHub repository URL against a technical skill using GitHub AST analysis and Gemini AI code auditing.
- **Request Body**:
  ```json
  {
    "skillName": "Node.js & Express",
    "category": "Backend",
    "proofUrl": "https://github.com/myusername/api-server"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "verified": true,
      "proficiency": "Advanced",
      "progress": 85,
      "aiReviewSummary": "Audited RESTful routing, JWT authentication patterns, and rate-limiting pipelines.",
      "aiKeyStrengths": ["RESTful Routing", "JWT Security", "Middleware Chaining"],
      "repoName": "myusername/api-server",
      "auditedFilesCount": 14
    }
  }
  ```
- **Source**: `server/src/controllers/skillController.ts` (Service: `server/src/services/githubVerifierService.ts`)

### `GET /api/skills/:id`
- **Purpose**: Retrieve single skill by Mongo ID.
- **Source**: `server/src/controllers/skillController.ts`

### `POST /api/skills`
- **Purpose**: Create a new skill; if a GitHub repository `proofUrl` is supplied, it automatically triggers AI verification.
- **Request Body**:
  ```json
  {
    "name": "Docker & Kubernetes",
    "category": "DevOps & Cloud",
    "proofUrl": "https://github.com/myusername/k8s-infra",
    "description": "Containerizing microservices and managing Helm charts",
    "userId": "guest"
  }
  ```
- **Response `201 Created`**: Returns created skill document with verification badge.
- **Source**: `server/src/controllers/skillController.ts`

### `PUT /api/skills/:id`
- **Purpose**: Update skill fields or re-trigger verification with `verifyNow: true`.
- **Source**: `server/src/controllers/skillController.ts`

### `DELETE /api/skills/:id`
- **Purpose**: Remove a tracked skill.
- **Source**: `server/src/controllers/skillController.ts`

---

## 10. AI Quick Challenges (Kush)

### `POST /api/challenges/start`
- **Purpose**: Initialize an adaptive micro-interview challenge (3 to 25 questions) with chosen difficulty and career goal. Supports optional candidate resume file upload to tailor questions.
- **Auth**: Optional / Guest
- **Request Format**: `multipart/form-data` or `application/json`
  - `goal`: "Full-Stack Developer" | "Backend Engineer" | "AI/ML Engineer" (Required)
  - `difficulty`: "Beginner" | "Intermediate" | "Advanced" | "Adaptive" (Default: "Intermediate")
  - `questionCount`: Number 3-25 (Default: 5)
  - `resume`: Optional file upload (`.pdf`, `.docx`, `.txt`)
  - `resumeText`: Optional plain text resume
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "sessionId": "ch_k7x9a1_8f2d",
    "session": {
      "_id": "ch_k7x9a1_8f2d",
      "goal": "Backend Engineer",
      "questionCount": 5,
      "difficulty": "Adaptive",
      "currentDifficulty": "Intermediate",
      "currentQuestionIndex": 0,
      "currentQuestion": {
        "questionId": "q1",
        "question": "How would you design an idempotency mechanism in an API to prevent duplicate transactions?",
        "topic": "API Design & Concurrency",
        "expectedKeywords": ["idempotency key", "redis", "database lock"]
      },
      "resumeHighlights": { "skills": ["Go", "Redis"], "keyProjects": ["Payment gateway"] },
      "status": "in-progress"
    }
  }
  ```
- **Source**: `server/src/controllers/challengeController.ts` (Router: `server/src/routes/challengeRoute.ts`)
- **Model**: `ChallengeSession` in `server/src/models/challenge.model.ts`

### `GET /api/challenges/:id`
- **Purpose**: Retrieve active challenge state (used for live challenge view and browser refresh restoration).
- **Route Parameters**: `id: string`
- **Response `200 OK`**: `{ "success": true, "session": { ... } }`
- **Source**: `server/src/controllers/challengeController.ts`

### `POST /api/challenges/:id/answer`
- **Purpose**: Submit answer to active question; evaluated by Gemini, dynamically tunes difficulty (if adaptive), and generates next question or final evaluation.
- **Route Parameters**: `id: string`
- **Request Body**:
  ```json
  {
    "answer": "We store a unique client-generated UUID in Redis with a 24-hour TTL before processing..."
  }
  ```
- **Response `200 OK` (If more questions remain)**:
  ```json
  {
    "success": true,
    "isCompleted": false,
    "aiAcknowledgment": "Great explanation of using UUIDs in Redis with TTLs.",
    "nextQuestion": {
      "questionId": "q2",
      "question": "What happens if the Redis instance crashes before the database commit succeeds?",
      "topic": "Distributed Transactions"
    },
    "currentQuestionIndex": 1,
    "totalQuestions": 5,
    "currentDifficulty": "Advanced"
  }
  ```
- **Response `200 OK` (If completed)**:
  ```json
  {
    "success": true,
    "isCompleted": true,
    "aiAcknowledgment": "Well done on completing the technical challenge!",
    "finalEvaluation": {
      "overallScore": 88,
      "rating": "Competitive",
      "summary": "Demonstrated strong knowledge of backend reliability and caching patterns.",
      "strengths": ["Clear distributed systems thinking", "Consistent edge-case awareness"],
      "improvements": ["Elaborate on database isolation levels"]
    },
    "session": { "_id": "...", "status": "completed", "overallScore": 88 }
  }
  ```
- **Source**: `server/src/controllers/challengeController.ts` (Service: `server/src/services/challengeAiService.ts`)

### `GET /api/challenges/:id/results`
- **Purpose**: Retrieve final performance report, overall score, strengths, growth areas, and turn-by-turn question evaluations for a completed challenge.
- **Route Parameters**: `id: string`
- **Response `200 OK`**: `{ "success": true, "session": { "finalEvaluation": { ... }, "questions": [ ... ] } }`
- **Source**: `server/src/controllers/challengeController.ts`
