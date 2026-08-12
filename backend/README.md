# ⚙️ Backend — AI Mock Interviewer

> Express.js 5 API Server — Serverless-Ready for Vercel

This package contains the complete backend for the AI Mock Interviewer platform. It is a stateless Express.js application designed to run as a Vercel Serverless Function and integrates Google Gemini AI, Supabase Auth, Prisma ORM, and Supabase Cloud Storage.

---

## 📦 Package Overview

```
backend/
├── controllers/
│   ├── interviewController.js  ← Core AI session management & telemetry
│   └── uploadController.js     ← Supabase Storage video upload
├── lib/
│   ├── prisma.js               ← Singleton Prisma client (ESM-compatible)
│   └── supabase.js             ← Supabase admin client (Service Role Key)
├── middleware/
│   └── auth.js                 ← JWT auth via Supabase `getUser(token)`
├── prisma/
│   └── schema.prisma           ← Database schema: User, Session, Result
├── routes/
│   └── api.js                  ← All route definitions & Multer config
├── services/
│   ├── githubService.js        ← GitHub profile + repo fetcher (Octokit)
│   └── leetcodeService.js      ← LeetCode GraphQL profile fetcher
└── server.js                   ← Express app setup (CORS, routes, listen)
```

---

## 🚀 Development

```bash
npm run dev --prefix backend
```

The backend dev server runs on `http://localhost:5000` using `nodemon` for hot-reload.

### Environment Variables

Create `backend/.env`:

```env
# Required
GEMINI_API_KEY=your_google_gemini_api_key
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
# Database (PostgreSQL via Supabase)
# Use sslmode=no-verify for stable local connections to Supabase poolers
DATABASE_URL=postgresql://postgres.<ref>:<password>@<host>:5432/postgres?sslmode=no-verify

# Optional (increases GitHub API rate limit from 60 to 5000 req/hr)
GITHUB_TOKEN=your_github_personal_access_token
```

---

## 🗄️ Database Schema

Managed with **Prisma 7** targeting **PostgreSQL** (hosted on Supabase).

### `User`
Synced from Supabase Auth on first login via `upsert`. Linked to all sessions and results.

```prisma
model User {
  id               String (UUID)
  supabaseUserId   String (unique) ← Links to Supabase Auth user
  email            String (unique)
  fullName         String?
  subscriptionTier String @default("free")
  sessions         InterviewSession[]
  results          InterviewResult[]
}
```

### `InterviewSession`
Created when `/api/start` is called. Tracks the configuration chosen by the user.

```prisma
model InterviewSession {
  role               String?
  skills             String[]
  experienceLevel    String?
  interviewerPersona String?
  pressureMode       Boolean @default(false)
  githubUsername     String?
  leetcodeUsername   String?
  status             String @default("in_progress")  ← updated to "completed" on end
  startedAt          DateTime @default(now())
  endedAt            DateTime?
}
```

### `InterviewResult`
Created when `/api/end` is called. Stores all analytics.

```prisma
model InterviewResult {
  overallScore       Decimal?
  communicationScore Decimal?
  technicalScore     Decimal?
  confidenceScore    Decimal?
  starMethodScore    Decimal?
  fillerWordsCount   Int?      ← Filler words detected in user responses
  questionsAsked     Int?      ← Number of AI turns tracked in session
  transcript         Json?     ← Full conversation as JSON array
  aiFeedback         String?   ← Clean, user-facing final report text
  videoRecordingUrl  String?   ← Supabase Storage public URL
}
```

### Prisma Commands

```bash
# From the root directory
# (Prisma 7 automatically detects prisma.config.js)
npx prisma generate --schema backend/prisma/schema.prisma
npx prisma db push   --schema backend/prisma/schema.prisma

# Open Prisma Studio (visual DB browser)
npx prisma studio --schema backend/prisma/schema.prisma
```

---

## 🔩 Core Components

### `interviewController.js` — Session Lifecycle

**`startSession`**:
1. Reads `role`, `skills`, `persona`, `pressureMode`, `interviewType` from request body.
2. Optionally: fetches GitHub repos (Octokit) and LeetCode profile (GraphQL).
3. Optionally: parses uploaded resume PDF via `pdf-parse`.
4. Builds a comprehensive system prompt with all context.
5. Initializes a `GoogleGenerativeAI` chat with the system prompt as first history entry.
6. Triggers the AI's initial greeting message.
7. Creates an `InterviewSession` record in the database.
8. Stores the chat instance, session IDs, and message history in a server-side `Map`.
9. Returns `{ sessionId, reply }`.

**`chatWithAI`**:
1. Retrieves the session from the `Map`.
2. Sends the user's message to the AI.
3. Appends both user and AI messages to `session.messages`.
4. Increments `session.questionsAsked`.
5. Returns `{ reply }`.

**`endSession`**:
1. Retrieves the session from the `Map`.
2. Sends the final prompt, instructing the AI to generate a structured report.
3. Uses regex to extract the `SCORE_JSON` block from the AI's response.
4. Saves an `InterviewResult` record with all scores, telemetry, and transcript.
5. Updates the `InterviewSession` status to `"completed"`.
6. Clears the session from the `Map`.
7. Returns `{ finalReport, scores }`.

### `auth.js` — Middleware

Every protected route passes through `authMiddleware`:
```
1. Extract Bearer token from Authorization header
2. Call supabase.auth.getUser(token) using Service Role Key
3. If valid, attach user object to req.user
4. If invalid, return 401
```

### `uploadController.js` — Cloud Storage

Accepts a `multipart/form-data` request with a `video` blob (held in RAM by `multer.memoryStorage()`):
1. Generates a unique filename: `interview-{sessionId}-{timestamp}.webm`.
2. Streams the buffer directly to the **`recordings`** bucket in Supabase Storage.
3. Retrieves the public URL from Supabase.
4. Updates the `InterviewResult.videoRecordingUrl` field in the database.

> **Why memory storage?** Vercel's serverless environment has a read-only filesystem. `multer.memoryStorage()` holds the file in a `Buffer` in RAM, allowing it to be directly streamed to the cloud.

---

## 📡 API Routes

All routes (except `/api/health`) are protected by `authMiddleware`.

```
POST /api/start             ← multipart/form-data (resume PDF optional)
POST /api/chat              ← application/json { sessionId, message }
POST /api/end               ← application/json { sessionId, fillerWordsCount }
POST /api/recording/upload  ← multipart/form-data (video WebM)
GET  /api/leetcode-profile/:username
GET  /api/github-profile/:username
GET  /api/user/interviews
GET  /api/interviews/:id
GET  /api/health            ← No auth required
```

---

## ⚙️ ESM Compatibility

The backend uses `"type": "module"` in its `package.json`. This enables native ES module syntax (`import`/`export`) in Node.js. This causes a known issue with `@prisma/client`, which uses CommonJS (CJS) internally.

**Fix in `lib/prisma.js`**:
```js
// ✅ Interop-friendly pattern for ESM + CJS packages:
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
```

---

## 🌐 Vercel Deployment

The backend is served as a single serverless function via `api/index.js`:

```js
// api/index.js
import app from '../backend/server.js';
export default app; // Vercel handles req/res wrapping
```

The `vercel.json` at the root configures the build:
```json
{
  "buildCommand": "npx prisma generate --schema backend/prisma/schema.prisma && npm install && npm run build --prefix frontend",
  "outputDirectory": "frontend/dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index" },
    { "source": "/(.*)",     "destination": "/index.html" }
  ]
}
```

> **Critical**: All `backend/.env` variables must be added to your **Vercel Project Settings → Environment Variables** before deploying.
