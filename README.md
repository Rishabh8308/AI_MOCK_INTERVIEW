# AI Mock Interview Platform

An AI-powered platform that helps students and job seekers practice
interviews before attending real ones.

The idea is simple: **practice answering interview questions, review
your performance, and become more confident.** Instead of needing
another person to interview you, you can practice with an AI
interviewer.

## Table of Contents

-   [What Is This Project?](#what-is-this-project)
-   [What Can You Do With It?](#what-can-you-do-with-it)
-   [How It Works](#how-it-works)
-   [Main Sections of the App](#main-sections-of-the-app)
-   [Technologies Used](#technologies-used)
-   [How the Project Is Organized](#how-the-project-is-organized)
-   [Run the Project Locally](#run-the-project-locally)
-   [Environment Variables](#environment-variables)
-   [Deployment](#deployment)
-   [Security](#security)
-   [Who Is This Project For?](#who-is-this-project-for)

## What Is This Project?

The AI Mock Interview Platform is a web application for practicing job
interviews in a realistic, low-pressure environment.

A **mock interview** is a practice interview. It helps you prepare for a
real interview by letting you answer questions and identify areas where
you can improve.

In this project, AI helps power the interview experience. Depending on
the selected interview mode and the features enabled in the application,
users can interact with the AI through text or voice, record an
interview, and review feedback afterward.

## What Can You Do With It?

-   **Practice with an AI interviewer:** Answer interview questions
    generated or handled through the Gemini API.
-   **Try voice-based interviews:** Practice speaking your answers
    instead of only typing them.
-   **Record practice sessions:** Use audio/video recording features
    where available so you can review your interview.
-   **Review performance feedback:** Examine the feedback and results
    provided by the application after an interview.
-   **Practice coding:** Use the integrated code editor for technical
    interview practice.
-   **Track your progress:** Use the dashboard and interview history,
    where available, to review previous sessions and performance
    information.
-   **Save recordings:** The application uses Supabase Storage for
    supported recording-upload workflows.

## How It Works

A typical practice session follows this flow:

1.  **Open the application.** Start from the main page.
2.  **Choose an interview setup.** Select the available interview
    options before beginning.
3.  **Start the interview.** The application connects to its backend,
    which handles interview-related requests.
4.  **Answer the questions.** Respond using the interaction mode
    available for that session.
5.  **Complete the session.** The application processes the interview
    results and displays available feedback.
6.  **Review your performance.** Revisit the result, dashboard, or
    interview history features available in the application.

The exact steps and options may differ depending on the current version
of the project.

## Main Sections of the App

### Dashboard

The dashboard gives users a convenient place to review interview
activity and performance information. Depending on the current
implementation, this may include the total number of interviews, average
score, best score, and latest interview.

### Interview

This is the main practice area. Users participate in an AI-powered
interview and can use the interview modes and options available in the
application.

### Voice and Recording

Voice features make it possible to practice speaking answers.
Audio/video recording features can capture a practice session, and
supported uploads can be stored using Supabase Storage.

### Interview Feedback and History

Feedback helps users understand the results of a completed practice
session. The history section, where enabled, lets users revisit previous
interviews and their available results.

### Coding Practice

The coding area supports technical interview preparation through an
integrated code editor.

### About Us

The About Us section explains the purpose of the project and the
technologies used to build it.

> Note: The descriptions above explain the intended role of these
> sections. The exact data displayed and actions available depend on the
> current codebase and configuration.

## Technologies Used

  -----------------------------------------------------------------------
  Technology                          What it does
  ----------------------------------- -----------------------------------
  React                               Builds the interactive user
                                      interface in the browser.

  Vite                                Runs the frontend development
                                      server and builds the frontend for
                                      production.

  JavaScript                          Implements application behavior and
                                      frontend logic.

  CSS                                 Controls the appearance and layout
                                      of the interface.

  Node.js                             Runs the JavaScript backend outside
                                      the browser.

  Express.js                          Provides backend routes that the
                                      frontend can call.

  Gemini API                          Provides AI capabilities used by
                                      the interview experience.

  Supabase                            Supports backend services such as
                                      storage for recordings.

  GitHub API                          Supports GitHub profile-related
                                      features where configured.

  LeetCode GraphQL API                Supports LeetCode profile-related
                                      features where configured.
  -----------------------------------------------------------------------

## How the Project Is Organized

The project has a frontend and a backend.

-   **Frontend:** The part users see and interact with, including pages,
    buttons, interview screens, and dashboard components.
-   **Backend:** The server that handles API requests and connects the
    application to services such as the Gemini API and Supabase.

A simplified example of the structure is:

``` text
AI_MOCK_INTERVIEW/
├── frontend/       # React + Vite user interface
├── backend/        # Node.js + Express server
└── README.md       # Project documentation
```

The actual folder names may differ in your repository. Run the commands
below from the directories that contain the relevant `package.json`
files.

## Run the Project Locally

These steps describe the typical setup for a React/Vite frontend and an
Express backend. Check the project's `package.json` files and
environment-variable usage for the exact commands and settings in your
version.

### Prerequisites

Install:

-   [Node.js](https://nodejs.org/) (an LTS version is recommended)
-   npm (included with Node.js)
-   Git, if you want to clone the repository
-   API credentials for the services you plan to use

### 1. Get the code

If the project is hosted on GitHub, clone it:

``` bash
git clone <your-repository-url>
cd AI_MOCK_INTERVIEW
```

Replace `<your-repository-url>` with the actual repository URL.

If you already have the project files, open the project folder in your
terminal or code editor.

### 2. Set up the frontend

Open a terminal and enter the frontend directory:

``` bash
cd frontend
npm install
```

Create a `.env` file in the frontend directory if the application
requires one. For example:

``` env
VITE_API_URL=http://localhost:5000
```

`VITE_API_URL` tells the frontend where to send API requests. The
example assumes the backend runs on port `5000`; use the port configured
by your backend.

Start the frontend:

``` bash
npm run dev
```

Open the local address printed in the terminal. Vite commonly uses
`http://localhost:5173`.

### 3. Set up the backend

Open a **second terminal** and enter the backend directory from the
project root:

``` bash
cd backend
npm install
```

Create a `.env` file in the backend directory and add the credentials
required by your code. For example, a project configuration might use:

``` env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

These names are examples, not a guarantee of the exact names used by
every version of this project. Check the backend source code and
existing configuration to confirm which variables are required. Do not
copy secret keys into frontend files.

Start the backend using the command defined in the backend's
`package.json`. If a `start` script exists, this may be:

``` bash
npm start
```

If your project uses a different development script, run that script
instead.

Once both servers are running, open the frontend URL in your browser.

## Environment Variables

Environment variables let you configure API addresses and credentials
without hard-coding them into your source files.

  -----------------------------------------------------------------------
  Variable                            Purpose
  ----------------------------------- -----------------------------------
  `VITE_API_URL`                      The backend API address used by the
                                      frontend, if configured.

  `PORT`                              The port used by the Express
                                      server, if configured.

  `GEMINI_API_KEY`                    A Gemini API key, if this is the
                                      variable name used in the backend.

  `SUPABASE_URL`                      The Supabase project URL, if
                                      required by the backend.

  `SUPABASE_ANON_KEY`                 A Supabase key, if required by the
                                      backend.
  -----------------------------------------------------------------------

Only add the variables your code actually uses. If a variable is
missing, the related feature may not work.

## Deployment

The project can be deployed using separate hosting services for the
frontend and backend, depending on the repository configuration.

### Frontend on Vercel

1.  Import the repository into Vercel.
2.  Set the project root to the frontend directory if required.
3.  Configure the build command according to the frontend's
    `package.json` (commonly `npm run build`).
4.  Set the output directory to `dist` for a standard Vite build.
5.  Configure the production `VITE_API_URL` to point to your deployed
    backend.

### Backend on Render

1.  Create a Web Service connected to the repository.
2.  Set the root directory to the backend directory if required.
3.  Configure the build and start commands according to the backend's
    `package.json`.
4.  Add the required environment variables in the Render dashboard.
5.  Confirm that the frontend can reach the deployed backend and that
    CORS is configured correctly.

Deployment settings may vary depending on the repository structure and
the hosting configuration.

## Security

-   Never commit `.env` files or private API keys to GitHub.
-   Keep secret API credentials on the backend rather than exposing them
    in frontend code.
-   Configure Supabase Storage permissions carefully.
-   Validate uploaded recordings and restrict file types and sizes.
-   Configure CORS to allow requests only from the intended frontend
    origins in production.

## Who Is This Project For?

This project can be useful for:

-   Students preparing for campus placements.
-   Fresh graduates preparing for their first job.
-   Developers practicing technical interview questions.
-   Anyone who wants to practice speaking clearly and become more
    comfortable with interviews.

## Future Improvements

Possible improvements include more detailed skill-wise feedback,
additional interview categories, richer progress analytics, and improved
recording playback.

## Contributing

If you would like to improve the project, create a branch, make your
changes, test them, and open a pull request.

## License

No license has been specified in this repository documentation. Add a
`LICENSE` file if you intend to publish the project for others to reuse.
