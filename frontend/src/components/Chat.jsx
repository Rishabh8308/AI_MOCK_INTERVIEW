import { useState, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { python } from '@codemirror/lang-python';
import { useVideoRecorder } from '../hooks/useVideoRecorder';
import { supabase } from '../lib/supabaseClient';

const Chat = ({
  sessionId,
  initialMessage,
  interviewType,
  pressureMode,
  liveMode,
  onEndInterview
}) => {
  const [messages, setMessages] = useState([
    {
      text: initialMessage,
      sender: 'ai'
    }
  ]);

  const [inputVal, setInputVal] =
    useState('');

  const [codeVal, setCodeVal] =
    useState(
      '// Write your solution here...\n'
    );

  const [loading, setLoading] =
    useState(false);

  const [timeLeft, setTimeLeft] =
    useState(120);

  const [isRecording, setIsRecording] =
    useState(false);

  const [ttsEnabled, setTtsEnabled] =
    useState(liveMode);

  const [codeLanguage, setCodeLanguage] =
    useState('javascript');

  const [isEditorActive, setIsEditorActive] =
    useState(false);

  const [cheatWarning, setCheatWarning] =
    useState(false);

  const visibilityViolationCountRef =
    useRef(0);

  const wasPageHiddenRef =
    useRef(false);

  const fullscreenRequestPendingRef =
    useRef(false);

  const endingInterviewRef =
    useRef(false);

  const interviewStartedRef =
    useRef(false);

  const endInterviewRef =
    useRef(null);

  const messagesRef =
    useRef(messages);

  useEffect(() => {
    messagesRef.current =
      messages;
  }, [messages]);

  const scrollRef =
    useRef(null);

  const recognitionRef =
    useRef(null);

  const canShowEditor =
    ['Technical', 'Mixed'].includes(
      interviewType
    );

  const videoRef =
    useRef(null);

  const {
    startRecording,
    stopRecording,
    uploadRecording
  } = useVideoRecorder();

  const [stream, setStream] =
    useState(null);

  const getAuthToken = async () => {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      alert(
        'Your session has expired. Please sign in again.'
      );

      return null;
    }

    return session.access_token;
  };

  const shouldIgnoreCheatDetection =
    () => {
      if (
        endingInterviewRef.current
      ) {
        return true;
      }

      if (
        fullscreenRequestPendingRef.current
      ) {
        return true;
      }

      return false;
    };

  const handleToggleTTS = () => {
    const newState =
      !ttsEnabled;

    setTtsEnabled(newState);

    if (
      !newState &&
      window.speechSynthesis
    ) {
      window.speechSynthesis.cancel();
    } else if (
      newState &&
      window.speechSynthesis &&
      messages.length > 0 &&
      messages[
        messages.length - 1
      ].sender === 'ai'
    ) {
      speakText(
        messages[
          messages.length - 1
        ].text
      );
    }
  };

  const toggleWhiteboard = () => {
    setIsEditorActive(
      !isEditorActive
    );
  };

  useEffect(() => {
    const markPageAsAway = (
      source
    ) => {
      if (
        endingInterviewRef.current
      ) {
        return;
      }

      if (
        fullscreenRequestPendingRef.current
      ) {
        console.log(
          `ℹ️ Ignoring focus loss during fullscreen request (${source}).`
        );

        return;
      }

      if (
        !interviewStartedRef.current
      ) {
        return;
      }

      if (
        wasPageHiddenRef.current
      ) {
        return;
      }

      wasPageHiddenRef.current =
        true;

      console.log(
        `⚠️ Interview lost focus (${source}).`
      );
    };

    const processReturnToInterview =
      () => {
        if (
          endingInterviewRef.current
        ) {
          return;
        }

        if (
          !interviewStartedRef.current
        ) {
          return;
        }

        if (
          !wasPageHiddenRef.current
        ) {
          return;
        }

        if (
          document.hidden
        ) {
          return;
        }

        wasPageHiddenRef.current =
          false;

        visibilityViolationCountRef.current +=
          1;

        const violationCount =
          visibilityViolationCountRef.current;

        console.log(
          '⚠️ Tab/window/fullscreen violation:',
          violationCount
        );

        if (
          violationCount === 1
        ) {
          console.log(
            '⚠️ First violation. Showing warning.'
          );

          setCheatWarning(
            true
          );

          return;
        }

        if (
          violationCount >= 2
        ) {
          console.log(
            '🛑 Second tab/window/fullscreen violation. Ending interview.'
          );

          setCheatWarning(
            false
          );

          if (
            endInterviewRef.current
          ) {
            endInterviewRef.current();
          }
        }
      };

    const handleVisibilityChange =
      () => {
        if (
          fullscreenRequestPendingRef.current
        ) {
          console.log(
            'ℹ️ Ignoring visibilitychange during fullscreen request.'
          );

          return;
        }

        if (
          document.hidden
        ) {
          markPageAsAway(
            'visibilitychange'
          );

          return;
        }

        setTimeout(() => {
          processReturnToInterview();
        }, 100);
      };

    const handleWindowBlur =
      () => {
        if (
          shouldIgnoreCheatDetection()
        ) {
          console.log(
            'ℹ️ Ignoring window blur.'
          );

          return;
        }

        markPageAsAway(
          'window blur'
        );
      };

    const handleWindowFocus =
      () => {
        if (
          fullscreenRequestPendingRef.current
        ) {
          return;
        }

        setTimeout(() => {
          processReturnToInterview();
        }, 100);
      };

    const handleFullscreenChange =
      () => {
        if (
          fullscreenRequestPendingRef.current
        ) {
          console.log(
            'ℹ️ Ignoring fullscreenchange during fullscreen request.'
          );

          return;
        }

        if (
          !interviewStartedRef.current
        ) {
          return;
        }

        if (
          endingInterviewRef.current
        ) {
          return;
        }

        if (
          !document.fullscreenElement
        ) {
          console.log(
            '⚠️ Candidate exited fullscreen.'
          );

          markPageAsAway(
            'fullscreen exit'
          );

          setTimeout(() => {
            processReturnToInterview();
          }, 100);
        }
      };

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    );

    document.addEventListener(
      'fullscreenchange',
      handleFullscreenChange
    );

    window.addEventListener(
      'blur',
      handleWindowBlur
    );

    window.addEventListener(
      'focus',
      handleWindowFocus
    );

    return () => {
      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      );

      document.removeEventListener(
        'fullscreenchange',
        handleFullscreenChange
      );

      window.removeEventListener(
        'blur',
        handleWindowBlur
      );

      window.removeEventListener(
        'focus',
        handleWindowFocus
      );
    };
  }, []);

  useEffect(() => {
    if (!liveMode) {
      return;
    }

    async function startWebcam() {
      try {
        if (
          navigator.mediaDevices &&
          navigator.mediaDevices
            .getUserMedia
        ) {
          const s =
            await navigator.mediaDevices.getUserMedia(
              {
                video: {
                  width: 640,
                  height: 480
                },
                audio: true
              }
            );

          setStream(s);

          if (videoRef.current) {
            videoRef.current.srcObject =
              s;
          }

          startRecording(s);
        }
      } catch (err) {
        console.warn(
          'Webcam access denied or unavailable:',
          err
        );
      }
    }

    startWebcam();

    return () => {
      if (stream) {
        stream
          .getTracks()
          .forEach(
            (track) =>
              track.stop()
          );
      }
    };
  }, [liveMode]);

  useEffect(() => {
    if (!initialMessage) {
      return;
    }

    const timer =
      setTimeout(() => {
        interviewStartedRef.current =
          true;

        console.log(
          '✅ Chat interview cheat detection is active.'
        );

        if (
          !document.fullscreenElement
        ) {
          console.warn(
            '⚠️ Interview started without fullscreen active.'
          );
        }
      }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [initialMessage]);

  useEffect(() => {
    if (!liveMode) {
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition =
        new SpeechRecognition();

      recognition.continuous =
        false;

      recognition.interimResults =
        false;

      recognition.onstart =
        () =>
          setIsRecording(true);

      recognition.onresult =
        (event) => {
          const transcript =
            event.results[0][0]
              .transcript;

          setInputVal(
            (prev) =>
              prev
                ? prev +
                  ' ' +
                  transcript
                : transcript
          );
        };

      recognition.onend =
        () =>
          setIsRecording(false);

      recognition.onerror =
        () =>
          setIsRecording(false);

      recognitionRef.current =
        recognition;
    }

    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {}
    };
  }, [liveMode]);

  useEffect(() => {
    if (
      ttsEnabled &&
      messages.length > 0 &&
      messages[
        messages.length - 1
      ].sender === 'ai'
    ) {
      speakText(
        messages[
          messages.length - 1
        ].text
      );
    }
  }, [messages]);

  const speakText = (text) => {
    if (
      !window.speechSynthesis ||
      !text
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    try {
      const cleanText =
        String(text)
          .split('\n')
          .filter(
            (line) =>
              !line
                .toLowerCase()
                .includes(
                  'evaluation'
                ) &&
              !line
                .toLowerCase()
                .includes(
                  'assess'
                ) &&
              !line
                .toLowerCase()
                .includes(
                  'tip'
                )
          )
          .join(' ')
          .replace(
            /[#*`]/g,
            ''
          );

      const utterance =
        new SpeechSynthesisUtterance(
          cleanText
        );

      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      window.speechSynthesis.speak(
        utterance
      );
    } catch (err) {
      console.error(
        'Speech synthesis error:',
        err
      );
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
      } catch {
        console.error(
          'Speech recognition already started'
        );
      }
    }
  };

  const handleSend = async (e) => {
    if (e) {
      e.preventDefault();
    }

    if (
      !inputVal.trim() &&
      !codeVal.trim()
    ) {
      return;
    }

    let payloadText =
      inputVal;

    if (isEditorActive) {
      payloadText +=
        `\n\n[Candidate's Code Output:\n${codeVal}\n]`;
    }

    const newMessages = [
      ...messages,
      {
        text: payloadText,
        sender: 'user'
      }
    ];

    setMessages(
      newMessages
    );

    setInputVal('');

    setLoading(true);

    setTimeLeft(120);

    try {
      const token =
        await getAuthToken();

      if (!token) {
        setLoading(false);
        return;
      }

      const resp =
        await fetch(
          `${
            import.meta.env
              .VITE_API_URL
          }/api/chat`,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
              Authorization:
                `Bearer ${token}`
            },
            body: JSON.stringify({
              sessionId,
              message:
                payloadText
            })
          }
        );

      const data =
        await resp.json();

      if (!resp.ok) {
        throw new Error(
          data.error ||
            'Failed to communicate with AI.'
        );
      }

      if (data.reply) {
        setMessages([
          ...newMessages,
          {
            text: data.reply,
            sender: 'ai'
          }
        ]);
      }
    } catch (err) {
      console.error(
        'Chat error:',
        err
      );

      alert(
        'Error communicating with AI: ' +
          err.message
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    if (
      !pressureMode ||
      loading
    ) {
      return;
    }

    if (timeLeft <= 0) {
      handleSend();
      return;
    }

    const timer =
      setInterval(() => {
        setTimeLeft(
          (prev) =>
            prev - 1
        );
      }, 1000);

    return () =>
      clearInterval(timer);
  }, [
    timeLeft,
    pressureMode,
    loading
  ]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop =
        scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const [
    executionOutput,
    setExecutionOutput
  ] = useState('');

  const runCode = () => {
    if (
      codeLanguage !==
      'javascript'
    ) {
      setExecutionOutput(
        `Browser sandbox execution is only supported for JavaScript.\nFor ${codeLanguage}, the AI will review your code mathematically without running it.`
      );

      return;
    }

    setExecutionOutput(
      'Running...'
    );

    const originalLog =
      console.log;

    let logs = [];

    console.log = (
      ...args
    ) => {
      logs.push(
        args
          .map((arg) =>
            typeof arg ===
            'object'
              ? JSON.stringify(
                  arg
                )
              : arg
          )
          .join(' ')
      );
    };

    try {
      const func =
        new Function(codeVal);

      func();

      setExecutionOutput(
        logs.join('\n') ||
          'Code executed successfully (no output).'
      );
    } catch (err) {
      setExecutionOutput(
        `Error: ${err.message}`
      );
    } finally {
      console.log =
        originalLog;
    }
  };

  const renderAiMessage =
    (txt) => {
      if (!txt) {
        return null;
      }

      const cleanText =
        String(txt)
          .replace(
            /\*\*/g,
            ''
          )
          .replace(
            /^---+$/gm,
            ''
          )
          .trim();

      const parts =
        cleanText
          .split('\n')
          .filter(
            (line) => {
              const lower =
                line.toLowerCase();

              return (
                line.trim() !==
                  '' &&
                !lower.includes(
                  'evaluation:'
                ) &&
                !lower.includes(
                  'communication:'
                ) &&
                !lower.includes(
                  'technical depth:'
                ) &&
                !lower.includes(
                  'confidence:'
                ) &&
                !lower.includes(
                  'improvement tip:'
                )
              );
            }
          );

      return parts.map(
        (line, idx) => (
          <p
            key={idx}
            style={{
              marginBottom:
                '0.6rem'
            }}
          >
            {line.trim()}
          </p>
        )
      );
    };

  const formatTime = (
    secs
  ) => {
    const m =
      Math.floor(
        secs / 60
      );

    const s =
      secs % 60;

    return `${m}:${
      s < 10
        ? '0'
        : ''
    }${s}`;
  };

  const handleEndInterview =
    async () => {
      if (
        endingInterviewRef.current
      ) {
        return;
      }

      endingInterviewRef.current =
        true;

      setCheatWarning(
        false
      );

      setLoading(true);

      try {
        try {
          recognitionRef.current?.stop();
        } catch {}

        if (
          window.speechSynthesis
        ) {
          window.speechSynthesis.cancel();
        }

        stopRecording();

        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              1000
            )
        );

        if (liveMode) {
          await uploadRecording(
            sessionId
          );
        }

        await onEndInterview(
          messagesRef.current
        );
      } catch (err) {
        console.error(
          'Failed to end and upload recording:',
          err
        );

        await onEndInterview(
          messagesRef.current
        );
      }
    };

  endInterviewRef.current =
    handleEndInterview;

  return (
    <>
      {cheatWarning && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background:
              'rgba(0, 0, 0, 0.78)',
            display: 'flex',
            alignItems:
              'center',
            justifyContent:
              'center',
            padding:
              '1.5rem'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth:
                '500px',
              padding:
                '2rem',
              borderRadius:
                '20px',
              background:
                'rgba(15, 18, 35, 0.98)',
              border:
                '1px solid rgba(239, 68, 68, 0.45)',
              boxShadow:
                '0 25px 80px rgba(0,0,0,0.6)',
              textAlign:
                'center'
            }}
          >
            <div
              style={{
                fontSize:
                  '2rem',
                marginBottom:
                  '0.75rem'
              }}
            >
              ⚠️
            </div>

            <h2
              style={{
                color:
                  '#f8fafc',
                margin: 0,
                marginBottom:
                  '0.75rem'
              }}
            >
              Final Warning
            </h2>

            <p
              style={{
                color:
                  '#cbd5e1',
                lineHeight: 1.6,
                marginBottom:
                  '1.5rem'
              }}
            >
              You left the
              interview window.
              Please remain on
              the interview
              screen for the
              rest of the
              interview.
            </p>

            <p
              style={{
                color:
                  '#fca5a5',
                fontSize:
                  '0.85rem',
                marginBottom:
                  '1.5rem'
              }}
            >
              Leaving the
              interview window
              again will
              automatically end
              the interview.
            </p>

            <button
              type="button"
              onClick={() => {
                setCheatWarning(
                  false
                );
              }}
              style={{
                padding:
                  '0.8rem 1.8rem',
                border:
                  'none',
                borderRadius:
                  '999px',
                background:
                  'linear-gradient(135deg, #7c3aed, #ec4899)',
                color: '#fff',
                fontWeight: 700,
                cursor:
                  'pointer'
              }}
            >
              Continue Interview
            </button>
          </div>
        </div>
      )}

      <div
        className={`interview-layout ${
          isEditorActive
            ? 'split'
            : 'single'
        }`}
      >
        <div className="glass-panel chat-container">
          {liveMode && (
            <div
              className="video-proctoring-wrapper"
              style={{
                position:
                  'relative'
              }}
            >
              <div
                className="video-proctoring"
                style={{
                  borderRadius:
                    '20px',
                  overflow:
                    'hidden',
                  border:
                    '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                />
              </div>
            </div>
          )}

          {pressureMode && (
            <div className="timer-bar">
              ⏱️ Auto-Submit In:{' '}
              <span
                style={{
                  color:
                    timeLeft <
                    30
                      ? '#ef4444'
                      : '#f472b6',
                  fontWeight:
                    700
                }}
              >
                {formatTime(
                  timeLeft
                )}
              </span>
            </div>
          )}

          <div
            className="chat-history"
            ref={scrollRef}
          >
            {messages.map(
              (
                msg,
                idx
              ) => (
                <div
                  key={idx}
                  className={`message ${msg.sender}`}
                >
                  {msg.sender ===
                  'ai' ? (
                    renderAiMessage(
                      msg.text
                    )
                  ) : (
                    <div
                      style={{
                        whiteSpace:
                          'pre-wrap'
                      }}
                    >
                      {msg.text}
                    </div>
                  )}
                </div>
              )
            )}

            {loading && (
              <div className="message ai">
                <div className="spinner"></div>
              </div>
            )}
          </div>

          <form
            onSubmit={
              handleSend
            }
            className="chat-input-area"
          >
            {liveMode && (
              <div className="mic-btn-wrapper">
                <button
                  type="button"
                  onClick={
                    toggleRecording
                  }
                  className={`btn-mic ${
                    isRecording
                      ? 'listening'
                      : ''
                  }`}
                  style={{
                    cursor:
                      'pointer',
                    display:
                      'flex',
                    alignItems:
                      'center',
                    justifyContent:
                      'center'
                  }}
                >
                  🎤
                </button>

                {isRecording && (
                  <span className="voice-status">
                    Listening...
                  </span>
                )}
              </div>
            )}

            <button
              type="button"
              className="btn-toggle-tts"
              onClick={
                handleToggleTTS
              }
              title={
                ttsEnabled
                  ? 'Disable Read-Aloud'
                  : 'Enable Read-Aloud'
              }
              style={{
                cursor:
                  'pointer',
                display:
                  'flex',
                alignItems:
                  'center',
                justifyContent:
                  'center',
                width:
                  'auto',
                background:
                  'transparent',
                border:
                  'none',
                padding:
                  '0 10px',
                fontSize:
                  '1.2rem'
              }}
            >
              {ttsEnabled
                ? '🔊'
                : '🔇'}
            </button>

            {canShowEditor && (
              <button
                type="button"
                className={`btn-toggle-editor ${
                  isEditorActive
                    ? 'active'
                    : ''
                }`}
                onClick={
                  toggleWhiteboard
                }
                title="Toggle Whiteboard"
                style={{
                  cursor:
                    'pointer',
                  display:
                    'flex',
                  alignItems:
                    'center',
                  justifyContent:
                    'center',
                  width:
                    'auto',
                  background:
                    'transparent',
                  border:
                    'none',
                  padding:
                    '0 10px',
                  fontSize:
                    '1.2rem'
                }}
              >
                💻
              </button>
            )}

            <input
              type="text"
              value={inputVal}
              onChange={(e) =>
                setInputVal(
                  e.target.value
                )
              }
              placeholder={
                liveMode
                  ? 'Type or use your voice...'
                  : 'Type your response...'
              }
              disabled={loading}
            />

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width:
                  'auto'
              }}
              disabled={
                loading
              }
            >
              Send
            </button>

            <button
              type="button"
              className="btn btn-danger"
              style={{
                width:
                  'auto'
              }}
              disabled={
                loading
              }
              onClick={
                handleEndInterview
              }
            >
              {loading
                ? 'Ending...'
                : 'End Session'}
            </button>
          </form>
        </div>

        {isEditorActive && (
          <div className="glass-panel editor-container">
            <div
              style={{
                display:
                  'flex',
                justifyContent:
                  'space-between',
                alignItems:
                  'center',
                marginBottom:
                  '1rem'
              }}
            >
              <div
                style={{
                  display:
                    'flex',
                  alignItems:
                    'center',
                  gap:
                    '1rem'
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    color:
                      '#a78bfa'
                  }}
                >
                  💻 Whiteboard
                </h3>

                <select
                  value={
                    codeLanguage
                  }
                  onChange={(e) =>
                    setCodeLanguage(
                      e.target
                        .value
                    )
                  }
                  style={{
                    background:
                      'rgba(255,255,255,0.1)',
                    color:
                      'white',
                    border:
                      '1px solid rgba(255,255,255,0.2)',
                    padding:
                      '0.4rem',
                    borderRadius:
                      '8px',
                    cursor:
                      'pointer',
                    outline:
                      'none'
                  }}
                >
                  <option
                    value="javascript"
                    style={{
                      color:
                        'black'
                    }}
                  >
                    JavaScript
                  </option>

                  <option
                    value="python"
                    style={{
                      color:
                        'black'
                    }}
                  >
                    Python
                  </option>

                  <option
                    value="java"
                    style={{
                      color:
                        'black'
                    }}
                  >
                    Java
                  </option>

                  <option
                    value="cpp"
                    style={{
                      color:
                        'black'
                    }}
                  >
                    C++
                  </option>

                  <option
                    value="c"
                    style={{
                      color:
                        'black'
                    }}
                  >
                    C
                  </option>
                </select>
              </div>

              <button
                className="btn btn-primary"
                style={{
                  width:
                    'auto',
                  padding:
                    '0.5rem 1.2rem',
                  fontSize:
                    '0.85rem'
                }}
                onClick={
                  runCode
                }
              >
                ▶ Run Code
              </button>
            </div>

            <div className="codemirror-wrapper">
              <CodeMirror
                value={codeVal}
                height="50vh"
                extensions={[
                  codeLanguage ===
                  'javascript'
                    ? javascript({
                        jsx: true
                      })
                    : codeLanguage ===
                      'python'
                    ? python()
                    : codeLanguage ===
                      'java'
                    ? java()
                    : cpp()
                ]}
                theme="dark"
                onChange={(
                  value
                ) =>
                  setCodeVal(
                    value
                  )
                }
              />
            </div>

            <div className="execution-output">
              <div className="output-header">
                Console Output
              </div>

              <pre className="output-content">
                {executionOutput ||
                  '> No output yet. Click "Run Code" to see results.'}
              </pre>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Chat;