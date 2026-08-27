import { useState } from 'react';
import Dropdown from './Dropdown';

const Setup = ({ onStart, onStartVoice }) => {
  const [assessmentMode, setAssessmentMode] =
    useState('technical');

  const [technicalForm, setTechnicalForm] = useState({
    role: 'Frontend Developer',
    experienceLevel: 'Mid-level',
    skills: 'React, JavaScript, CSS',
    interviewType: 'Technical',
    leetcodeUsername: '',
    githubUsername: '',
    sessionMode: 'New',
    persona: 'Friendly',
    pressureMode: false
  });

  const [voiceForm, setVoiceForm] = useState({
    role: 'Frontend Developer',
    experienceLevel: 'Mid-level',
    interviewFocus: 'General / HR',
    persona: 'Friendly',
    pressureMode: false,
    recordingMode: 'audio'
  });

  const [leetcodeData, setLeetcodeData] = useState(null);
  const [githubData, setGithubData] = useState(null);

  const [fetchingLeetcode, setFetchingLeetcode] =
    useState(false);

  const [fetchingGithub, setFetchingGithub] =
    useState(false);

  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);

  /*
   * =========================================================
   * FULLSCREEN
   * =========================================================
   *
   * Fullscreen must be requested from the user's Start button
   * gesture.
   */

  const enterFullscreen = async () => {
    if (document.fullscreenElement) {
      return true;
    }

    if (!document.documentElement.requestFullscreen) {
      alert(
        'Fullscreen is not supported by this browser. Please use a supported browser and try again.'
      );

      return false;
    }

    try {
      await document.documentElement.requestFullscreen();

      return !!document.fullscreenElement;
    } catch (err) {
      console.error(
        'Fullscreen request failed:',
        err
      );

      alert(
        'Fullscreen is required to start the interview. Please allow fullscreen and try again.'
      );

      return false;
    }
  };

  /*
   * =========================================================
   * SCREEN SHARE PREPARATION
   * =========================================================
   *
   * IMPORTANT:
   *
   * For Audio + Video interviews, screen sharing is requested
   * BEFORE fullscreen.
   *
   * Chrome can temporarily leave fullscreen while its native
   * screen/window selection dialog is open.
   *
   * After the user finishes the picker, handleVoiceSubmit()
   * requests fullscreen again.
   *
   * The resulting MediaStream is passed to VoiceInterview so
   * that VoiceInterview does not request screen sharing again.
   */

  const prepareVoiceVideoScreenShare = async () => {
    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getDisplayMedia
    ) {
      alert(
        'Screen sharing is not supported by this browser. Please use Google Chrome or Microsoft Edge.'
      );

      return null;
    }

    try {
      const screenStream =
        await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always'
          },
          audio: false
        });

      const videoTrack =
        screenStream.getVideoTracks()[0];

      if (!videoTrack) {
        throw new Error(
          'No screen-sharing video track was received.'
        );
      }

      console.log(
        '✅ Screen sharing prepared successfully.'
      );

      return screenStream;
    } catch (err) {
      console.error(
        'Screen-sharing request failed:',
        err
      );

      if (
        err.name ===
        'NotAllowedError'
      ) {
        alert(
          'Screen sharing is required for Audio + Video interviews. Please select the interview screen/window and try again.'
        );
      } else {
        alert(
          'Unable to start screen sharing: ' +
            (err.message ||
              'Unknown error.')
        );
      }

      return null;
    }
  };

  /*
   * =========================================================
   * SWITCH MODE
   * =========================================================
   */

  const toggleAssessmentMode = () => {
    if (loading) return;

    setAssessmentMode((current) =>
      current === 'technical'
        ? 'voice'
        : 'technical'
    );
  };

  /*
   * =========================================================
   * LEETCODE
   * =========================================================
   */

  const handleFetchLeetCode = async () => {
    if (!technicalForm.leetcodeUsername) return;

    setFetchingLeetcode(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/leetcode-profile/${technicalForm.leetcodeUsername}`
      );

      const data = await response.json();

      if (response.ok) {
        setLeetcodeData(data);
      } else {
        alert(
          data.error ||
            "Could not find profile. Make sure it's public."
        );

        setLeetcodeData(null);
      }
    } catch (err) {
      console.error(err);

      alert(
        'Error fetching LeetCode profile.'
      );
    } finally {
      setFetchingLeetcode(false);
    }
  };

  /*
   * =========================================================
   * GITHUB
   * =========================================================
   */

  const handleFetchGitHub = async () => {
    if (!technicalForm.githubUsername) return;

    setFetchingGithub(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/github-profile/${technicalForm.githubUsername}`
      );

      const data = await response.json();

      if (response.ok) {
        setGithubData(data);
      } else {
        alert(
          data.error ||
            'Could not find GitHub profile.'
        );

        setGithubData(null);
      }
    } catch (err) {
      console.error(err);

      alert(
        'Error fetching GitHub profile.'
      );
    } finally {
      setFetchingGithub(false);
    }
  };

  /*
   * =========================================================
   * TECHNICAL INTERVIEW
   * =========================================================
   */

  const handleTechnicalSubmit = async (e) => {
    e.preventDefault();

    const fullscreenStarted =
      await enterFullscreen();

    if (!fullscreenStarted) {
      return;
    }

    setLoading(true);

    const data = new FormData();

    Object.keys(technicalForm).forEach(
      (key) => {
        data.append(
          key,
          technicalForm[key]
        );
      }
    );

    data.append(
      'assessmentMode',
      'technical'
    );

    if (resumeFile) {
      data.append(
        'resume',
        resumeFile
      );
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/start`,
        {
          method: 'POST',
          body: data
        }
      );

      const respData =
        await response.json();

      if (response.ok) {
        onStart(
          respData.sessionId,
          respData.reply,
          technicalForm.interviewType,
          technicalForm.pressureMode
        );
      } else {
        alert(
          'Error: ' +
            (respData.error ||
              'Unable to start interview.')
        );
      }
    } catch (err) {
      console.error(
        'Technical interview start error:',
        err
      );

      alert(
        'Error connecting to backend: ' +
          err.message +
          '\n\nMake sure the backend is running and the domain is correct.'
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * =========================================================
   * VOICE INTERVIEW
   * =========================================================
   *
   * For Audio:
   *   Fullscreen → backend → VoiceInterview
   *
   * For Audio + Video:
   *   Screen-share picker
   *        ↓
   *   Screen sharing granted
   *        ↓
   *   Fullscreen requested again
   *        ↓
   *   Backend
   *        ↓
   *   VoiceInterview receives the existing screen stream
   */

  const handleVoiceSubmit = async (e) => {
    e.preventDefault();

    /*
     * Prevent double-clicks from creating multiple
     * screen-share requests / interviews.
     */
    if (loading) {
      return;
    }

    let screenStream = null;

    /*
     * =======================================================
     * VIDEO MODE
     * =======================================================
     *
     * Request screen sharing BEFORE fullscreen.
     *
     * Chrome's screen-share picker may temporarily exit
     * fullscreen. Once the picker closes, we request
     * fullscreen again below.
     */

    if (
      voiceForm.recordingMode ===
      'video'
    ) {
      screenStream =
        await prepareVoiceVideoScreenShare();

      if (!screenStream) {
        return;
      }

      /*
       * Make sure the screen-sharing track is still alive.
       */
      const screenTrack =
        screenStream.getVideoTracks()[0];

      if (
        !screenTrack ||
        screenTrack.readyState !==
          'live'
      ) {
        screenStream
          .getTracks()
          .forEach((track) => {
            try {
              track.stop();
            } catch {}
          });

        alert(
          'Screen sharing was not started successfully. Please try again.'
        );

        return;
      }
    }

    /*
     * =======================================================
     * FULLSCREEN
     * =======================================================
     *
     * This happens AFTER the Chrome screen-sharing picker.
     *
     * Therefore, even if Chrome temporarily exits fullscreen
     * while the picker is visible, we establish fullscreen
     * again before the interview starts.
     */

    const fullscreenStarted =
      await enterFullscreen();

    if (!fullscreenStarted) {
      /*
       * If fullscreen fails, stop the already-created
       * screen-sharing stream so the browser does not keep
       * sharing the user's screen.
       */

      if (screenStream) {
        screenStream
          .getTracks()
          .forEach((track) => {
            try {
              track.stop();
            } catch {}
          });
      }

      return;
    }

    setLoading(true);

    const data = new FormData();

    data.append(
      'role',
      voiceForm.role
    );

    data.append(
      'experienceLevel',
      voiceForm.experienceLevel
    );

    data.append(
      'interviewType',
      voiceForm.interviewFocus
    );

    data.append(
      'skills',
      'Communication, Verbal Reasoning, Behavioral Skills'
    );

    data.append(
      'persona',
      voiceForm.persona
    );

    data.append(
      'pressureMode',
      voiceForm.pressureMode
    );

    data.append(
      'assessmentMode',
      'voice'
    );

    data.append(
      'recordingMode',
      voiceForm.recordingMode
    );

    data.append(
      'voiceInterview',
      'true'
    );

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/start`,
        {
          method: 'POST',
          body: data
        }
      );

      const respData =
        await response.json();

      if (response.ok) {
        /*
         * IMPORTANT:
         *
         * Pass the already-approved screenStream to
         * VoiceInterview.
         *
         * VoiceInterview must use this stream instead of
         * calling getDisplayMedia() a second time.
         */
        onStartVoice(
          respData.sessionId,
          respData.reply,
          voiceForm.recordingMode,
          screenStream
        );
      } else {
        /*
         * Backend failed, so release the screen-sharing
         * permission/stream.
         */

        if (screenStream) {
          screenStream
            .getTracks()
            .forEach((track) => {
              try {
                track.stop();
              } catch {}
            });

          screenStream = null;
        }

        alert(
          'Error: ' +
            (respData.error ||
              'Unable to start voice interview.')
        );
      }
    } catch (err) {
      console.error(
        'Voice interview start error:',
        err
      );

      /*
       * Backend/network failure:
       * stop the screen stream because the interview
       * never actually started.
       */

      if (screenStream) {
        screenStream
          .getTracks()
          .forEach((track) => {
            try {
              track.stop();
            } catch {}
          });

        screenStream = null;
      }

      alert(
        'Error connecting to backend: ' +
          err.message +
          '\n\nMake sure the backend is running and the domain is correct.'
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * =========================================================
   * PRESSURE MODE
   * =========================================================
   */

  const renderToggleCard = ({
    icon,
    title,
    description,
    active,
    onClick
  }) => {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          position: 'relative',
          overflow: 'hidden',
          width: '100%',
          boxSizing: 'border-box',
          border: '1px solid',
          borderColor: active
            ? 'rgba(168, 85, 247, 0.55)'
            : 'rgba(255,255,255,0.08)',
          borderRadius: '18px',
          padding: '1rem 1.1rem',
          background: active
            ? 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(236,72,153,0.04))'
            : 'rgba(255,255,255,0.025)',
          color: '#fff',
          cursor: 'pointer',
          textAlign: 'left',
          transition:
            'border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease',
          boxShadow: active
            ? '0 0 28px rgba(168,85,247,0.08)'
            : 'none'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent:
              'space-between',
            gap: '1rem'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              minWidth: 0
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                flexShrink: 0,
                borderRadius: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                background: active
                  ? 'rgba(168,85,247,0.14)'
                  : 'rgba(255,255,255,0.05)',
                border:
                  '1px solid rgba(255,255,255,0.07)'
              }}
            >
              {icon}
            </div>

            <div
              style={{
                minWidth: 0
              }}
            >
              <div
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  marginBottom:
                    '0.25rem'
                }}
              >
                {title}
              </div>

              <div
                style={{
                  fontSize: '0.7rem',
                  color:
                    'var(--text-muted)',
                  lineHeight: 1.4
                }}
              >
                {description}
              </div>
            </div>
          </div>

          <div
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem'
            }}
          >
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: active
                  ? '#d8b4fe'
                  : 'rgba(255,255,255,0.4)',
                letterSpacing:
                  '0.05em'
              }}
            >
              {active
                ? 'ON'
                : 'OFF'}
            </span>

            <div
              style={{
                width: '42px',
                height: '23px',
                borderRadius:
                  '999px',
                padding: '3px',
                background: active
                  ? '#9333ea'
                  : 'rgba(255,255,255,0.12)'
              }}
            >
              <div
                style={{
                  width: '17px',
                  height: '17px',
                  borderRadius:
                    '50%',
                  background:
                    '#fff',
                  transform: active
                    ? 'translateX(19px)'
                    : 'translateX(0)',
                  transition:
                    'transform 0.25s ease',
                  boxShadow:
                    '0 2px 8px rgba(0,0,0,0.25)'
                }}
              />
            </div>
          </div>
        </div>
      </button>
    );
  };

  /*
   * =========================================================
   * PROFESSIONAL GENERAL / AUDIO MODE SELECTOR
   * =========================================================
   */

  const renderModeSwitch = () => {
    const isGeneral =
      assessmentMode === 'technical';

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.45rem',
          width: '100%'
        }}
      >
        <div
          style={{
            fontSize: '0.62rem',
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color:
              'rgba(255,255,255,0.45)'
          }}
        >
          Interview Mode
        </div>

        <button
          type="button"
          onClick={
            toggleAssessmentMode
          }
          disabled={loading}
          aria-label={
            isGeneral
              ? 'Switch to Audio Interview'
              : 'Switch to General Interview'
          }
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns:
              '1fr 1fr',
            alignItems: 'center',
            width: '300px',
            height: '54px',
            padding: '4px',
            border:
              '1px solid rgba(255,255,255,0.12)',
            borderRadius: '999px',
            background:
              'rgba(8,14,48,0.62)',
            backdropFilter:
              'blur(16px)',
            WebkitBackdropFilter:
              'blur(16px)',
            boxShadow:
              '0 8px 28px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.05)',
            cursor: loading
              ? 'not-allowed'
              : 'pointer',
            opacity: loading
              ? 0.55
              : 1,
            overflow: 'hidden',
            transition:
              'border-color 0.3s ease, box-shadow 0.3s ease'
          }}
        >
          <div
            style={{
              position:
                'absolute',
              top: '4px',
              bottom: '4px',
              left: isGeneral
                ? '4px'
                : 'calc(50% + 0px)',
              width:
                'calc(50% - 4px)',
              borderRadius:
                '999px',
              background:
                isGeneral
                  ? 'linear-gradient(135deg, rgba(168,85,247,0.96), rgba(236,72,153,0.88))'
                  : 'linear-gradient(135deg, rgba(56,189,248,0.92), rgba(59,130,246,0.86))',
              boxShadow:
                isGeneral
                  ? '0 4px 18px rgba(168,85,247,0.22)'
                  : '0 4px 18px rgba(56,189,248,0.20)',
              transition:
                'left 0.45s cubic-bezier(0.22,0.61,0.36,1), background 0.35s ease, box-shadow 0.35s ease',
              zIndex: 1,
              pointerEvents:
                'none'
            }}
          />

          <span
            style={{
              position:
                'relative',
              zIndex: 2,
              display: 'flex',
              alignItems:
                'center',
              justifyContent:
                'center',
              height: '100%',
              fontSize:
                '0.72rem',
              fontWeight: 800,
              letterSpacing:
                '0.045em',
              color: isGeneral
                ? '#fff'
                : 'rgba(255,255,255,0.52)',
              transition:
                'color 0.3s ease',
              whiteSpace:
                'nowrap'
            }}
          >
            GENERAL
          </span>

          <span
            style={{
              position:
                'relative',
              zIndex: 2,
              display: 'flex',
              alignItems:
                'center',
              justifyContent:
                'center',
              height: '100%',
              fontSize:
                '0.72rem',
              fontWeight: 800,
              letterSpacing:
                '0.045em',
              color: !isGeneral
                ? '#fff'
                : 'rgba(255,255,255,0.52)',
              transition:
                'color 0.3s ease',
              whiteSpace:
                'nowrap'
            }}
          >
            AUDIO
          </span>
        </button>

        <div
          style={{
            fontSize:
              '0.65rem',
            color:
              'rgba(255,255,255,0.38)',
            lineHeight: 1.3
          }}
        >
          {isGeneral
            ? 'Technical & general assessment'
            : 'Voice-based interview'}
        </div>
      </div>
    );
  };

  /*
   * =========================================================
   * CARD STYLES
   * =========================================================
   */

  const cardStyle = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '2rem',
    borderRadius: '24px',
    border:
      '1px solid rgba(56,189,248,0.22)',
    background:
      'rgba(9, 16, 55, 0.35)',
    backdropFilter:
      'blur(18px)',
    WebkitBackdropFilter:
      'blur(18px)',
    boxShadow:
      '0 0 35px rgba(56,189,248,0.12)',
    color: '#fff'
  };

  const faceBaseStyle = {
    width: '100%',
    boxSizing: 'border-box',
    backfaceVisibility:
      'hidden',
    WebkitBackfaceVisibility:
      'hidden',
    transformStyle:
      'preserve-3d',
    WebkitTransformStyle:
      'preserve-3d'
  };

  return (
    <div
      style={{
        width: '100%',
        perspective: '1800px',
        WebkitPerspective:
          '1800px'
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'grid',
          position: 'relative',
          transformStyle:
            'preserve-3d',
          WebkitTransformStyle:
            'preserve-3d',
          transition:
            'transform 0.85s cubic-bezier(0.22, 0.61, 0.36, 1)',
          WebkitTransition:
            '-webkit-transform 0.85s cubic-bezier(0.22, 0.61, 0.36, 1)',
          transform:
            assessmentMode ===
            'voice'
              ? 'rotateY(180deg)'
              : 'rotateY(0deg)',
          WebkitTransform:
            assessmentMode ===
            'voice'
              ? 'rotateY(180deg)'
              : 'rotateY(0deg)'
        }}
      >
        <div
          style={{
            ...faceBaseStyle,
            gridArea:
              '1 / 1',
            position:
              'relative',
            zIndex: 2
          }}
        >
          <div
            style={{
              ...cardStyle
            }}
          >
            <h2
              className="subtitle"
              style={{
                marginBottom:
                  '0.9rem'
              }}
            >
              Configure your advanced
              mock interview.
            </h2>

            <div
              style={{
                display: 'flex',
                justifyContent:
                  'center',
                marginBottom:
                  '1.2rem'
              }}
            >
              {renderModeSwitch()}
            </div>

            <form
              onSubmit={
                handleTechnicalSubmit
              }
            >
              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  position:
                    'relative',
                  zIndex: 10
                }}
              >
                <div
                  className="form-group"
                  style={{
                    flex: 1,
                    minWidth: 0
                  }}
                >
                  <label>
                    Job Role
                  </label>

                  <Dropdown
                    options={[
                      'Frontend Developer',
                      'Backend Developer',
                      'Full Stack Developer',
                      'Mobile Developer',
                      'Data Scientist',
                      'Machine Learning Engineer',
                      'DevOps Engineer',
                      'Product Manager',
                      'UI/UX Designer',
                      'QA Engineer',
                      'Security Engineer'
                    ]}
                    value={
                      technicalForm.role
                    }
                    onChange={(val) =>
                      setTechnicalForm({
                        ...technicalForm,
                        role: val
                      })
                    }
                  />
                </div>

                <div
                  className="form-group"
                  style={{
                    flex: 1,
                    minWidth: 0
                  }}
                >
                  <label>
                    Experience Level
                  </label>

                  <Dropdown
                    options={[
                      'Junior',
                      'Mid-level',
                      'Senior',
                      'Lead'
                    ]}
                    value={
                      technicalForm.experienceLevel
                    }
                    onChange={(val) =>
                      setTechnicalForm({
                        ...technicalForm,
                        experienceLevel:
                          val
                      })
                    }
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  position:
                    'relative',
                  zIndex: 9
                }}
              >
                <div
                  className="form-group"
                  style={{
                    flex: 1,
                    minWidth: 0
                  }}
                >
                  <label>
                    Key Skills
                  </label>

                  <input
                    type="text"
                    required
                    value={
                      technicalForm.skills
                    }
                    onChange={(e) =>
                      setTechnicalForm({
                        ...technicalForm,
                        skills:
                          e.target.value
                      })
                    }
                    placeholder="e.g. React, Node..."
                  />

                  <div className="skill-badges">
                    {[
                      'React',
                      'Node.js',
                      'Python',
                      'Java',
                      'AWS',
                      'SQL',
                      'TypeScript',
                      'System Design'
                    ].map(
                      (skill) => (
                        <span
                          key={skill}
                          className="skill-badge"
                          onClick={() => {
                            const current =
                              technicalForm.skills.trim();

                            if (
                              !current.includes(
                                skill
                              )
                            ) {
                              setTechnicalForm({
                                ...technicalForm,
                                skills:
                                  current
                                    ? `${current}, ${skill}`
                                    : skill
                              });
                            }
                          }}
                        >
                          +{skill}
                        </span>
                      )
                    )}
                  </div>
                </div>

                <div
                  className="form-group"
                  style={{
                    flex: 1,
                    minWidth: 0
                  }}
                >
                  <label>
                    Interview Type
                  </label>

                  <Dropdown
                    options={[
                      'Technical',
                      'Behavioral',
                      'Mixed'
                    ]}
                    value={
                      technicalForm.interviewType
                    }
                    onChange={(val) =>
                      setTechnicalForm({
                        ...technicalForm,
                        interviewType:
                          val
                      })
                    }
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  position:
                    'relative',
                  zIndex: 8
                }}
              >
                <div
                  className="form-group"
                  style={{
                    flex: 1,
                    minWidth: 0
                  }}
                >
                  <label>
                    LeetCode Username
                  </label>

                  <div
                    style={{
                      display:
                        'flex',
                      gap:
                        '0.5rem'
                    }}
                  >
                    <input
                      type="text"
                      value={
                        technicalForm.leetcodeUsername
                      }
                      onChange={(e) =>
                        setTechnicalForm({
                          ...technicalForm,
                          leetcodeUsername:
                            e.target.value
                        })
                      }
                      placeholder="Username"
                      style={{
                        flex: 1,
                        minWidth: 0
                      }}
                    />

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={
                        handleFetchLeetCode
                      }
                      disabled={
                        fetchingLeetcode ||
                        !technicalForm.leetcodeUsername
                      }
                      style={{
                        padding:
                          '0 1rem',
                        width:
                          'auto',
                        flexShrink:
                          0
                      }}
                    >
                      {fetchingLeetcode ? (
                        <div
                          className="spinner"
                          style={{
                            width:
                              '18px',
                            height:
                              '18px'
                          }}
                        />
                      ) : (
                        'Fetch'
                      )}
                    </button>
                  </div>

                  {leetcodeData && (
                    <div
                      className="skill-badges"
                      style={{
                        marginTop:
                          '0.5rem'
                      }}
                    >
                      <span
                        className="skill-badge"
                        style={{
                          background:
                            'rgba(34,197,94,0.1)',
                          color:
                            '#22c55e',
                          borderColor:
                            '#22c55e'
                        }}
                      >
                        Solved:{' '}
                        {leetcodeData
                          .submitStats
                          ?.acSubmissionNum
                          ?.find(
                            (s) =>
                              s.difficulty ===
                              'All'
                          )
                          ?.count ||
                          0}
                      </span>

                      <span
                        className="skill-badge"
                        style={{
                          background:
                            'rgba(168,85,247,0.1)',
                          color:
                            '#a855f7',
                          borderColor:
                            '#a855f7'
                        }}
                      >
                        Rank:{' '}
                        {leetcodeData
                          .profile
                          ?.ranking ||
                          'N/A'}
                      </span>
                    </div>
                  )}
                </div>

                <div
                  className="form-group"
                  style={{
                    flex: 1,
                    minWidth: 0
                  }}
                >
                  <label>
                    GitHub Username
                  </label>

                  <div
                    style={{
                      display:
                        'flex',
                      gap:
                        '0.5rem'
                    }}
                  >
                    <input
                      type="text"
                      value={
                        technicalForm.githubUsername
                      }
                      onChange={(e) =>
                        setTechnicalForm({
                          ...technicalForm,
                          githubUsername:
                            e.target.value
                        })
                      }
                      placeholder="Username"
                      style={{
                        flex: 1,
                        minWidth: 0
                      }}
                    />

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={
                        handleFetchGitHub
                      }
                      disabled={
                        fetchingGithub ||
                        !technicalForm.githubUsername
                      }
                      style={{
                        padding:
                          '0 1rem',
                        width:
                          'auto',
                        flexShrink:
                          0
                      }}
                    >
                      {fetchingGithub ? (
                        <div
                          className="spinner"
                          style={{
                            width:
                              '18px',
                            height:
                              '18px'
                          }}
                        />
                      ) : (
                        'Fetch'
                      )}
                    </button>
                  </div>

                  {githubData && (
                    <div
                      style={{
                        marginTop:
                          '0.8rem',
                        background:
                          'rgba(255,255,255,0.03)',
                        borderRadius:
                          '12px',
                        padding:
                          '0.8rem',
                        border:
                          '1px solid rgba(255,255,255,0.05)'
                      }}
                    >
                      <div
                        style={{
                          display:
                            'flex',
                          alignItems:
                            'center',
                          gap:
                            '0.5rem',
                          marginBottom:
                            '0.5rem'
                        }}
                      >
                        <img
                          src={
                            githubData
                              .profile
                              .avatarUrl
                          }
                          alt="avatar"
                          style={{
                            width:
                              '24px',
                            height:
                              '24px',
                            borderRadius:
                              '50%'
                          }}
                        />

                        <span
                          style={{
                            fontSize:
                              '0.85rem',
                            fontWeight:
                              600
                          }}
                        >
                          {githubData
                            .profile
                            .name ||
                            githubData
                              .profile
                              .username}
                        </span>
                      </div>

                      <div className="skill-badges">
                        {githubData
                          .repositories
                          .slice(
                            0,
                            3
                          )
                          .map(
                            (repo) => (
                              <span
                                key={
                                  repo.name
                                }
                                className="skill-badge"
                                style={{
                                  fontSize:
                                    '0.7rem',
                                  padding:
                                    '0.2rem 0.6rem',
                                  borderStyle:
                                    'dashed'
                                }}
                                title={
                                  repo.description
                                }
                              >
                                📦{' '}
                                {
                                  repo.name
                                }
                              </span>
                            )
                          )}

                        {githubData
                          .repositories
                          .length >
                          3 && (
                          <span
                            style={{
                              fontSize:
                                '0.7rem',
                              opacity:
                                0.5
                            }}
                          >
                            +
                            {githubData
                              .repositories
                              .length -
                              3}{' '}
                            more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems:
                    'center',
                  position:
                    'relative',
                  zIndex: 7
                }}
              >
                <div
                  className="form-group"
                  style={{
                    flex: 1,
                    minWidth: 0
                  }}
                >
                  <label>
                    Interviewer Persona
                  </label>

                  <Dropdown
                    options={[
                      'Friendly',
                      'Strict',
                      'Guru',
                      'FAANG Style',
                      'Startup Style',
                      'Corporate Style'
                    ]}
                    value={
                      technicalForm.persona
                    }
                    onChange={(val) =>
                      setTechnicalForm({
                        ...technicalForm,
                        persona: val
                      })
                    }
                  />
                </div>

                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    paddingTop:
                      '0.65rem'
                  }}
                >
                  {renderToggleCard({
                    icon: '🔥',
                    title:
                      'Pressure Mode',
                    description:
                      'Make the interviewer more challenging',
                    active:
                      technicalForm.pressureMode,
                    onClick: () =>
                      setTechnicalForm({
                        ...technicalForm,
                        pressureMode:
                          !technicalForm.pressureMode
                      })
                  })}
                </div>
              </div>

              <div
                className="form-group"
                style={{
                  marginTop:
                    '0.4rem'
                }}
              >
                <label>
                  Upload Resume (PDF only)
                </label>

                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) =>
                    setResumeFile(
                      e.target.files[0]
                    )
                  }
                  style={{
                    padding:
                      '0.8rem',
                    cursor:
                      'pointer'
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{
                  marginTop:
                    '1rem'
                }}
              >
                {loading ? (
                  <div className="spinner" />
                ) : (
                  'Start Interview Session'
                )}
              </button>
            </form>
          </div>
        </div>

        <div
          style={{
            ...faceBaseStyle,
            gridArea:
              '1 / 1',
            position:
              'relative',
            transform:
              'rotateY(180deg)',
            WebkitTransform:
              'rotateY(180deg)',
            zIndex: 1
          }}
        >
          <div
            style={{
              ...cardStyle,
              border:
                '1px solid rgba(168,85,247,0.28)',
              boxShadow:
                '0 0 35px rgba(168,85,247,0.12)'
            }}
          >
            <h2
              className="subtitle"
              style={{
                marginBottom:
                  '0.9rem'
              }}
            >
              Configure your advanced
              mock interview.
            </h2>

            <div
              style={{
                display: 'flex',
                justifyContent:
                  'center',
                marginBottom:
                  '1.2rem'
              }}
            >
              {renderModeSwitch()}
            </div>

            <form
              onSubmit={
                handleVoiceSubmit
              }
            >
              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  position:
                    'relative',
                  zIndex: 10
                }}
              >
                <div
                  className="form-group"
                  style={{
                    flex: 1,
                    minWidth: 0
                  }}
                >
                  <label>
                    Job Role
                  </label>

                  <Dropdown
                    options={[
                      'Frontend Developer',
                      'Backend Developer',
                      'Full Stack Developer',
                      'Mobile Developer',
                      'Data Scientist',
                      'Machine Learning Engineer',
                      'DevOps Engineer',
                      'Product Manager',
                      'UI/UX Designer',
                      'QA Engineer',
                      'Security Engineer'
                    ]}
                    value={
                      voiceForm.role
                    }
                    onChange={(val) =>
                      setVoiceForm({
                        ...voiceForm,
                        role: val
                      })
                    }
                  />
                </div>

                <div
                  className="form-group"
                  style={{
                    flex: 1,
                    minWidth: 0
                  }}
                >
                  <label>
                    Experience Level
                  </label>

                  <Dropdown
                    options={[
                      'Junior',
                      'Mid-level',
                      'Senior',
                      'Lead'
                    ]}
                    value={
                      voiceForm.experienceLevel
                    }
                    onChange={(val) =>
                      setVoiceForm({
                        ...voiceForm,
                        experienceLevel:
                          val
                      })
                    }
                  />
                </div>
              </div>

              <div
                className="form-group"
                style={{
                  position:
                    'relative',
                  zIndex: 9
                }}
              >
                <label>
                  Interview Focus
                </label>

                <Dropdown
                  options={[
                    'General / HR',
                    'Behavioral',
                    'Technical',
                    'Mixed'
                  ]}
                  value={
                    voiceForm.interviewFocus
                  }
                  onChange={(val) =>
                    setVoiceForm({
                      ...voiceForm,
                      interviewFocus:
                        val
                    })
                  }
                />
              </div>

              <div
                className="form-group"
                style={{
                  position:
                    'relative',
                  zIndex: 8
                }}
              >
                <label>
                  Interviewer Persona
                </label>

                <Dropdown
                  options={[
                    'Friendly',
                    'Strict',
                    'Professional',
                    'FAANG Style',
                    'Startup Style',
                    'Corporate Style'
                  ]}
                  value={
                    voiceForm.persona
                  }
                  onChange={(val) =>
                    setVoiceForm({
                      ...voiceForm,
                      persona: val
                    })
                  }
                />
              </div>

              <div
                className="form-group"
                style={{
                  marginTop:
                    '0.8rem'
                }}
              >
                <label>
                  Recording Mode
                </label>

                <div
                  style={{
                    display:
                      'grid',
                    gridTemplateColumns:
                      'repeat(2, minmax(0, 1fr))',
                    gap:
                      '1rem'
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setVoiceForm({
                        ...voiceForm,
                        recordingMode:
                          'audio'
                      })
                    }
                    style={{
                      position:
                        'relative',
                      minWidth:
                        0,
                      padding:
                        '1rem 1.1rem',
                      border:
                        '1px solid',
                      borderColor:
                        voiceForm.recordingMode ===
                        'audio'
                          ? 'rgba(56,189,248,0.6)'
                          : 'rgba(255,255,255,0.08)',
                      borderRadius:
                        '18px',
                      background:
                        voiceForm.recordingMode ===
                        'audio'
                          ? 'linear-gradient(135deg, rgba(56,189,248,0.12), rgba(56,189,248,0.035))'
                          : 'rgba(255,255,255,0.025)',
                      color:
                        '#fff',
                      cursor:
                        'pointer',
                      textAlign:
                        'left',
                      boxSizing:
                        'border-box',
                      transition:
                        'all 0.25s ease',
                      boxShadow:
                        voiceForm.recordingMode ===
                        'audio'
                          ? '0 0 28px rgba(56,189,248,0.08)'
                          : 'none'
                    }}
                  >
                    <div
                      style={{
                        display:
                          'flex',
                        alignItems:
                          'center',
                        gap:
                          '0.85rem',
                        minWidth:
                          0
                      }}
                    >
                      <div
                        style={{
                          width:
                            '42px',
                          height:
                            '42px',
                          flexShrink:
                            0,
                          borderRadius:
                            '13px',
                          display:
                            'flex',
                          alignItems:
                            'center',
                          justifyContent:
                            'center',
                          fontSize:
                            '1.2rem',
                          background:
                            voiceForm.recordingMode ===
                            'audio'
                              ? 'rgba(56,189,248,0.14)'
                              : 'rgba(255,255,255,0.05)',
                          border:
                            '1px solid rgba(255,255,255,0.07)'
                        }}
                      >
                        🎙️
                      </div>

                      <div
                        style={{
                          minWidth:
                            0
                        }}
                      >
                        <div
                          style={{
                            fontSize:
                              '0.9rem',
                            fontWeight:
                              700,
                            marginBottom:
                              '0.25rem'
                          }}
                        >
                          Audio Only
                        </div>

                        <div
                          style={{
                            fontSize:
                              '0.7rem',
                            color:
                              'var(--text-muted)',
                            lineHeight:
                              1.4,
                            overflowWrap:
                              'anywhere'
                          }}
                        >
                          Record your voice
                          without using
                          the camera.
                        </div>
                      </div>
                    </div>

                    {voiceForm.recordingMode ===
                      'audio' && (
                      <div
                        style={{
                          position:
                            'absolute',
                          top:
                            '1rem',
                          right:
                            '1rem',
                          fontSize:
                            '0.65rem',
                          fontWeight:
                            700,
                          color:
                            '#7dd3fc'
                        }}
                      >
                        SELECTED
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setVoiceForm({
                        ...voiceForm,
                        recordingMode:
                          'video'
                      })
                    }
                    style={{
                      position:
                        'relative',
                      minWidth:
                        0,
                      padding:
                        '1rem 1.1rem',
                      border:
                        '1px solid',
                      borderColor:
                        voiceForm.recordingMode ===
                        'video'
                          ? 'rgba(236,72,153,0.6)'
                          : 'rgba(255,255,255,0.08)',
                      borderRadius:
                        '18px',
                      background:
                        voiceForm.recordingMode ===
                        'video'
                          ? 'linear-gradient(135deg, rgba(236,72,153,0.12), rgba(168,85,247,0.035))'
                          : 'rgba(255,255,255,0.025)',
                      color:
                        '#fff',
                      cursor:
                        'pointer',
                      textAlign:
                        'left',
                      boxSizing:
                        'border-box',
                      transition:
                        'all 0.25s ease',
                      boxShadow:
                        voiceForm.recordingMode ===
                        'video'
                          ? '0 0 28px rgba(236,72,153,0.08)'
                          : 'none'
                    }}
                  >
                    <div
                      style={{
                        display:
                          'flex',
                        alignItems:
                          'center',
                        gap:
                          '0.85rem',
                        minWidth:
                          0
                      }}
                    >
                      <div
                        style={{
                          width:
                            '42px',
                          height:
                            '42px',
                          flexShrink:
                            0,
                          borderRadius:
                            '13px',
                          display:
                            'flex',
                          alignItems:
                            'center',
                          justifyContent:
                            'center',
                          fontSize:
                            '1.2rem',
                          background:
                            voiceForm.recordingMode ===
                            'video'
                              ? 'rgba(236,72,153,0.14)'
                              : 'rgba(255,255,255,0.05)',
                          border:
                            '1px solid rgba(255,255,255,0.07)'
                        }}
                      >
                        📹
                      </div>

                      <div
                        style={{
                          minWidth:
                            0
                        }}
                      >
                        <div
                          style={{
                            fontSize:
                              '0.9rem',
                            fontWeight:
                              700,
                            marginBottom:
                              '0.25rem'
                          }}
                        >
                          Audio + Video
                        </div>

                        <div
                          style={{
                            fontSize:
                              '0.7rem',
                            color:
                              'var(--text-muted)',
                            lineHeight:
                              1.4,
                            overflowWrap:
                              'anywhere'
                          }}
                        >
                          Record your voice
                          and camera during
                          the interview.
                        </div>
                      </div>
                    </div>

                    {voiceForm.recordingMode ===
                      'video' && (
                      <div
                        style={{
                          position:
                            'absolute',
                          top:
                            '1rem',
                          right:
                            '1rem',
                          fontSize:
                            '0.65rem',
                          fontWeight:
                            700,
                          color:
                            '#f9a8d4'
                        }}
                      >
                        SELECTED
                      </div>
                    )}
                  </button>
                </div>
              </div>

              <div
                style={{
                  marginTop:
                    '1rem'
                }}
              >
                {renderToggleCard({
                  icon: '🔥',
                  title:
                    'Pressure Mode',
                  description:
                    'Make the interviewer more challenging',
                  active:
                    voiceForm.pressureMode,
                  onClick: () =>
                    setVoiceForm({
                      ...voiceForm,
                      pressureMode:
                        !voiceForm.pressureMode
                    })
                })}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{
                  marginTop:
                    '1.5rem'
                }}
              >
                {loading ? (
                  <div className="spinner" />
                ) : (
                  'Start Voice Interview'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Setup;