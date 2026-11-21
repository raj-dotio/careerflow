# CareerFlow API Catalog

> Compact API reference for AI coding tasks and backend integration. Inspect this catalog before scanning codebase files.

---

## Compact API Index

| Method | Endpoint | Purpose | Auth | Source File |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Health check & environment status | None | `server/src/app.ts` |
| `POST` | `/api/auth/google` | Google OAuth login / registration & cookie token | None | `server/src/controllers/authController.ts` |
| `POST` | `/api/auth/logout` | Clear auth token cookie | None | `server/src/controllers/authController.ts` |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Required | `server/src/controllers/userController.ts` |
| `GET` | `/api/auth/current-user` | Alias for `/api/auth/me` | Required | `server/src/controllers/userController.ts` |
| `GET` | `/api/resumes` | Get all user resumes | Optional / Guest | `server/src/controllers/resumeController.ts` |
| `GET` | `/api/resumes/sample` | Get default technical resume template | None | `server/src/controllers/resumeController.ts` |
| `GET` | `/api/resumes/:id` | Get resume by ID (or sample template) | None | `server/src/controllers/resumeController.ts` |
| `POST` | `/api/resumes` | Create a new resume document | Optional / Guest | `server/src/controllers/resumeController.ts` |
| `PUT` | `/api/resumes/:id` | Update an existing resume | Optional / Guest | `server/src/controllers/resumeController.ts` |
| `DELETE` | `/api/resumes/:id` | Delete a resume by ID | Optional / Guest | `server/src/controllers/resumeController.ts` |
| `POST` | `/api/resumes/:id/duplicate` | Duplicate an existing resume | Optional / Guest | `server/src/controllers/resumeController.ts` |
| `POST` | `/api/ats/analyze` | Evaluate raw text or JSON resume against ATS | None | `server/src/controllers/atsController.ts` |
| `POST` | `/api/ats/upload` | Upload resume file (PDF/DOCX/TXT) for ATS analysis | None | `server/src/controllers/atsController.ts` |
| `GET` | `/api/goals` | Fetch all user daily goals | Optional / Guest | `server/src/controllers/goalController.ts` |
| `GET` | `/api/goals/stats` | Streaks, 26-wk heatmap, weekly & per-goal analytics | Optional / Guest | `server/src/controllers/goalController.ts` |
| `POST` | `/api/goals` | Create a new daily target | Optional / Guest | `server/src/controllers/goalController.ts` |
| `PUT` | `/api/goals/:id` | Update target properties | Optional / Guest | `server/src/controllers/goalController.ts` |
| `DELETE` | `/api/goals/:id` | Delete goal and historical progress logs | Optional / Guest | `server/src/controllers/goalController.ts` |
| `POST` | `/api/goals/:id/progress` | Adjust progress delta or toggle completion | Optional / Guest | `server/src/controllers/goalController.ts` |

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
- **Request Body**: None
- **Response `200 OK`**:
  ```json
  {
    "message": "Logged Out Successfully"
  }
  ```
- **Error Responses**:
  - `500 Internal Server Error`: `{ "message": "Logout Error : <error>" }`
- **Source**: `server/src/controllers/authController.ts` (Router: `server/src/routes/authRoute.ts`)
- **Model**: None

### `GET /api/auth/me` & `GET /api/auth/current-user`
- **Purpose**: Retrieve currently logged-in user details.
- **Auth**: Required (`isAuth` middleware reads `req.cookies.token` or `Authorization: Bearer <token>`).
- **Parameters**: None
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
  - `401 Unauthorized`: `{ "message": "Not authenticated" }` or `{ "message": "User ID missing from request" }`
  - `404 Not Found`: `{ "message": "User not found" }`
  - `500 Internal Server Error`: `{ "message": "Failed to get Current User Error : <error>" }`
- **Source**: `server/src/controllers/userController.ts` (Router: `server/src/routes/authRoute.ts`)
- **Model**: `User` in `server/src/models/user.model.ts`

---

## 3. Resume Builder Management

