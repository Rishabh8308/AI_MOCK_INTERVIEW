import { Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';

import Setup from './components/Setup';
import Chat from './components/Chat';
import VoiceInterview from './components/VoiceInterview';
import EvaluationReport from './components/EvaluationReport';

const API_URL =
  import.meta.env.VITE_API_URL || '';

function App() {
  const [view, setView] =
    useState('setup');

  const [sessionId, setSessionId] =
    useState(null);

  const [reportData, setReportData] =
    useState(null);

  const [firstMsg, setFirstMsg] =
    useState('');

  const [interviewType, setInterviewType] =
    useState('Technical');

  const [pressureMode, setPressureMode] =
    useState(false);

  const [assessmentMode, setAssessmentMode] =
    useState('technical');

  const [voiceRecordingMode, setVoiceRecordingMode] =
    useState('audio');

  /*
   * =========================================================
   * SCREEN SHARE STREAM
   * =========================================================
   *
   * Setup.jsx obtains this stream before entering the
   * VoiceInterview component.
   *
   * We keep the exact MediaStream here so it can be passed
   * directly to VoiceInterview.
   */

  const [screenStream, setScreenStream] =
    useState(null);

  const [theme, setTheme] =
    useState(
      localStorage.getItem('theme') ||
        'dark'
    );

  const [user, setUser] =
    useState(null);

  /*
   * =========================================================
   * THEME
   * =========================================================
   */

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

  /*
   * =========================================================
   * START NORMAL INTERVIEW
   * =========================================================
   */

  const handleStartSession = (
    sid,
    replyStr,
    targetType,
    isPressureMode
  ) => {
    /*
     * Normal interview does not use screen sharing.
     * Make sure no old voice screen stream survives.
     */

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

    setInterviewType(
      targetType
    );

    setPressureMode(
      isPressureMode
    );

    setAssessmentMode(
      'technical'
    );

    setView('chat');
  };

  /*
   * =========================================================
   * START VOICE INTERVIEW
   * =========================================================
   *
   * Setup.jsx now calls:
   *
   * onStartVoice(
   *   sessionId,
   *   reply,
   *   recordingMode,
   *   screenStream
   * )
   *
   * The fourth argument is the actual browser
   * MediaStream obtained from getDisplayMedia().
   */

  const handleStartVoiceSession = (
    sid,
    replyStr,
    selectedRecordingMode,
    selectedScreenStream
  ) => {
    console.log(
      '🎙️ Starting voice interview...'
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
      '🖥️ Received screen stream:',
      selectedScreenStream
    );

    /*
     * Verify that a video screen-share track
     * exists when video mode is selected.
     */

    if (
      selectedRecordingMode ===
        'video'
    ) {
      const videoTrack =
        selectedScreenStream?.getVideoTracks?.()[0];

      if (
        !selectedScreenStream ||
        !videoTrack ||
        videoTrack.readyState !==
          'live'
      ) {
        console.error(
          '❌ Invalid screen stream received.'
        );

        alert(
          'Screen sharing was not provided. Please restart the interview and allow screen sharing.'
        );

        return;
      }

      console.log(
        '✅ Live screen-share track received:',
        videoTrack
      );
    }

    setSessionId(sid);

    setFirstMsg(replyStr);

    setAssessmentMode(
      'voice'
    );

    setVoiceRecordingMode(
      selectedRecordingMode ||
        'audio'
    );

    /*
     * IMPORTANT:
     *
     * Store the MediaStream in App state.
     * VoiceInterview will receive this exact stream.
     */

    setScreenStream(
      selectedScreenStream ||
        null
    );

    setView('voice');
  };

  /*
   * =========================================================
   * END NORMAL INTERVIEW
   * =========================================================
   */

  const handleEndSession =
    async (
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

        /*
         * Normal interview does NOT have
         * a recording.
         */

        const recordingPath =
          null;

        const response =
          await fetch(
            `${API_URL}/api/end`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body: JSON.stringify({
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

        if (
          data.finalReport
        ) {
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

  /*
   * =========================================================
   * END VOICE INTERVIEW
   * =========================================================
   */

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

        /*
         * =====================================================
         * SEND EVERYTHING TO BACKEND
         * =====================================================
         */

        const response =
          await fetch(
            `${API_URL}/api/end`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body: JSON.stringify({
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

        if (
          data.finalReport
        ) {
          const fillerAnalysis =
            `\n\n--- 🔹 COMMUNICATION ANALYSIS ---\n` +
            `⚠️ Filler Word Count: ${totalFillers} detected. ` +
            `(Focus on reducing "um", "uh", "like" for a more professional tone.)\n`;

          setReportData(
            data.finalReport +
              fillerAnalysis
          );

          /*
           * The interview is finished.
           * The screen stream is no longer needed.
           */

          if (screenStream) {
            screenStream
              .getTracks()
              .forEach((track) => {
                try {
                  track.stop();
                } catch {}
              });

            console.log(
              '🖥️ Screen sharing stream stopped.'
            );

            setScreenStream(null);
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

  /*
   * =========================================================
   * CLEANUP SCREEN STREAM
   * =========================================================
   *
   * If the user returns to Setup or the component is
   * unmounted while a screen stream exists, stop it.
   */

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

  /*
   * =========================================================
   * UI
   * =========================================================
   */

  return (
    <Routes>
      <Route
        path="/"
        element={
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
              <div
                className="top-nav"
                style={{
                  display:
                    'flex',

                  justifyContent:
                    'flex-end',

                  padding:
                    '1rem'
                }}
              />

              {view !==
                'report' &&
                view !==
                  'voice' && (
                  <h1 className="title">
                    AI-Facilitated
                    Competency
                    Assessment
                  </h1>
                )}

              {/* =================================================
                  SETUP
                  ================================================= */}

              {view ===
                'setup' && (
                <Setup
                  onStart={
                    handleStartSession
                  }

                  onStartVoice={
                    handleStartVoiceSession
                  }
                />
              )}

              {/* =================================================
                  NORMAL INTERVIEW
                  ================================================= */}

              {view ===
                'chat' && (
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

              {/* =================================================
                  VOICE INTERVIEW
                  ================================================= */}

              {view ===
                'voice' && (
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

                  /*
                   * IMPORTANT:
                   *
                   * Pass the SAME screen stream that
                   * Setup obtained from getDisplayMedia().
                   */

                  screenStream={
                    screenStream
                  }

                  onEndInterview={
                    handleEndVoiceInterview
                  }
                />
              )}

              {/* =================================================
                  REPORT
                  ================================================= */}

              {view ===
                'report' && (
                <EvaluationReport
                  rawReport={
                    reportData
                  }

                  onRestart={() => {
                    /*
                     * Make sure any remaining screen-share
                     * stream is stopped before going back
                     * to Setup.
                     */

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
        }
      />
    </Routes>
  );
}

export default App;