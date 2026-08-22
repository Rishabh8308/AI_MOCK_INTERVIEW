import { Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';

import Setup from './components/Setup';
import Chat from './components/Chat';
import VoiceInterview from './components/VoiceInterview';
import EvaluationReport from './components/EvaluationReport';

const API_URL = import.meta.env.VITE_API_URL;

function App() {
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

  const [theme, setTheme] = useState(
    localStorage.getItem('theme') || 'dark'
  );

  const [user, setUser] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-theme',
      theme
    );

    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) =>
      prev === 'dark' ? 'light' : 'dark'
    );
  };

  const handleStartSession = (
    sid,
    replyStr,
    targetType,
    isPressureMode
  ) => {
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
    selectedRecordingMode
  ) => {
    setSessionId(sid);
    setFirstMsg(replyStr);

    setAssessmentMode('voice');

    setVoiceRecordingMode(
      selectedRecordingMode || 'audio'
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

      const userTranscript = allMessages
        .filter(
          (m) => m.sender === 'user'
        )
        .map(
          (m) => m.text.toLowerCase()
        )
        .join(' ');

      fillerWords.forEach((word) => {
        const regex = new RegExp(
          `\\b${word}\\b`,
          'g'
        );

        const matches =
          userTranscript.match(regex);

        if (matches) {
          totalFillers += matches.length;
        }
      });

      const response = await fetch(
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
              totalFillers
          })
        }
      );

      const data =
        await response.json();

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

  const handleEndVoiceInterview = async (
    voiceTranscript
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
              message.sender === 'user'
          )
          .map(
            (message) =>
              message.text.toLowerCase()
          )
          .join(' ');

      fillerWords.forEach((word) => {
        const regex = new RegExp(
          `\\b${word}\\b`,
          'g'
        );

        const matches =
          userTranscript.match(regex);

        if (matches) {
          totalFillers +=
            matches.length;
        }
      });

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

      const response = await fetch(
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
              totalFillers
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
        'Failed to generate voice evaluation:',
        error
      );

      alert(
        `Failed to generate evaluation report.\n\n${error.message}`
      );
    }
  };

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
                  ['Technical', 'Mixed'].includes(
                    interviewType
                  )
                    ? '100%'
                    : undefined,

                maxWidth:
                  view === 'chat' &&
                  ['Technical', 'Mixed'].includes(
                    interviewType
                  )
                    ? '1600px'
                    : undefined
              }}
            >
              <div
                className="top-nav"
                style={{
                  display: 'flex',
                  justifyContent:
                    'flex-end',
                  padding: '1rem'
                }}
              />

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
                  sessionId={sessionId}
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
                  sessionId={sessionId}
                  initialMessage={
                    firstMsg
                  }
                  recordingMode={
                    voiceRecordingMode
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
                  onRestart={() =>
                    setView('setup')
                  }
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