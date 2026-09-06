import { Routes, Route, useNavigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import ProtectedRoute from './components/ProtectedRoute';
import { supabase } from './lib/supabaseClient';
import { useState, useEffect } from 'react';

import Setup from './components/Setup';
import Chat from './components/Chat';
import VoiceInterview from './components/VoiceInterview';
import EvaluationReport from './components/EvaluationReport';
import Dashboard from './pages/Dashboard';
import StartJourney from './pages/StartJourney';
import AboutUs from './pages/AboutUs';
import InterviewMode from './pages/InterviewMode';

const API_URL =
  import.meta.env.VITE_API_URL || '';

function App() {
  const navigate = useNavigate();

  const [view, setView] = useState('setup');
  const [sessionId, setSessionId] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [firstMsg, setFirstMsg] = useState('');
  const [interviewType, setInterviewType] =
    useState('Technical');
  const [pressureMode, setPressureMode] =
    useState(false);
  const [assessmentMode, setAssessmentMode] =
    useState('technical');
  const [voiceRecordingMode, setVoiceRecordingMode] =
    useState('audio');
  const [screenStream, setScreenStream] =
    useState(null);

  const [theme, setTheme] = useState(
    localStorage.getItem('theme') || 'dark'
  );

  const getAuthToken = async () => {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      alert(
        'Your session has expired. Please sign in again.'
      );

      navigate('/auth');

      return null;
    }

    return session.access_token;
  };

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-theme',
      theme
    );

    localStorage.setItem(
      'theme',
      theme
    );
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) =>
      prev === 'dark'
        ? 'light'
        : 'dark'
    );
  };

  const handleStartSession = (
    sid,
    replyStr,
    targetType,
    isPressureMode
  ) => {
    if (screenStream) {
      screenStream
        .getTracks()
        .forEach((track) => {
          try {
            track.stop();
          } catch {}
        });

      setScreenStream(null);
    }

    setSessionId(sid);
    setFirstMsg(replyStr);
    setInterviewType(targetType);
    setPressureMode(isPressureMode);
    setAssessmentMode('technical');
    setView('chat');
  };

  const handleStartVoiceSession = (
    sid,
    replyStr,
    selectedRecordingMode,
    selectedScreenStream
  ) => {
    console.log(
      'Starting voice interview...'
    );

    console.log(
      'Session ID:',
      sid
    );

    console.log(
      'Recording mode:',
      selectedRecordingMode
    );

    console.log(
      'Received screen stream:',
      selectedScreenStream
    );

    if (
      selectedRecordingMode ===
      'video'
    ) {
      const videoTrack =
        selectedScreenStream
          ?.getVideoTracks?.()[0];

      if (
        !selectedScreenStream ||
        !videoTrack ||
        videoTrack.readyState !==
          'live'
      ) {
        console.error(
          'Invalid screen stream received.'
        );

        alert(
          'Screen sharing was not provided. Please restart the interview and allow screen sharing.'
        );

        return;
      }

      console.log(
        'Live screen-share track received:',
        videoTrack
      );
    }

    setSessionId(sid);
    setFirstMsg(replyStr);
    setAssessmentMode('voice');

    setVoiceRecordingMode(
      selectedRecordingMode ||
        'audio'
    );

    setScreenStream(
      selectedScreenStream ||
        null
    );

    setView('voice');
  };

  const handleEndSession = async (
    allMessages
  ) => {
    try {
      const fillerWords = [
        'um',
        'uh',
        'like',
        'actually',
        'basically',
        'so'
      ];

      let totalFillers = 0;

      const userTranscript =
        allMessages
          .filter(
            (m) =>
              m.sender ===
              'user'
          )
          .map(
            (m) =>
              m.text.toLowerCase()
          )
          .join(' ');

      fillerWords.forEach(
        (word) => {
          const regex =
            new RegExp(
              `\\b${word}\\b`,
              'g'
            );

          const matches =
            userTranscript.match(
              regex
            );

          if (matches) {
            totalFillers +=
              matches.length;
          }
        }
      );

      console.log(
        'Ending normal interview...'
      );

      console.log(
        'Session ID:',
        sessionId
      );

      console.log(
        'Filler words:',
        totalFillers
      );

      const recordingPath =
        null;

      const token =
        await getAuthToken();

      if (!token) {
        return;
      }

      const response =
        await fetch(
          `${API_URL}/api/end`,
          {
            method:
              'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`
            },

            body:
              JSON.stringify({
                sessionId,
                fillerWordsCount:
                  totalFillers,
                recordingPath
              })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Failed to generate evaluation report.'
        );
      }

      if (data.finalReport) {
        const fillerAnalysis =
          `\n\n--- 🔹 COMMUNICATION ANALYSIS ---\n` +
          `⚠️ Filler Word Count: ${totalFillers} detected. ` +
          `(Focus on reducing "um", "uh", "like" for a more professional tone.)\n`;

        setReportData(
          data.finalReport +
            fillerAnalysis
        );

        setView('report');
      } else {
        throw new Error(
          'The backend did not return a final report.'
        );
      }
    } catch (error) {
      console.error(
        'Failed to end session',
        error
      );

      alert(
        'Failed to generate report. Is your backend running?'
      );
    }
  };

  const handleEndVoiceInterview =
    async (
      voiceTranscript,
      recordingPath = null
    ) => {
      try {
        const fillerWords = [
          'um',
          'uh',
          'like',
          'actually',
          'basically',
          'so'
        ];

        let totalFillers = 0;

        const userTranscript =
          voiceTranscript
            .filter(
              (message) =>
                message.sender ===
                'user'
            )
            .map(
              (message) =>
                message.text.toLowerCase()
            )
            .join(' ');

        fillerWords.forEach(
          (word) => {
            const regex =
              new RegExp(
                `\\b${word}\\b`,
                'g'
              );

            const matches =
              userTranscript.match(
                regex
              );

            if (matches) {
              totalFillers +=
                matches.length;
            }
          }
        );

        console.log(
          'Ending voice interview...'
        );

        console.log(
          'Session ID:',
          sessionId
        );

        console.log(
          'Voice transcript:',
          voiceTranscript
        );

        console.log(
          'Filler words:',
          totalFillers
        );

        console.log(
          'Recording path:',
          recordingPath
        );

        const token =
          await getAuthToken();

        if (!token) {
          return;
        }

        const response =
          await fetch(
            `${API_URL}/api/end`,
            {
              method:
                'POST',

              headers: {
                'Content-Type':
                  'application/json',

                Authorization:
                  `Bearer ${token}`
              },

              body:
                JSON.stringify({
                  sessionId,
                  fillerWordsCount:
                    totalFillers,
                  recordingPath:
                    recordingPath ||
                    null
                })
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              'Failed to generate evaluation report.'
          );
        }

        if (data.finalReport) {
          const fillerAnalysis =
            `\n\n--- 🔹 COMMUNICATION ANALYSIS ---\n` +
            `⚠️ Filler Word Count: ${totalFillers} detected. ` +
            `(Focus on reducing "um", "uh", "like" for a more professional tone.)\n`;

          setReportData(
            data.finalReport +
              fillerAnalysis
          );

          if (screenStream) {
            screenStream
              .getTracks()
              .forEach(
                (track) => {
                  try {
                    track.stop();
                  } catch {}
                }
              );

            console.log(
              'Screen sharing stream stopped.'
            );

            setScreenStream(
              null
            );
          }

          setView('report');
        } else {
          throw new Error(
            'The backend did not return a final report.'
          );
        }
      } catch (error) {
        console.error(
          'Failed to generate voice evaluation:',
          error
        );

        alert(
          `Failed to generate evaluation report.\n\n${error.message}`
        );
      }
    };

  useEffect(() => {
    return () => {
      if (screenStream) {
        screenStream
          .getTracks()
          .forEach((track) => {
            try {
              track.stop();
            } catch {}
          });
      }
    };
  }, []);

  const isInterviewActive =
    view === 'chat' ||
    view === 'voice';

  return (
    <Routes>
      <Route
        path="/"
        element={
          <StartJourney />
        }
      />

      <Route
        path="/auth"
        element={
          <AuthPage />
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/about"
        element={
          <AboutUs />
        }
      />

      <Route
        path="/interview-mode"
        element={
          <ProtectedRoute>
            <InterviewMode />
          </ProtectedRoute>
        }
      />

      <Route
        path="/interview"
        element={
          <ProtectedRoute>
            <>
              <video
                className="background-video"
                src="/background.mp4"
                autoPlay
                muted
                loop
                playsInline
              />

              <div className="video-overlay"></div>

              <div
                className="app-wrapper"
                style={{
                  width:
                    view === 'chat' &&
                    [
                      'Technical',
                      'Mixed'
                    ].includes(
                      interviewType
                    )
                      ? '100%'
                      : undefined,

                  maxWidth:
                    view === 'chat' &&
                    [
                      'Technical',
                      'Mixed'
                    ].includes(
                      interviewType
                    )
                      ? '1600px'
                      : undefined
                }}
              >
                {!isInterviewActive && (
                  <div className="top-nav">
                    <button
                      type="button"
                      className="home-button"
                      onClick={() =>
                        navigate(-1)
                      }
                      aria-label="Go Back"
                      title="Back"
                    >
                      <svg
  viewBox="0 0 24 24"
  aria-hidden="true"
>
  <path
    d="M19 12H5"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
  />
  <path
    d="M10 7l-5 5 5 5"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
</svg>
                    </button>
                  </div>
                )}

                {view !== 'report' &&
                  view !== 'voice' && (
                    <h1 className="title">
                      AI-Facilitated
                      Competency
                      Assessment
                    </h1>
                  )}

                {view === 'setup' && (
                  <Setup
                    onStart={
                      handleStartSession
                    }
                    onStartVoice={
                      handleStartVoiceSession
                    }
                  />
                )}

                {view === 'chat' && (
                  <Chat
                    sessionId={
                      sessionId
                    }
                    initialMessage={
                      firstMsg
                    }
                    interviewType={
                      interviewType
                    }
                    pressureMode={
                      pressureMode
                    }
                    onEndInterview={
                      handleEndSession
                    }
                  />
                )}

                {view === 'voice' && (
                  <VoiceInterview
                    sessionId={
                      sessionId
                    }
                    initialMessage={
                      firstMsg
                    }
                    recordingMode={
                      voiceRecordingMode
                    }
                    screenStream={
                      screenStream
                    }
                    onEndInterview={
                      handleEndVoiceInterview
                    }
                  />
                )}

                {view === 'report' && (
                  <EvaluationReport
                    rawReport={
                      reportData
                    }
                    onRestart={() => {
                      if (
                        screenStream
                      ) {
                        screenStream
                          .getTracks()
                          .forEach(
                            (track) => {
                              try {
                                track.stop();
                              } catch {}
                            }
                          );

                        setScreenStream(
                          null
                        );
                      }

                      setSessionId(
                        null
                      );

                      setFirstMsg(
                        ''
                      );

                      setReportData(
                        null
                      );

                      setView(
                        'setup'
                      );
                    }}
                  />
                )}
              </div>
            </>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;