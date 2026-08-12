# 🎨 Frontend — AI Mock Interviewer

> React 19 + Vite 8 Single Page Application

This package contains the complete frontend for the AI Mock Interviewer platform. It is a highly interactive React application featuring real-time AI communication, live video processing, an in-browser code editor, and multi-mode interview simulation.

---

## 📦 Package Overview

```
frontend/
├── public/
│   └── backgrounds/          ← Static background images for Virtual Background feature
├── src/
│   ├── components/
│   │   ├── Chat.jsx          ← Primary Interview UI
│   │   ├── Setup.jsx         ← Pre-interview configuration form
│   │   ├── EvaluationReport.jsx ← Final report viewer + PDF export
│   │   ├── BackgroundSelector.jsx ← Virtual background picker
│   │   ├── Dropdown.jsx      ← Animated custom dropdown component
│   │   └── ProtectedRoute.jsx ← Auth guard wrapper
│   ├── hooks/
│   │   ├── useVirtualBackground.js ← AI body segmentation hook
│   │   └── useVideoRecorder.js     ← MediaRecorder API hook
│   ├── lib/
│   │   ├── supabaseClient.js  ← Supabase browser client (anon key)
│   │   └── mediapipe_shim.js  ← Build-time compatibility shim
│   ├── pages/
│   │   ├── AuthPage.jsx       ← Login / Register
│   │   ├── Dashboard.jsx      ← Interview history
│   │   └── InterviewDetails.jsx ← Full session transcript & scores
│   ├── App.jsx                ← Root: Router, Auth State, Session Manager
│   ├── index.css              ← Global styles (glassmorphism design system)
│   └── main.jsx               ← Vite entry point
├── vite.config.js             ← Vite config with MediaPipe alias & TF.js deps
├── eslint.config.js           ← ESLint with React Hooks rules enabled
└── package.json               ← Frontend-specific dependencies
```

---

## 🚀 Development

From the **root** directory:

```bash
# Starts both frontend (port 5173) and backend (port 5000) concurrently
npm run dev
```

Or start only the frontend:

```bash
npm run dev --prefix frontend
```

### Required Environment Variable
Create `frontend/.env`:

```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🏗️ Production Build

```bash
npm run build --prefix frontend
```

The production bundle is output to `frontend/dist/`. This is served as the static site by Vercel.

### Why It Works: The MediaPipe Shim

The `@mediapipe/selfie_segmentation` package is distributed as an IIFE script (not a proper ES module). When Vite/Rollup tries to bundle it for production, it fails with a `MISSING_EXPORT` error.

**Solution**: `src/lib/mediapipe_shim.js` provides a stub export that satisfies the bundler at build time.

```js
// vite.config.js — This alias redirects all imports to our shim
resolve: {
  alias: {
    '@mediapipe/selfie_segmentation': path.resolve(__dirname, 'src/lib/mediapipe_shim.js')
  }
}
```

At **runtime**, the real MediaPipe library is loaded from CDN via the `solutionPath` parameter in the `useVirtualBackground` hook, bypassing the bundler entirely.

---

## 🔩 Key Components

### `<Chat.jsx>` — The Interview Engine
The most complex component. Handles:
- Bidirectional chat with the backend Gemini session.
- **Speech-to-Text** via the Web Speech API (`SpeechRecognition`).
- **Text-to-Speech** for reading AI messages aloud.
- Live **webcam feed** with the optional virtual background overlay.
- **Code editor** (CodeMirror) for technical questions, with in-browser JS execution.
- Session end flow: stops recorder → 1-second flush wait → uploads video → triggers `onEndInterview`.

### `<Setup.jsx>` — Configuration
Collects all pre-interview settings: role, experience level, skills (with badge shortcuts), interview type, LeetCode/GitHub usernames with live "Fetch" buttons, interviewer persona, Pressure Mode, and Live Mode toggles. Also handles resume file upload.

### `<EvaluationReport.jsx>` — Final Report
Displays raw AI markdown feedback and provides a **multi-page PDF export** that paginates content using cursor tracking across pages.

---

## 🪝 Custom Hooks

### `useVirtualBackground(isEnabled)`

Manages the full AI background removal pipeline:

| Step | What Happens |
| :--- | :--- |
| 1. Load Model | On mount (when `isEnabled=true`), loads the MediaPipe segmentation model via CDN. |
| 2. `setBackground(url)` | Caller provides `'blur'`, a URL, or `null`. Updates rendering mode. |
| 3. `getProcessedStream(videoElement)` | Starts the animation loop. Returns a `MediaStream` captured from a `<canvas>`. |
| 4. Frame Loop | Each frame: segment → draw blurred/image BG → mask the person → composite. |
| 5. Cleanup | `cancelAnimationFrame` on unmount. |

> **Note**: Uses a `processFrameRef` pattern to avoid circular `useCallback` references in the animation loop.

### `useVideoRecorder()`

Thin wrapper around the `MediaRecorder` API:

| Method | Description |
| :--- | :--- |
| `startRecording(stream)` | Initializes `MediaRecorder` with `video/webm;codecs=vp9` (fallback to `video/webm`). |
| `stopRecording()` | Stops capture. Triggers the `onstop` handler to create a final `Blob`. |
| `uploadRecording(sessionId, token)` | POSTs the blob as `multipart/form-data` to `/api/recording/upload`. |

---

## 🎨 Design System

The application uses a **glassmorphism** design language defined in `index.css`:

- **`--glass-bg`**: Semi-transparent background with backdrop blur.
- **`--accent`**: Purple (`#a78bfa`) primary accent color.
- **`--gradient`**: Purple → Blue gradient used for buttons and titles.
- Supports **dark** and **light** themes via `[data-theme="light"]` on the `<html>` element.
- Micro-animations: `slideUp`, `fadeIn`, hover transforms on interactive elements.

---

## 🧹 Linting

```bash
npm run lint --prefix frontend
```

Configured with:
- `eslint:recommended` for general JavaScript rules.
- `react-hooks/recommended` for enforcing Hook dependency arrays.

Current status: **0 errors**, 3 minor `exhaustive-deps` warnings (intentional — adding those dependencies would cause infinite re-renders).