### `GET /api/resumes`
- **Purpose**: Get all resumes belonging to user (or guest).
- **Auth**: Optional / Guest (`req.userId || req.query.userId || 'guest'`).
- **Query Parameters**: `userId?: string`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "count": 1,
    "data": [ /* Array of Resume documents */ ]
  }
  ```
- **Error Responses**:
  - `500 Internal Server Error`: `{ "success": false, "message": "Failed to retrieve resumes" }`
- **Source**: `server/src/controllers/resumeController.ts` (Router: `server/src/routes/resumeRoute.ts`)
- **Model**: `Resume` in `server/src/models/resume.model.ts`

### `GET /api/resumes/sample`
- **Purpose**: Fetch standard starter engineering resume data (Sarah Lin template).
- **Auth**: None (Public)
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "title": "Software Engineering Resume",
      "basics": { "name": "Sarah Lin", "headline": "...", "email": "...", "phone": "...", "location": "...", "url": "..." },
      "summary": "...",
      "sections": { "profiles": [], "experience": [], "education": [], "skills": [], "projects": [], "certifications": [], "awards": [], "languages": [] },
      "metadata": { "template": "modern", "theme": { "primary": "#0066cc", "text": "#1d1d1f", "background": "#ffffff" }, "typography": { "font": "Inter", "size": 14 } }
    }
  }
  ```
- **Source**: `server/src/controllers/resumeController.ts` (Router: `server/src/routes/resumeRoute.ts`)
- **Model**: None (`IResumeData` interface)

### `GET /api/resumes/:id`
- **Purpose**: Fetch a single resume by Mongo ID or string `'sample'`.
- **Auth**: None (Public)
- **Route Parameters**: `id: string`
- **Response `200 OK`**: `{ "success": true, "data": { /* Resume document or sample data */ } }`
- **Error Responses**:
  - `404 Not Found`: `{ "success": false, "message": "Resume not found" }`
  - `500 Internal Server Error`: `{ "success": false, "message": "Failed to retrieve resume" }`
- **Source**: `server/src/controllers/resumeController.ts` (Router: `server/src/routes/resumeRoute.ts`)
- **Model**: `Resume` in `server/src/models/resume.model.ts`

### `POST /api/resumes`
- **Purpose**: Create and persist a new resume document.
- **Auth**: Optional / Guest (`req.userId || req.body.userId || 'guest'`).
- **Request Body**: `IResumeData` or `{ resumeData: IResumeData, userId?: string }`
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "message": "Resume created successfully",
    "data": { /* Created Resume document with _id */ }
  }
  ```
- **Error Responses**:
  - `500 Internal Server Error`: `{ "success": false, "message": "Failed to create resume" }`
- **Source**: `server/src/controllers/resumeController.ts` (Router: `server/src/routes/resumeRoute.ts`)
- **Model**: `Resume` in `server/src/models/resume.model.ts`

### `PUT /api/resumes/:id`
- **Purpose**: Update an existing resume.
- **Auth**: Optional / Guest
- **Route Parameters**: `id: string`
- **Request Body**: Partial or full fields of `IResumeData`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Resume updated successfully",
    "data": { /* Updated Resume document */ }
  }
  ```
- **Error Responses**:
  - `404 Not Found`: `{ "success": false, "message": "Resume not found" }`
  - `500 Internal Server Error`: `{ "success": false, "message": "Failed to update resume" }`
- **Source**: `server/src/controllers/resumeController.ts` (Router: `server/src/routes/resumeRoute.ts`)
- **Model**: `Resume` in `server/src/models/resume.model.ts`

### `DELETE /api/resumes/:id`
- **Purpose**: Delete a resume by ID.
- **Auth**: Optional / Guest
- **Route Parameters**: `id: string`
- **Response `200 OK`**: `{ "success": true, "message": "Resume deleted successfully" }`
- **Error Responses**:
  - `404 Not Found`: `{ "success": false, "message": "Resume not found" }`
  - `500 Internal Server Error`: `{ "success": false, "message": "Failed to delete resume" }`
- **Source**: `server/src/controllers/resumeController.ts` (Router: `server/src/routes/resumeRoute.ts`)
- **Model**: `Resume` in `server/src/models/resume.model.ts`

### `POST /api/resumes/:id/duplicate`
- **Purpose**: Duplicate an existing resume as a copy.
- **Auth**: Optional / Guest
- **Route Parameters**: `id: string`
- **Response `201 Created`**: `{ "success": true, "message": "Resume duplicated successfully", "data": { /* Cloned Resume */ } }`
- **Error Responses**:
  - `404 Not Found`: `{ "success": false, "message": "Source resume not found" }`
  - `500 Internal Server Error`: `{ "success": false, "message": "Failed to duplicate resume" }`
