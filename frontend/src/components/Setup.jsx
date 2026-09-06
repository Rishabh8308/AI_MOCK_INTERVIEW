import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Dropdown from './Dropdown';
import JobDescriptionSelector from './JobDescriptionSelector';

const Setup = ({ onStart, onStartVoice }) => {
  const [searchParams] = useSearchParams();

  const interviewMode =
    searchParams.get('mode') === 'voice'
      ? 'voice'
      : 'normal';

  const [technicalForm, setTechnicalForm] =
    useState({
      role: 'Custom Job Description',
      jobDescription: '',
      experienceLevel: 'Mid-level',
      skills: 'React, JavaScript, CSS',
      interviewType: 'Technical',
      leetcodeUsername: '',
      githubUsername: '',
      sessionMode: 'New',
      persona: 'Friendly',
      pressureMode: false
    });

  const [voiceForm, setVoiceForm] =
    useState({
      role: 'Custom Job Description',
      jobDescription: '',
      experienceLevel: 'Mid-level',
      interviewFocus: 'General / HR',
      persona: 'Friendly',
      pressureMode: false,
      recordingMode: 'audio'
    });

  const [leetcodeData, setLeetcodeData] =
    useState(null);

  const [githubData, setGithubData] =
    useState(null);

  const [fetchingLeetcode, setFetchingLeetcode] =
    useState(false);

  const [fetchingGithub, setFetchingGithub] =
    useState(false);

  const [resumeFile, setResumeFile] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

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

  const enterFullscreen = async () => {
    if (document.fullscreenElement) {
      return true;
    }

    if (
      !document.documentElement.requestFullscreen
    ) {
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

  const prepareVoiceVideoScreenShare =
    async () => {
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
          'Screen sharing prepared successfully.'
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

  const handleJobDescriptionChange =
    ({ role, description }) => {
      if (interviewMode === 'voice') {
        setVoiceForm((current) => ({
          ...current,
          role,
          jobDescription:
            description
        }));

        return;
      }

      setTechnicalForm((current) => ({
        ...current,
        role,
        jobDescription:
          description
      }));
    };

  const handleFetchLeetCode =
    async () => {
      if (
        !technicalForm.leetcodeUsername
      ) {
        return;
      }

      setFetchingLeetcode(true);

      try {
        const token =
          await getAuthToken();

        if (!token) {
          return;
        }

        const response =
          await fetch(
            `${import.meta.env.VITE_API_URL}/api/leetcode-profile/${technicalForm.leetcodeUsername}`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          );

        const data =
          await response.json();

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

  const handleFetchGitHub =
    async () => {
      if (
        !technicalForm.githubUsername
      ) {
        return;
      }

      setFetchingGithub(true);

      try {
        const token =
          await getAuthToken();

        if (!token) {
          return;
        }

        const response =
          await fetch(
            `${import.meta.env.VITE_API_URL}/api/github-profile/${technicalForm.githubUsername}`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          );

        const data =
          await response.json();

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

  const handleTechnicalSubmit =
    async (e) => {
      e.preventDefault();

      if (
        !technicalForm.jobDescription.trim()
      ) {
        alert(
          'Please enter or select a job description before starting the interview.'
        );

        return;
      }

      const fullscreenStarted =
        await enterFullscreen();

      if (!fullscreenStarted) {
        return;
      }

      setLoading(true);

      const token =
        await getAuthToken();

      if (!token) {
        setLoading(false);

        if (
          document.fullscreenElement
        ) {
          try {
            await document.exitFullscreen();
          } catch {}
        }

        return;
      }

      const data =
        new FormData();

      Object.keys(
        technicalForm
      ).forEach((key) => {
        data.append(
          key,
          technicalForm[key]
        );
      });

      data.append(
        'assessmentMode',
        'technical'
      );

      data.append(
        'jobDescription',
        technicalForm.jobDescription
      );

      if (resumeFile) {
        data.append(
          'resume',
          resumeFile
        );
      }

      try {
        const response =
          await fetch(
            `${import.meta.env.VITE_API_URL}/api/start`,
            {
              method: 'POST',
              headers: {
                Authorization:
                  `Bearer ${token}`
              },
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

  const handleVoiceSubmit =
    async (e) => {
      e.preventDefault();

      if (loading) {
        return;
      }

      if (
        !voiceForm.jobDescription.trim()
      ) {
        alert(
          'Please enter or select a job description before starting the interview.'
        );

        return;
      }

      let screenStream = null;

      if (
        voiceForm.recordingMode ===
        'video'
      ) {
        screenStream =
          await prepareVoiceVideoScreenShare();

        if (!screenStream) {
          return;
        }

        const screenTrack =
          screenStream.getVideoTracks()[0];

        if (
          !screenTrack ||
          screenTrack.readyState !==
            'live'
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

          alert(
            'Screen sharing was not started successfully. Please try again.'
          );

          return;
        }
      }

      const fullscreenStarted =
        await enterFullscreen();

      if (!fullscreenStarted) {
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
        }

        return;
      }

      setLoading(true);

      const token =
        await getAuthToken();

      if (!token) {
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
        }

        setLoading(false);

        if (
          document.fullscreenElement
        ) {
          try {
            await document.exitFullscreen();
          } catch {}
        }

        return;
      }

      const data =
        new FormData();

      data.append(
        'role',
        voiceForm.role
      );

      data.append(
        'jobDescription',
        voiceForm.jobDescription
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
        const response =
          await fetch(
            `${import.meta.env.VITE_API_URL}/api/start`,
            {
              method: 'POST',
              headers: {
                Authorization:
                  `Bearer ${token}`
              },
              body: data
            }
          );

        const respData =
          await response.json();

        if (response.ok) {
          onStartVoice(
            respData.sessionId,
            respData.reply,
            voiceForm.recordingMode,
            screenStream
          );
        } else {
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
            ? 'rgba(22,170,168,0.45)'
            : 'rgba(255,255,255,0.08)',
          borderRadius: '18px',
          padding: '1rem 1.1rem',
          background: active
            ? 'rgba(22,170,168,0.08)'
            : 'rgba(255,255,255,0.025)',
          color: '#fff',
          cursor: 'pointer',
          textAlign: 'left',
          transition:
            'border-color 0.25s ease, background 0.25s ease',
          boxShadow: 'none'
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
                  ? 'rgba(22,170,168,0.12)'
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
                  ? '#16aaa8'
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
                  ? '#16aaa8'
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

  const renderTechnicalSetup =
    () => {
      return (
        <>
          <div className="setup-mode-heading">
            <span className="setup-mode-label">
              NORMAL INTERVIEW
            </span>

            <p>
              Configure your interview
              and practice through a
              traditional text-based
              experience.
            </p>
          </div>

          <JobDescriptionSelector
            value={
              technicalForm.role
            }
            description={
              technicalForm.jobDescription
            }
            onChange={
              handleJobDescriptionChange
            }
          />

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
                    display: 'flex',
                    gap: '0.5rem'
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
                      width: 'auto',
                      flexShrink: 0
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
                    display: 'flex',
                    gap: '0.5rem'
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
                      width: 'auto',
                      flexShrink: 0
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
                style={{
                  flex: 1,
                  minWidth: 0
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

              <div
                className="form-group"
                style={{
                  flex: 1,
                  minWidth: 0
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
        </>
      );
    };

  const renderVoiceSetup =
    () => {
      return (
        <>
          <div className="setup-mode-heading">
            <span className="setup-mode-label">
              VOICE INTERVIEW
            </span>

            <p>
              Configure your interview
              and practice through a
              natural voice-based
              experience.
            </p>
          </div>

          <JobDescriptionSelector
            value={
              voiceForm.role
            }
            description={
              voiceForm.jobDescription
            }
            onChange={
              handleJobDescriptionChange
            }
          />

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

              <div
                className="form-group"
                style={{
                  flex: 1,
                  minWidth: 0
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
                    minWidth: 0,
                    padding:
                      '1rem 1.1rem',
                    border:
                      '1px solid',
                    borderColor:
                      voiceForm.recordingMode ===
                      'audio'
                        ? 'rgba(22,170,168,0.6)'
                        : 'rgba(255,255,255,0.08)',
                    borderRadius:
                      '18px',
                    background:
                      voiceForm.recordingMode ===
                      'audio'
                        ? 'rgba(22,170,168,0.08)'
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
                      'border-color 0.25s ease, background 0.25s ease',
                    boxShadow:
                      'none'
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
                            ? 'rgba(22,170,168,0.12)'
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
                          '#16aaa8'
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
                    minWidth: 0,
                    padding:
                      '1rem 1.1rem',
                    border:
                      '1px solid',
                    borderColor:
                      voiceForm.recordingMode ===
                      'video'
                        ? 'rgba(22,170,168,0.6)'
                        : 'rgba(255,255,255,0.08)',
                    borderRadius:
                      '18px',
                    background:
                      voiceForm.recordingMode ===
                      'video'
                        ? 'rgba(22,170,168,0.08)'
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
                      'border-color 0.25s ease, background 0.25s ease',
                    boxShadow:
                      'none'
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
                            ? 'rgba(22,170,168,0.12)'
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
                          '#16aaa8'
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
        </>
      );
    };

  return (
    <div className="setup-page">
      <div
        className="setup-card"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '2rem',
          borderRadius: '24px',
          border:
            '1px solid rgba(56,189,248,0.22)',
          background:
            'rgba(9,16,55,0.35)',
          backdropFilter:
            'blur(18px)',
          WebkitBackdropFilter:
            'blur(18px)',
          color: '#fff'
        }}
      >
        {interviewMode ===
        'voice'
          ? renderVoiceSetup()
          : renderTechnicalSetup()}
      </div>
    </div>
  );
};

export default Setup;