import { useState } from 'react';
import Dropdown from './Dropdown';

const Setup = ({ onStart, onStartVoice }) => {
  const [assessmentMode, setAssessmentMode] = useState('technical');

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
  const [fetchingLeetcode, setFetchingLeetcode] = useState(false);
  const [fetchingGithub, setFetchingGithub] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);

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
      alert('Error fetching LeetCode profile.');
    } finally {
      setFetchingLeetcode(false);
    }
  };

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
      alert('Error fetching GitHub profile.');
    } finally {
      setFetchingGithub(false);
    }
  };

  const handleTechnicalSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    const data = new FormData();

    Object.keys(technicalForm).forEach((key) => {
      data.append(key, technicalForm[key]);
    });

    data.append('assessmentMode', 'technical');

    if (resumeFile) {
      data.append('resume', resumeFile);
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/start`,
        {
          method: 'POST',
          body: data
        }
      );

      const respData = await response.json();

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

  const handleVoiceSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    const data = new FormData();

    data.append('role', voiceForm.role);
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
    data.append('persona', voiceForm.persona);
    data.append(
      'pressureMode',
      voiceForm.pressureMode
    );
    data.append('assessmentMode', 'voice');
    data.append(
      'recordingMode',
      voiceForm.recordingMode
    );
    data.append('voiceInterview', 'true');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/start`,
        {
          method: 'POST',
          body: data
        }
      );

      const respData = await response.json();

      if (response.ok) {
        onStartVoice(
          respData.sessionId,
          respData.reply,
          voiceForm.recordingMode
        );
      } else {
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
    onClick,
    activeType
  }) => {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`modern-toggle-card ${
          active ? 'active' : ''
        } ${activeType || ''}`}
        style={{
          position: 'relative',
          overflow: 'hidden',
          width: '100%',
          border: '1px solid',
          borderColor: active
            ? activeType === 'recording'
              ? 'rgba(56, 189, 248, 0.55)'
              : 'rgba(168, 85, 247, 0.55)'
            : 'rgba(255,255,255,0.08)',
          borderRadius: '18px',
          padding: '1rem 1.1rem',
          background: active
            ? activeType === 'recording'
              ? 'linear-gradient(135deg, rgba(56,189,248,0.12), rgba(56,189,248,0.035))'
              : 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(236,72,153,0.04))'
            : 'rgba(255,255,255,0.025)',
          color: '#fff',
          cursor: 'pointer',
          textAlign: 'left',
          transition:
            'transform 0.25s ease, border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease',
          boxShadow: active
            ? activeType === 'recording'
              ? '0 0 28px rgba(56,189,248,0.08)'
              : '0 0 28px rgba(168,85,247,0.08)'
            : 'none'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
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
                  ? activeType === 'recording'
                    ? 'rgba(56,189,248,0.14)'
                    : 'rgba(168,85,247,0.14)'
                  : 'rgba(255,255,255,0.05)',
                border:
                  '1px solid rgba(255,255,255,0.07)'
              }}
            >
              {icon}
            </div>

            <div>
              <div
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  marginBottom: '0.25rem'
                }}
              >
                {title}
              </div>

              <div
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
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
                  ? activeType === 'recording'
                    ? '#7dd3fc'
                    : '#d8b4fe'
                  : 'rgba(255,255,255,0.4)',
                letterSpacing: '0.05em'
              }}
            >
              {active ? 'ON' : 'OFF'}
            </span>

            <div
              style={{
                width: '42px',
                height: '23px',
                borderRadius: '999px',
                padding: '3px',
                background: active
                  ? activeType === 'recording'
                    ? '#0ea5e9'
                    : '#9333ea'
                  : 'rgba(255,255,255,0.12)',
                transition:
                  'background 0.25s ease'
              }}
            >
              <div
                style={{
                  width: '17px',
                  height: '17px',
                  borderRadius: '50%',
                  background: '#fff',
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

  return (
    <div
      className="glass-panel"
      style={{
        animationDelay: '0.1s'
      }}
    >
      <h2 className="subtitle">
        Configure your advanced mock interview.
      </h2>

      <div
        className="assessment-mode-section"
        style={{
          marginBottom: '2rem'
        }}
      >
        <label
          style={{
            display: 'block',
            marginBottom: '0.7rem',
            fontWeight: 600,
            fontSize: '0.85rem',
            color: '#cdd6f4',
            letterSpacing: '0.02em'
          }}
        >
          Assessment Mode
        </label>

        <div
          className="assessment-mode-toggle"
          style={{
            display: 'grid',
            gridTemplateColumns:
              '1fr 1fr',
            gap: '0.5rem',
            padding: '0.4rem',
            borderRadius: '16px',
            background:
              'rgba(0, 0, 0, 0.35)',
            border:
              '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <button
            type="button"
            onClick={() =>
              setAssessmentMode('technical')
            }
            style={{
              border: '1px solid',
              borderColor:
                assessmentMode ===
                'technical'
                  ? 'rgba(168, 85, 247, 0.8)'
                  : 'transparent',
              borderRadius: '12px',
              padding:
                '0.9rem 1rem',
              background:
                assessmentMode ===
                'technical'
                  ? 'linear-gradient(135deg, rgba(80, 23, 133, 0.8), rgba(236, 72, 153, 0.35))'
                  : 'transparent',
              color:
                assessmentMode ===
                'technical'
                  ? '#ffffff'
                  : 'var(--text-muted)',
              cursor: 'pointer',
              transition:
                'all 0.3s ease',
              fontFamily:
                'Inter, sans-serif',
              textAlign: 'left'
            }}
          >
            <div
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                marginBottom:
                  '0.25rem'
              }}
            >
              💻 Technical + General
            </div>

            <div
              style={{
                fontSize:
                  '0.75rem',
                opacity: 0.75
              }}
            >
              Text-based competency
              assessment
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              setAssessmentMode('voice')
            }
            style={{
              border: '1px solid',
              borderColor:
                assessmentMode ===
                'voice'
                  ? 'rgba(56, 189, 248, 0.8)'
                  : 'transparent',
              borderRadius: '12px',
              padding:
                '0.9rem 1rem',
              background:
                assessmentMode ===
                'voice'
                  ? 'linear-gradient(135deg, rgba(14, 116, 144, 0.65), rgba(56, 189, 248, 0.25))'
                  : 'transparent',
              color:
                assessmentMode ===
                'voice'
                  ? '#ffffff'
                  : 'var(--text-muted)',
              cursor: 'pointer',
              transition:
                'all 0.3s ease',
              fontFamily:
                'Inter, sans-serif',
              textAlign: 'left'
            }}
          >
            <div
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                marginBottom:
                  '0.25rem'
              }}
            >
              🎙️ Voice Interview
            </div>

            <div
              style={{
                fontSize:
                  '0.75rem',
                opacity: 0.75
              }}
            >
              Voice-only AI interview
            </div>
          </button>
        </div>
      </div>

      {assessmentMode ===
        'technical' && (
        <form
          onSubmit={
            handleTechnicalSubmit
          }
        >
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              position: 'relative',
              zIndex: 10
            }}
          >
            <div
              className="form-group"
              style={{ flex: 1 }}
            >
              <label>Job Role</label>

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
              style={{ flex: 1 }}
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
              position: 'relative',
              zIndex: 9
            }}
          >
            <div
              className="form-group"
              style={{ flex: 1 }}
            >
              <label>Key Skills</label>

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
                ].map((skill) => (
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
                ))}
              </div>
            </div>

            <div
              className="form-group"
              style={{ flex: 1 }}
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
              position: 'relative',
              zIndex: 8
            }}
          >
            <div
              className="form-group"
              style={{ flex: 1 }}
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
                  style={{ flex: 1 }}
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
                    width: 'auto'
                  }}
                >
                  {fetchingLeetcode ? (
                    <div
                      className="spinner"
                      style={{
                        width: '18px',
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
                        'rgba(34, 197, 94, 0.1)',
                      color:
                        '#22c55e',
                      borderColor:
                        '#22c55e'
                    }}
                  >
                    Solved:{' '}
                    {leetcodeData.submitStats?.acSubmissionNum.find(
                      (s) =>
                        s.difficulty ===
                        'All'
                    )?.count ||
                      0}
                  </span>

                  <span
                    className="skill-badge"
                    style={{
                      background:
                        'rgba(168, 85, 247, 0.1)',
                      color:
                        '#a855f7',
                      borderColor:
                        '#a855f7'
                    }}
                  >
                    Rank:{' '}
                    {leetcodeData.profile
                      ?.ranking ||
                      'N/A'}
                  </span>
                </div>
              )}
            </div>

            <div
              className="form-group"
              style={{ flex: 1 }}
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
                  style={{ flex: 1 }}
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
                    width: 'auto'
                  }}
                >
                  {fetchingGithub ? (
                    <div
                      className="spinner"
                      style={{
                        width: '18px',
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
                      gap: '0.5rem',
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
                    {githubData.repositories
                      .slice(0, 3)
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

                    {githubData.repositories
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
                        {githubData.repositories
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
              alignItems: 'center',
              position: 'relative',
              zIndex: 8
            }}
          >
            <div
              className="form-group"
              style={{ flex: 1 }}
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
                paddingTop:
                  '0.65rem'
              }}
            >
              {renderToggleCard({
                icon: '🔥',
                title: 'Pressure Mode',
                description:
                  'Make the interviewer more challenging',
                active:
                  technicalForm.pressureMode,
                activeType: 'pressure',
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
            className="form-group slide-up"
            style={{
              position:
                'relative',
              zIndex: 7
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
      )}

      {assessmentMode ===
        'voice' && (
        <form
          onSubmit={
            handleVoiceSubmit
          }
        >
          <div
            style={{
              padding:
                '1rem 1.2rem',
              marginBottom:
                '1.5rem',
              borderRadius:
                '14px',
              background:
                'rgba(56, 189, 248, 0.06)',
              border:
                '1px solid rgba(56, 189, 248, 0.15)'
            }}
          >
            <div
              style={{
                display:
                  'flex',
                alignItems:
                  'center',
                gap: '0.7rem',
                marginBottom:
                  '0.4rem'
              }}
            >
              <span
                style={{
                  fontSize:
                    '1.3rem'
                }}
              >
                🎙️
              </span>

              <strong>
                Voice-only interview
              </strong>
            </div>

            <p
              style={{
                margin: 0,
                color:
                  'var(--text-muted)',
                fontSize:
                  '0.8rem',
                lineHeight:
                  1.5
              }}
            >
              The AI interviewer and you
              communicate through voice.
              Your conversation transcript
              will not be displayed during
              the interview.
            </p>
          </div>

          <div
            style={{
              display:
                'flex',
              gap: '1rem',
              position:
                'relative',
                zIndex: 10
            }}
          >
            <div
              className="form-group"
              style={{ flex: 1 }}
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
              style={{ flex: 1 }}
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
              marginTop: '0.8rem'
            }}
          >
            <label>
              Recording Mode
            </label>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  '1fr 1fr',
                gap: '1rem'
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
                  padding:
                    '1rem 1.1rem',
                  border:
                    '1px solid',
                  borderColor:
                    voiceForm.recordingMode ===
                    'audio'
                      ? 'rgba(56, 189, 248, 0.6)'
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
                      '0.85rem'
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

                  <div>
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
                          1.4
                      }}
                    >
                      Record your voice
                      without using
                      the camera.
                    </div>
                  </div>
                </div>

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
                      voiceForm.recordingMode ===
                      'audio'
                        ? '#7dd3fc'
                        : 'rgba(255,255,255,0.4)'
                  }}
                >
                  {voiceForm.recordingMode ===
                  'audio'
                    ? 'SELECTED'
                    : ''}
                </div>
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
                  padding:
                    '1rem 1.1rem',
                  border:
                    '1px solid',
                  borderColor:
                    voiceForm.recordingMode ===
                    'video'
                      ? 'rgba(236, 72, 153, 0.6)'
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
                      '0.85rem'
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

                  <div>
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
                          1.4
                      }}
                    >
                      Record your voice
                      and camera
                      during the
                      interview.
                    </div>
                  </div>
                </div>

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
                      voiceForm.recordingMode ===
                      'video'
                        ? '#f9a8d4'
                        : 'rgba(255,255,255,0.4)'
                  }}
                >
                  {voiceForm.recordingMode ===
                  'video'
                    ? 'SELECTED'
                    : ''}
                </div>
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
              title: 'Pressure Mode',
              description:
                'Make the interviewer more challenging',
              active:
                voiceForm.pressureMode,
              activeType: 'pressure',
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
              '🎙️ Start Voice Interview'
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default Setup;