- **Source**: `server/src/controllers/resumeController.ts` (Router: `server/src/routes/resumeRoute.ts`)
- **Model**: `Resume` in `server/src/models/resume.model.ts`

---

## 4. ATS Diagnostics & Resume Checker

### `POST /api/ats/analyze`
- **Purpose**: Analyze plain text or structured JSON resume for ATS compatibility and job description matching.
- **Auth**: None (Public)
- **Request Body**:
  ```json
  {
    "resumeText": "...",
    "resumeData": { /* Optional IResumeData structure */ },
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
      "summaryFeedback": "...",
      "scores": { "keywordMatch": 80, "quantifiableImpact": 90, "structureAndFormat": 85, "readabilityAndLength": 90 },
      "metrics": { "wordCount": 420, "bulletCount": 12, "metricBulletCount": 8, "actionVerbCount": 10, "readingTimeMinutes": 2 },
      "keywords": { "matchedKeywords": [], "missingKeywords": [], "matchRate": 80 },
      "bulletRedlines": [ { "original": "...", "suggested": "...", "reason": "..." } ],
      "checklist": [ { "category": "Contact Information", "item": "...", "passed": true } ]
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{ "success": false, "message": "Insufficient resume content provided for ATS analysis..." }`
  - `500 Internal Server Error`: `{ "success": false, "message": "Failed to analyze resume" }`
- **Source**: `server/src/controllers/atsController.ts` (Router: `server/src/routes/atsRoute.ts`)
- **Model**: None (In-memory analysis engine)

### `POST /api/ats/upload`
- **Purpose**: Upload document file (`PDF`, `DOCX`, or `TXT`) and execute ATS evaluation.
- **Auth**: None (Public)
- **Request Format**: `multipart/form-data`
  - `resume`: File binary (`.pdf`, `.docx`, `.txt`)
  - `jobDescription`: String (optional)
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "fileName": "resume.pdf",
    "extractedTextLength": 2450,
    "data": { /* AtsEvaluationResult */ }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{ "success": false, "message": "No resume file uploaded" }` or `{ "message": "Could not extract readable text..." }`
  - `500 Internal Server Error`: `{ "success": false, "message": "Failed to upload and analyze document" }`
- **Source**: `server/src/controllers/atsController.ts` (Router: `server/src/routes/atsRoute.ts`)
- **Model**: None

---

## 5. Daily Goals & Streak Analytics

### `GET /api/goals`
- **Purpose**: Fetch all daily targets for a user.
- **Auth**: Optional / Guest (`req.userId || req.query.userId || 'guest'`).
- **Query Parameters**: `userId?: string`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "goals": [
      {
        "_id": "67401d89b14f6b1e604f12ab",
        "userId": "guest",
        "title": "Solve 2 DSA problems",
        "description": "Daily LeetCode / Striver SDE Sheet practice",
        "category": "dsa",
        "targetValue": 2,
        "currentValue": 1,
        "unit": "problems",
        "color": "#2563eb",
        "frequency": "daily",
        "completed": false
      }
    ],
    "today": "2026-11-21"
  }
  ```
- **Error Responses**:
  - `500 Internal Server Error`: `{ "success": false, "message": "Failed to fetch goals" }`
- **Source**: `server/src/controllers/goalController.ts` (Router: `server/src/routes/goalRoute.ts`)
- **Model**: `Goal`, `GoalProgress` in `server/src/models/goal.model.ts`

