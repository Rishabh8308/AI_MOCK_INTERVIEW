# 🤖 AI Mock Interviewer — Pro Series

> **The most advanced, full-stack AI interview simulation platform built for serious candidates.**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-20%2B-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/react-19-61dafb.svg)](https://react.dev)
[![Gemini](https://img.shields.io/badge/powered%20by-Gemini%20AI-orange.svg)](https://ai.google.dev)

AI Mock Interviewer is an industry-grade, full-stack application that simulates high-stakes technical and behavioral job interviews. It uses **Google Gemini AI** for evaluation, **Supabase** for authentication and cloud storage, **TensorFlow.js** for real-time video processing, and **Prisma ORM** for persistent data analytics.

---

## 📋 Table of Contents

- [Features](#-features)
- [System Architecture](#️-system-architecture)
- [Tech Stack](#-tech-stack)
- [Directory Structure](#-directory-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Setup](#️-database-setup)
- [Supabase Storage Setup](#-supabase-storage-setup)
- [API Reference](#-api-reference)
- [Feature Deep-Dive](#-feature-deep-dive)
- [Deployment (Vercel)](#-deployment-vercel)
- [Known Considerations](#-known-considerations)

---

## ✨ Features

| Feature | Description |
| :--- | :--- |
| 🧠 **AI-Powered Evaluation** | Real-time feedback per answer using Google Gemini. Covers communication, technical depth, and confidence. |
| 🏗️ **3-Phase Interview Structure** | Auto-transitions: **DSA → Technical Depth → Behavioral (STAR)** |
| 👤 **Persona Engine** | 6 distinct interviewer personalities: Friendly, Strict, Guru, FAANG Style, Startup Style, Corporate Style. |
| 🔥 **Pressure Mode** | Curveball questions, high-stress hypotheticals, and deadline simulations. |
| 📂 **GitHub DNA Analysis** | Fetches public repos; AI asks project-specific architectural questions. |
| 🧩 **LeetCode Calibration** | Fetches solve-count by difficulty and topic to calibrate DSA question difficulty. |
| 📄 **Resume Parsing** | Upload a PDF resume; AI tailors questions to your specific past experience. |
| 🎥 **Video Recording** | Full session capture via `MediaRecorder API`, uploaded to Supabase Cloud Storage. |
| 🎭 **AI Virtual Backgrounds** | Real-time segmentation with TensorFlow.js. Blur or professional office backgrounds. |
| 🎤 **Voice-to-Text** | Web Speech API integration for hands-free answering. |
| 💻 **Live Code Whiteboard** | CodeMirror-powered editor with in-browser JavaScript execution and output terminal. |
| 📊 **Communication Analytics** | Detects and counts filler words (um, uh, like, basically) in user responses. |
| 📝 **Multi-Page PDF Reports** | Exports complete evaluation to a well-formatted, paginated PDF. |
| 🏛️ **Interview History** | Persistent dashboard showing all past sessions with scores and full transcripts. |
| 🌗 **Dark / Light Mode** | Toggleable theme persisted in `localStorage`. |

---

## 🏛️ System Architecture

The project is a **npm workspace monorepo** with two packages:

```
mock_interviewer/
├── frontend/         ← React 19 + Vite (SPA)
├── backend/          ← Express.js API (Serverless on Vercel)
├── api/index.js      ← Vercel serverless function entry point
├── vercel.json       ← Vercel routing and build configuration
└── package.json      ← Root workspace definition
```

**Data Flow:**
```
User Browser → React Frontend
     ↓ (HTTPS API Calls)
Express API (Vercel Serverless)
     ↓                    ↓
Gemini AI API        PostgreSQL DB (via Prisma + Supabase)
                          ↓
                    Supabase Storage (Video Recordings)
```

---

## 🛠️ Tech Stack

### Frontend
| Library | Version | Purpose |
| :--- | :--- | :--- |
| React | 19 | Core UI framework |
| Vite | 8 | Build tool & dev server |
| @uiw/react-codemirror | latest | In-browser code editor |
| @tensorflow-models/body-segmentation | latest | AI background removal |
| jspdf | latest | Multi-page PDF report generation |
| @supabase/supabase-js | latest | Auth session management |

### Backend
| Library | Version | Purpose |
| :--- | :--- | :--- |
| Express | 5 | HTTP server & routing |
| @google/generative-ai | 0.24+ | Gemini AI integration |
| Prisma | 7 | Type-safe ORM for PostgreSQL (with pg adapter) |
| @prisma/adapter-pg | latest | Driver adapter for Prisma 7 |
| pg | latest | Node.js PostgreSQL client |
| @supabase/supabase-js | latest | Token verification & Cloud Storage |
| Multer | 2 | Multipart form parsing (memory mode) |
| pdf-parse | 2 | Resume PDF text extraction |
| @octokit/rest | latest | GitHub API client |

---

## 📁 Directory Structure

```
mock_interviewer/
├── api/
│   └── index.js                    ← Vercel serverless entry point
├── backend/
│   ├── controllers/
│   │   ├── interviewController.js  ← Core: AI session, chat, telemetry
│   │   └── uploadController.js     ← Cloud video upload (Supabase Storage)
│   ├── lib/
│   │   ├── prisma.js               ← Prisma client (ESM-compatible)
│   │   └── supabase.js             ← Supabase admin client (service role)
│   ├── middleware/
│   │   └── auth.js                 ← JWT verification via Supabase
│   ├── prisma/
│   │   └── schema.prisma           ← DB models: User, InterviewSession, InterviewResult
│   ├── routes/
│   │   └── api.js                  ← Route definitions + Multer config
│   ├── services/
│   │   ├── githubService.js        ← Octokit GitHub profile & repo fetcher
│   │   └── leetcodeService.js      ← LeetCode GraphQL profile fetcher (with topics)
│   └── server.js                   ← Express app setup + CORS
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat.jsx            ← Main interview UI (chat, whiteboard, webcam)
│   │   │   ├── Setup.jsx           ← Interview configuration form
│   │   │   ├── EvaluationReport.jsx← Final report with multi-page PDF export
│   │   │   ├── BackgroundSelector.jsx ← Virtual background picker UI
│   │   │   ├── Dropdown.jsx        ← Animated custom select component
│   │   │   └── ProtectedRoute.jsx  ← Auth guard for React Router
│   │   ├── hooks/
│   │   │   ├── useVirtualBackground.js ← TF.js segmentation + canvas rendering
│   │   │   └── useVideoRecorder.js ← MediaRecorder API wrapper
│   │   ├── lib/
│   │   │   ├── supabaseClient.js   ← Frontend Supabase client (anon key)
│   │   │   └── mediapipe_shim.js   ← Build-time shim for MediaPipe library
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx        ← Login / Sign-up form
│   │   │   ├── Dashboard.jsx       ← Interview history dashboard
│   │   │   └── InterviewDetails.jsx← Full session transcript & scores
│   │   └── App.jsx                 ← Root router, auth state, session manager
│   └── vite.config.js              ← Vite config with MediaPipe alias & TF.js deps
└── vercel.json                     ← Vercel build command + route rewrites
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 20+** (24+ recommended)
- A **Google Gemini API Key** (get one at [ai.google.dev](https://ai.google.dev))
- A **Supabase project** (free tier is sufficient)
- (Optional) A **GitHub Personal Access Token** for higher rate limits

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd mock_interviewer
npm install
```

> This single `npm install` at the root installs dependencies for all workspaces (`frontend` and `backend`) simultaneously.

### 2. Configure Environment Variables

See the [Environment Variables](#-environment-variables) section for the full list.

### 3. Initialize the Database

```bash
# From the root directory
# (Prisma 7 automatically detects prisma.config.js)
npx prisma generate --schema backend/prisma/schema.prisma
npx prisma db push   --schema backend/prisma/schema.prisma
```

### 4. Start Development Server

```bash
# From the root directory (starts both frontend and backend concurrently)
npm run dev
```

| Service | URL |
| :--- | :--- |
| **Frontend** | `http://localhost:5173` |
| **Backend API** | `http://localhost:5000` |
| **Health Check** | `http://localhost:5000/api/health` |

---

## 🔑 Environment Variables

### Backend (`/backend/.env`)

```env
# Google AI
GEMINI_API_KEY=your_gemini_api_key

# Supabase (for Auth verification & Cloud Storage)
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database (PostgreSQL via Supabase)
# Use sslmode=no-verify for stable local connections to Supabase poolers
DATABASE_URL=postgresql://postgres.<ref>:<password>@<host>:5432/postgres?sslmode=no-verify

# Optional: GitHub API (increases rate limit from 60 to 5000 req/hr)
GITHUB_TOKEN=your_github_personal_access_token
```

### Frontend (`/frontend/.env`)

```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🗄️ Database Setup

The Prisma schema defines three core models:

- **`User`**: Synced from Supabase Auth on first login. Stores email, name, and subscription tier.
- **`InterviewSession`**: Created when an interview starts. Records role, skills, persona, and pressure mode settings.
- **`InterviewResult`**: Created when an interview ends. Stores AI feedback, scores (0-100), filler word count, question count, transcript JSON, and video URL.

```bash
# Push schema to your database (safe, non-destructive in dev)
npx prisma db push --schema backend/prisma/schema.prisma

# View your data in Prisma Studio
npx prisma studio --schema backend/prisma/schema.prisma
```

---

## ☁️ Supabase Storage Setup

The video recording feature requires a Supabase Storage bucket:

1. Go to your **Supabase Dashboard → Storage → New Bucket**
2. Name the bucket: **`recordings`** (must be exact)
3. Enable **Public bucket** (so video URLs can be viewed in reports)
4. Enable **Restrict MIME types** → add `video/webm`
5. Enable **Restrict file size** → set to `52428800` (50 MB)

> **Why Supabase Storage?** Vercel and other serverless platforms use a read-only filesystem. Files cannot be saved locally. All video uploads are streamed from RAM directly to the Supabase bucket.

---

## 📡 API Reference

| Endpoint | Method | Auth | Description |
| :--- | :--- | :--- | :--- |
| `/api/health` | `GET` | ❌ | Server health check |
| `/api/start` | `POST` | ✅ | Initializes AI session with GitHub/LeetCode context and optionally parses a resume PDF. |
| `/api/chat` | `POST` | ✅ | Sends a user message, gets AI follow-up, and increments the question counter. |
| `/api/end` | `POST` | ✅ | Triggers final report generation. Parses `SCORE_JSON` from AI output and persists all telemetry. |
| `/api/recording/upload` | `POST` | ✅ | Receives video blob, streams to Supabase Storage, and updates the session record with the public URL. |
| `/api/leetcode-profile/:username` | `GET` | ✅ | Fetches LeetCode profile with topic-level solve counts via GraphQL. |
| `/api/github-profile/:username` | `GET` | ✅ | Fetches top 10 repos via GitHub API (Octokit). |
| `/api/user/interviews` | `GET` | ✅ | Returns all completed interview sessions for the authenticated user. |
| `/api/interviews/:id` | `GET` | ✅ | Returns the full transcript, scores, and feedback for a specific session. |

---

## 🔬 Feature Deep-Dive

### 3-Phase Interview Structure
The AI is prompted to conduct the interview in three distinct, automatically-transitioning phases:
1. **DSA Phase**: Data structures, algorithms, and Big O analysis. Difficulty is calibrated using the candidate's LeetCode profile.
2. **Technical Depth Phase**: Framework internals, best practices, and system design questions based on the candidate's specified skills and GitHub projects.
3. **Behavioral Phase**: STAR method evaluation (Situation, Task, Action, Result) for soft skills and team dynamics.

### Communication Analytics Pipeline
1. User responses accumulate on the frontend during the session.
2. On session end, all user text is joined and scanned via regex for filler words (`um`, `uh`, `like`, `actually`, `basically`, `so`).
3. The total count is sent to the backend with the `/api/end` request and stored in `InterviewResult.fillerWordsCount`.

### AI Virtual Background (Technical)
The `useVirtualBackground` hook uses the **MediaPipe** runtime (loaded from CDN via `solutionPath`) to perform body segmentation. Each frame:
1. Segmenter generates a binary foreground/background mask.
2. The background layer (blurred video or custom image) is drawn on a `<canvas>`.
3. The foreground (person) is drawn on a `tempCanvas` using `globalCompositeOperation: 'source-in'`.
4. The composite is merged. The canvas stream is captured at 30fps via `canvas.captureStream(30)`.

### Production Build (MediaPipe Shim)
MediaPipe's original library is an IIFE (not an ES module). This causes Rollup to fail during `npm run build`. The solution is a `src/lib/mediapipe_shim.js` that **exports a stub** of the `SelfieSegmentation` class, satisfying the bundler's requirements. At runtime in the browser, the real library is loaded from CDN as configured in the hook's `solutionPath`.

---

## 🌐 Deployment (Vercel)

### Steps
1. Push your code to GitHub.
2. Import the repository into [Vercel](https://vercel.com).
3. Set all **Backend Environment Variables** in the Vercel project settings.
4. Vercel will auto-detect `vercel.json` and use the correct build command.

The `vercel.json` is pre-configured to:
- Run `prisma generate` before every build to initialize the Prisma Client.
- Serve the `frontend/dist` as the static site output.
- Proxy all `/api/*` requests to the `api/index.js` serverless function.
- Rewrite all other routes to `index.html` to support React Router's client-side navigation.

### Vercel Environment Variables Required
Set all variables listed in the [Backend `.env`](#backend-backendenv) section directly in your Vercel project's **Environment Variables** settings.

---

## ⚠️ Known Considerations

- **Gemini Rate Limits**: The free tier of Gemini API has rate limits. Long, fast-paced sessions may occasionally hit these. If you encounter 429 errors, wait 60 seconds or upgrade your API plan.
- **LeetCode GraphQL**: LeetCode's public GraphQL endpoint may occasionally be rate-limited from server-side environments (Vercel). Private profiles will return `null`.
- **Virtual Background Performance**: The AI segmentation requires a modern GPU-capable device. It runs at approximately 12-20fps on mid-range laptops and may consume significant CPU/GPU.
- **In-Memory Sessions**: Interview chat sessions are stored in-memory on the backend. A server restart during an active interview will lose the session. For production scale, consider migrating to a Redis-backed store.

---

*Built to help developers nail their next big interview. Good luck, and ship great code.* 🚀