### `GET /api/goals/stats`
- **Purpose**: Calculate overall current streak, all-time best streak, 26-week (182-day) GitHub contribution heatmap, current week summary, and per-goal analytics.
- **Auth**: Optional / Guest (`req.userId || req.query.userId || 'guest'`).
- **Query Parameters**: `userId?: string`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "stats": {
      "today": "2026-11-21",
      "currentStreak": 19,
      "bestStreak": 28,
      "todayCompletedCount": 1,
      "totalActiveGoals": 3,
      "weeklySummary": {
        "planned": 21,
        "completed": 14,
        "missed": 2,
        "completionRate": 67,
        "breakdown": [
          { "day": "Mon", "date": "2026-11-17", "completed": 2, "total": 3, "percentage": 67, "isToday": false, "isFuture": false }
        ]
      },
      "heatmap": [
        { "date": "2026-05-23", "completedCount": 2, "totalGoals": 3, "level": 3 }
      ],
      "perGoalStats": [
        {
          "goalId": "67401d89b14f6b1e604f12ab",
          "title": "Solve 2 DSA problems",
          "color": "#2563eb",
          "category": "dsa",
          "currentStreak": 19,
          "bestStreak": 19,
          "last30DaysPercent": 87,
          "totalCheckOffs": 239,
          "heatmap": [ { "date": "2026-11-21", "completed": false } ],
          "consistencyData": [ { "week": "Jul 6", "percentage": 85 } ]
        }
      ]
    }
  }
  ```
- **Error Responses**:
  - `500 Internal Server Error`: `{ "success": false, "message": "Failed to compute goal stats" }`
- **Source**: `server/src/controllers/goalController.ts` (Router: `server/src/routes/goalRoute.ts`)
- **Model**: `Goal`, `GoalProgress` in `server/src/models/goal.model.ts`

### `POST /api/goals`
- **Purpose**: Create a new daily goal.
- **Auth**: Optional / Guest (`req.userId || req.body.userId || 'guest'`).
- **Request Body**:
  ```json
  {
    "title": "Revise System Design",
    "description": "CAP Theorem & Rate Limiting",
    "category": "custom",
    "targetValue": 1,
    "unit": "module",
    "color": "#8b5cf6",
    "userId": "guest"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "goal": { /* Goal document */ },
    "message": "Daily goal created successfully"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{ "success": false, "message": "Goal title is required" }`
  - `500 Internal Server Error`: `{ "success": false, "message": "Failed to create goal" }`
- **Source**: `server/src/controllers/goalController.ts` (Router: `server/src/routes/goalRoute.ts`)
- **Model**: `Goal`, `GoalProgress` in `server/src/models/goal.model.ts`

### `PUT /api/goals/:id`
- **Purpose**: Update an existing goal by ID.
- **Auth**: Optional / Guest
- **Route Parameters**: `id: string`
- **Request Body**: `{ title?, description?, category?, targetValue?, unit?, color? }`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "goal": { /* Updated Goal document */ },
    "message": "Goal updated successfully"
  }
  ```
- **Error Responses**:
  - `404 Not Found`: `{ "success": false, "message": "Goal not found" }`
  - `500 Internal Server Error`: `{ "success": false, "message": "Failed to update goal" }`
- **Source**: `server/src/controllers/goalController.ts` (Router: `server/src/routes/goalRoute.ts`)
- **Model**: `Goal`, `GoalProgress` in `server/src/models/goal.model.ts`

### `DELETE /api/goals/:id`
- **Purpose**: Delete a daily target and remove all its progress history.
- **Auth**: Optional / Guest
- **Route Parameters**: `id: string`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Goal and related progress deleted successfully"
  }
  ```
- **Error Responses**:
  - `404 Not Found`: `{ "success": false, "message": "Goal not found" }`
  - `500 Internal Server Error`: `{ "success": false, "message": "Failed to delete goal" }`
- **Source**: `server/src/controllers/goalController.ts` (Router: `server/src/routes/goalRoute.ts`)
- **Model**: `Goal`, `GoalProgress` in `server/src/models/goal.model.ts`

### `POST /api/goals/:id/progress`
- **Purpose**: Record numeric progress delta or direct completion status for a given calendar date.
- **Auth**: Optional / Guest
- **Route Parameters**: `id: string`
- **Request Body**:
  ```json
  {
    "date": "2026-11-21",
    "delta": 1,
    "value": 2,
    "completed": true,
    "userId": "guest"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "progress": { /* GoalProgress document */ },
    "goal": { /* Synced Goal document */ },
    "message": "Progress recorded"
  }
  ```
- **Error Responses**:
  - `404 Not Found`: `{ "success": false, "message": "Goal not found" }`
  - `500 Internal Server Error`: `{ "success": false, "message": "Failed to update progress" }`
- **Source**: `server/src/controllers/goalController.ts` (Router: `server/src/routes/goalRoute.ts`)
- **Model**: `Goal`, `GoalProgress` in `server/src/models/goal.model.ts`
