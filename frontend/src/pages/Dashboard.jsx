import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const Dashboard = () => {
  const navigate = useNavigate();

  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  const parseScores = (report) => {
    if (!report || typeof report !== 'string') {
      return {
        overall: 0,
        communication: 0,
        technical: 0,
        confidence: 0,
        starMethod: 0
      };
    }

    const match = report.match(
      /SCORE_JSON:\s*(\{[\s\S]*?\})/
    );

    if (!match) {
      return {
        overall: 0,
        communication: 0,
        technical: 0,
        confidence: 0,
        starMethod: 0
      };
    }

    try {
      const scores = JSON.parse(match[1]);

      return {
        overall: Number(scores.overall) || 0,
        communication: Number(scores.communication) || 0,
        technical: Number(scores.technical) || 0,
        confidence: Number(scores.confidence) || 0,
        starMethod: Number(scores.starMethod) || 0
      };
    } catch {
      return {
        overall: 0,
        communication: 0,
        technical: 0,
        confidence: 0,
        starMethod: 0
      };
    }
  };

  const normalizeInterview = (interview) => {
    const scores = parseScores(interview.final_report);

    return {
      ...interview,
      scores,

      displayDate: interview.created_at
        ? new Date(interview.created_at).toLocaleDateString()
        : 'N/A',

      displayTime: interview.created_at
        ? new Date(interview.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })
        : '',

      role: interview.role || 'General Interview',

      experienceLevel:
        interview.experience_level || 'Not specified',

      interviewType:
        interview.interview_type || 'General',

      recordingMode:
        interview.recording_mode || 'normal'
    };
  };

  useEffect(() => {
    let mounted = true;

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError('');

        const {
          data: { session }
        } = await supabase.auth.getSession();

        if (!session) {
          navigate('/auth');
          return;
        }

        if (!mounted) {
          return;
        }

        setUser(session.user);

        const {
          data,
          error: queryError
        } = await supabase
          .from('AI_MOCK')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', {
            ascending: false
          });

        if (queryError) {
          throw queryError;
        }

        if (!mounted) {
          return;
        }

        const normalized = (data || []).map(
          normalizeInterview
        );

        setInterviews(normalized);
      } catch (err) {
        console.error(
          'Failed to load dashboard:',
          err
        );

        if (mounted) {
          setError(
            err.message ||
              'Failed to load your interviews.'
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboard();

    const {
      data: authListener
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (
          event === 'SIGNED_OUT' ||
          !session
        ) {
          navigate('/auth');
        }
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const scoredInterviews = useMemo(
    () =>
      interviews.filter(
        (interview) =>
          interview.scores.overall > 0
      ),
    [interviews]
  );

  const totalInterviews = interviews.length;

  const averageScore =
    scoredInterviews.length > 0
      ? Math.round(
          scoredInterviews.reduce(
            (total, interview) =>
              total + interview.scores.overall,
            0
          ) / scoredInterviews.length
        )
      : 0;

  const bestScore =
    scoredInterviews.length > 0
      ? Math.max(
          ...scoredInterviews.map(
            (interview) =>
              interview.scores.overall
          )
        )
      : 0;

  const latestInterview =
    interviews.length > 0
      ? interviews[0]
      : null;

  const previousInterview =
    interviews.length > 1
      ? interviews[1]
      : null;

  const performanceChange =
    latestInterview &&
    previousInterview &&
    latestInterview.scores.overall > 0 &&
    previousInterview.scores.overall > 0
      ? latestInterview.scores.overall -
        previousInterview.scores.overall
      : null;

  const getScoreClass = (score) => {
    if (score >= 80) {
      return '#22c55e';
    }

    if (score >= 60) {
      return '#f59e0b';
    }

    if (score > 0) {
      return '#ef4444';
    }

    return 'var(--text-muted)';
  };

  const getStatus = (interview) => {
    if (interview.final_report) {
      return 'Completed';
    }

    return 'Incomplete';
  };

  const getInitials = () => {
    const email = user?.email || '';

    return (
      email.charAt(0).toUpperCase() ||
      'U'
    );
  };

  const primaryButtonStyle = {
    width: 'auto',
    textDecoration: 'none',
    padding: '0.8rem 1.4rem',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '10px',
    border:
      '1px solid rgba(168, 85, 247, 0.35)',
    background:
      'rgba(168, 85, 247, 0.12)',
    color: '#c4b5fd',
    fontWeight: 700,
    cursor: 'pointer',
    transition:
      'background 0.2s ease, border-color 0.2s ease, transform 0.2s ease'
  };

  const secondaryButtonStyle = {
    width: 'auto',
    textDecoration: 'none',
    padding: '0.5rem 0.8rem',
    fontSize: '0.72rem',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    border:
      '1px solid rgba(255, 255, 255, 0.12)',
    background:
      'rgba(255, 255, 255, 0.05)',
    color: '#e2e8f0',
    fontWeight: 600,
    cursor: 'pointer',
    transition:
      'background 0.2s ease, border-color 0.2s ease, transform 0.2s ease'
  };

  const handlePrimaryEnter = (e) => {
    e.currentTarget.style.background =
      'rgba(168, 85, 247, 0.2)';

    e.currentTarget.style.borderColor =
      'rgba(168, 85, 247, 0.55)';

    e.currentTarget.style.transform =
      'translateY(-2px)';
  };

  const handlePrimaryLeave = (e) => {
    e.currentTarget.style.background =
      'rgba(168, 85, 247, 0.12)';

    e.currentTarget.style.borderColor =
      'rgba(168, 85, 247, 0.35)';

    e.currentTarget.style.transform =
      'translateY(0)';
  };

  const handleSecondaryEnter = (e) => {
    e.currentTarget.style.background =
      'rgba(255, 255, 255, 0.09)';

    e.currentTarget.style.borderColor =
      'rgba(255, 255, 255, 0.22)';

    e.currentTarget.style.transform =
      'translateY(-1px)';
  };

  const handleSecondaryLeave = (e) => {
    e.currentTarget.style.background =
      'rgba(255, 255, 255, 0.05)';

    e.currentTarget.style.borderColor =
      'rgba(255, 255, 255, 0.12)';

    e.currentTarget.style.transform =
      'translateY(0)';
  };

  return (
    <div
      className="dashboard-page"
      style={{
        minHeight: '100vh',
        width: '100%',
        padding: '2rem',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          maxWidth: '1250px',
          margin: '0 auto'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1.5rem',
            marginBottom: '2.5rem',
            flexWrap: 'wrap'
          }}
        >
          <div>
            <div
              style={{
                color: '#a855f7',
                fontSize: '0.7rem',
                fontWeight: 800,
                letterSpacing: '0.16em',
                marginBottom: '0.5rem'
              }}
            >
              AI MOCK INTERVIEW
            </div>

            <h1
              style={{
                margin: 0,
                fontSize:
                  'clamp(2rem, 4vw, 3rem)',
                fontWeight: 800,
                letterSpacing: '-0.03em'
              }}
            >
              Dashboard
            </h1>

            <p
              style={{
                color: 'var(--text-muted)',
                marginTop: '0.6rem',
                marginBottom: 0
              }}
            >
              Track your interview
              performance and continue
              improving.
            </p>
          </div>

          <Link
            to="/"
            style={primaryButtonStyle}
            onMouseEnter={handlePrimaryEnter}
            onMouseLeave={handlePrimaryLeave}
          >
            + Start New Interview
          </Link>
        </div>

        <div
          className="glass-panel"
          style={{
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.9rem'
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background:
                  'linear-gradient(135deg, #7c3aed, #ec4899)',
                color: '#fff',
                fontWeight: 800
              }}
            >
              {getInitials()}
            </div>

            <div>
              <div
                style={{
                  fontWeight: 700
                }}
              >
                Welcome back
              </div>

              <div
                style={{
                  color:
                    'var(--text-muted)',
                  fontSize: '0.82rem',
                  marginTop: '0.2rem'
                }}
              >
                {user?.email ||
                  'Authenticated user'}
              </div>
            </div>
          </div>

          <div
            style={{
              color: '#86efac',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#22c55e',
                boxShadow:
                  '0 0 10px rgba(34,197,94,0.8)'
              }}
            />

            Account active
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '1rem 1.2rem',
              marginBottom: '1.5rem',
              borderRadius: '14px',
              background:
                'rgba(239,68,68,0.08)',
              border:
                '1px solid rgba(239,68,68,0.2)',
              color: '#fca5a5'
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}
        >
          <div
            className="glass-panel"
            style={{
              padding: '1.5rem'
            }}
          >
            <div
              style={{
                color:
                  'var(--text-muted)',
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                marginBottom: '0.7rem'
              }}
            >
              TOTAL INTERVIEWS
            </div>

            <div
              style={{
                fontSize: '2.4rem',
                fontWeight: 800
              }}
            >
              {totalInterviews}
            </div>

            <div
              style={{
                color:
                  'var(--text-muted)',
                fontSize: '0.78rem',
                marginTop: '0.35rem'
              }}
            >
              Saved to your account
            </div>
          </div>

          <div
            className="glass-panel"
            style={{
              padding: '1.5rem'
            }}
          >
            <div
              style={{
                color:
                  'var(--text-muted)',
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                marginBottom: '0.7rem'
              }}
            >
              AVERAGE SCORE
            </div>

            <div
              style={{
                fontSize: '2.4rem',
                fontWeight: 800,
                color:
                  getScoreClass(
                    averageScore
                  )
              }}
            >
              {averageScore}%
            </div>

            <div
              style={{
                color:
                  'var(--text-muted)',
                fontSize: '0.78rem',
                marginTop: '0.35rem'
              }}
            >
              Across completed interviews
            </div>
          </div>

          <div
            className="glass-panel"
            style={{
              padding: '1.5rem'
            }}
          >
            <div
              style={{
                color:
                  'var(--text-muted)',
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                marginBottom: '0.7rem'
              }}
            >
              BEST SCORE
            </div>

            <div
              style={{
                fontSize: '2.4rem',
                fontWeight: 800,
                color:
                  getScoreClass(
                    bestScore
                  )
              }}
            >
              {bestScore}%
            </div>

            <div
              style={{
                color:
                  'var(--text-muted)',
                fontSize: '0.78rem',
                marginTop: '0.35rem'
              }}
            >
              Your highest result
            </div>
          </div>

          <div
            className="glass-panel"
            style={{
              padding: '1.5rem'
            }}
          >
            <div
              style={{
                color:
                  'var(--text-muted)',
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                marginBottom: '0.7rem'
              }}
            >
              RECENT TREND
            </div>

            <div
              style={{
                fontSize: '2.4rem',
                fontWeight: 800,
                color:
                  performanceChange ===
                  null
                    ? 'var(--text-muted)'
                    : performanceChange >= 0
                    ? '#22c55e'
                    : '#ef4444'
              }}
            >
              {performanceChange === null
                ? '—'
                : `${
                    performanceChange >= 0
                      ? '+'
                      : ''
                  }${performanceChange}`}
            </div>

            <div
              style={{
                color:
                  'var(--text-muted)',
                fontSize: '0.78rem',
                marginTop: '0.35rem'
              }}
            >
              Compared with previous interview
            </div>
          </div>
        </div>

        {latestInterview && (
          <div
            className="glass-panel"
            style={{
              padding: '1.5rem',
              marginBottom: '2rem'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                flexWrap: 'wrap',
                marginBottom: '1.25rem'
              }}
            >
              <div>
                <div
                  style={{
                    color: '#a855f7',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    letterSpacing: '0.1em',
                    marginBottom: '0.35rem'
                  }}
                >
                  LATEST INTERVIEW
                </div>

                <h2
                  style={{
                    margin: 0,
                    fontSize: '1.35rem'
                  }}
                >
                  {latestInterview.role}
                </h2>

                <div
                  style={{
                    color:
                      'var(--text-muted)',
                    fontSize: '0.8rem',
                    marginTop: '0.35rem'
                  }}
                >
                  {latestInterview.displayDate}{' '}
                  {latestInterview.displayTime}
                </div>
              </div>

              <div
                style={{
                  fontSize: '2.2rem',
                  fontWeight: 800,
                  color:
                    getScoreClass(
                      latestInterview
                        .scores
                        .overall
                    )
                }}
              >
                {latestInterview
                  .scores
                  .overall > 0
                  ? `${Math.round(
                      latestInterview
                        .scores
                        .overall
                    )}%`
                  : '—'}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '0.8rem'
              }}
            >
              <div
                style={{
                  padding: '0.9rem',
                  borderRadius: '12px',
                  background:
                    'rgba(255,255,255,0.035)',
                  border:
                    '1px solid rgba(255,255,255,0.07)'
                }}
              >
                <div
                  style={{
                    color:
                      'var(--text-muted)',
                    fontSize: '0.68rem'
                  }}
                >
                  TYPE
                </div>

                <div
                  style={{
                    marginTop: '0.3rem',
                    fontWeight: 700
                  }}
                >
                  {latestInterview
                    .interviewType}
                </div>
              </div>

              <div
                style={{
                  padding: '0.9rem',
                  borderRadius: '12px',
                  background:
                    'rgba(255,255,255,0.035)',
                  border:
                    '1px solid rgba(255,255,255,0.07)'
                }}
              >
                <div
                  style={{
                    color:
                      'var(--text-muted)',
                    fontSize: '0.68rem'
                  }}
                >
                  EXPERIENCE
                </div>

                <div
                  style={{
                    marginTop: '0.3rem',
                    fontWeight: 700
                  }}
                >
                  {latestInterview
                    .experienceLevel}
                </div>
              </div>

              <div
                style={{
                  padding: '0.9rem',
                  borderRadius: '12px',
                  background:
                    'rgba(255,255,255,0.035)',
                  border:
                    '1px solid rgba(255,255,255,0.07)'
                }}
              >
                <div
                  style={{
                    color:
                      'var(--text-muted)',
                    fontSize: '0.68rem'
                  }}
                >
                  RECORDING
                </div>

                <div
                  style={{
                    marginTop: '0.3rem',
                    fontWeight: 700
                  }}
                >
                  {latestInterview
                    .recordingMode ===
                  'voice'
                    ? 'Voice'
                    : latestInterview
                        .recordingMode ===
                      'normal'
                    ? 'Standard'
                    : latestInterview
                        .recordingMode}
                </div>
              </div>

              <div
                style={{
                  padding: '0.9rem',
                  borderRadius: '12px',
                  background:
                    'rgba(255,255,255,0.035)',
                  border:
                    '1px solid rgba(255,255,255,0.07)'
                }}
              >
                <div
                  style={{
                    color:
                      'var(--text-muted)',
                    fontSize: '0.68rem'
                  }}
                >
                  STATUS
                </div>

                <div
                  style={{
                    marginTop: '0.3rem',
                    fontWeight: 700,
                    color: '#86efac'
                  }}
                >
                  {getStatus(
                    latestInterview
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div
          className="glass-panel"
          style={{
            padding: '1.5rem'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1.5rem',
              flexWrap: 'wrap'
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.35rem'
                }}
              >
                Interview History
              </h2>

              <p
                style={{
                  color:
                    'var(--text-muted)',
                  fontSize: '0.8rem',
                  margin: '0.4rem 0 0'
                }}
              >
                Your saved interview sessions
              </p>
            </div>

            <span
              style={{
                color:
                  'var(--text-muted)',
                fontSize: '0.75rem'
              }}
            >
              {totalInterviews}{' '}
              {totalInterviews === 1
                ? 'interview'
                : 'interviews'}
            </span>
          </div>

          {loading ? (
            <div
              style={{
                padding: '4rem',
                textAlign: 'center'
              }}
            >
              <div
                className="spinner"
                style={{
                  width: '40px',
                  height: '40px',
                  margin: '0 auto'
                }}
              />

              <p
                style={{
                  color:
                    'var(--text-muted)',
                  marginTop: '1rem'
                }}
              >
                Loading your interviews...
              </p>
            </div>
          ) : interviews.length === 0 ? (
            <div
              style={{
                padding: '4rem 2rem',
                textAlign: 'center',
                border:
                  '1px dashed rgba(255,255,255,0.12)',
                borderRadius: '16px'
              }}
            >
              <div
                style={{
                  fontSize: '2.5rem',
                  marginBottom: '0.75rem'
                }}
              >
                📋
              </div>

              <h3
                style={{
                  margin: 0
                }}
              >
                No interviews yet
              </h3>

              <p
                style={{
                  color:
                    'var(--text-muted)',
                  fontSize: '0.85rem',
                  margin:
                    '0.6rem 0 1.5rem'
                }}
              >
                Complete your first
                interview and your
                evaluation will appear here.
              </p>

              <Link
                to="/"
                style={primaryButtonStyle}
                onMouseEnter={
                  handlePrimaryEnter
                }
                onMouseLeave={
                  handlePrimaryLeave
                }
              >
                Start Interview
              </Link>
            </div>
          ) : (
            <div
              style={{
                overflowX: 'auto'
              }}
            >
              <table
                style={{
                  width: '100%',
                  minWidth: '760px',
                  borderCollapse: 'collapse'
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom:
                        '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    <th
                      style={{
                        padding: '0.8rem',
                        textAlign: 'left',
                        color:
                          'var(--text-muted)',
                        fontSize: '0.68rem',
                        letterSpacing: '0.07em'
                      }}
                    >
                      DATE
                    </th>

                    <th
                      style={{
                        padding: '0.8rem',
                        textAlign: 'left',
                        color:
                          'var(--text-muted)',
                        fontSize: '0.68rem',
                        letterSpacing: '0.07em'
                      }}
                    >
                      ROLE
                    </th>

                    <th
                      style={{
                        padding: '0.8rem',
                        textAlign: 'left',
                        color:
                          'var(--text-muted)',
                        fontSize: '0.68rem',
                        letterSpacing: '0.07em'
                      }}
                    >
                      TYPE
                    </th>

                    <th
                      style={{
                        padding: '0.8rem',
                        textAlign: 'left',
                        color:
                          'var(--text-muted)',
                        fontSize: '0.68rem',
                        letterSpacing: '0.07em'
                      }}
                    >
                      EXPERIENCE
                    </th>

                    <th
                      style={{
                        padding: '0.8rem',
                        textAlign: 'left',
                        color:
                          'var(--text-muted)',
                        fontSize: '0.68rem',
                        letterSpacing: '0.07em'
                      }}
                    >
                      SCORE
                    </th>

                    <th
                      style={{
                        padding: '0.8rem',
                        textAlign: 'left',
                        color:
                          'var(--text-muted)',
                        fontSize: '0.68rem',
                        letterSpacing: '0.07em'
                      }}
                    >
                      STATUS
                    </th>

                    <th
                      style={{
                        padding: '0.8rem',
                        textAlign: 'right',
                        color:
                          'var(--text-muted)',
                        fontSize: '0.68rem',
                        letterSpacing: '0.07em'
                      }}
                    >
                      ACTION
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {interviews.map(
                    (interview) => (
                      <tr
                        key={interview.id}
                        style={{
                          borderBottom:
                            '1px solid rgba(255,255,255,0.055)'
                        }}
                      >
                        <td
                          style={{
                            padding:
                              '1rem 0.8rem',
                            fontSize: '0.8rem',
                            whiteSpace:
                              'nowrap'
                          }}
                        >
                          <div>
                            {
                              interview.displayDate
                            }
                          </div>

                          <div
                            style={{
                              color:
                                'var(--text-muted)',
                              fontSize: '0.7rem',
                              marginTop: '0.2rem'
                            }}
                          >
                            {
                              interview.displayTime
                            }
                          </div>
                        </td>

                        <td
                          style={{
                            padding:
                              '1rem 0.8rem',
                            fontWeight: 700
                          }}
                        >
                          {interview.role}
                        </td>

                        <td
                          style={{
                            padding:
                              '1rem 0.8rem',
                            color:
                              'var(--text-muted)',
                            fontSize: '0.8rem'
                          }}
                        >
                          {
                            interview.interviewType
                          }
                        </td>

                        <td
                          style={{
                            padding:
                              '1rem 0.8rem',
                            color:
                              'var(--text-muted)',
                            fontSize: '0.8rem'
                          }}
                        >
                          {
                            interview.experienceLevel
                          }
                        </td>

                        <td
                          style={{
                            padding:
                              '1rem 0.8rem',
                            fontWeight: 800,
                            color:
                              getScoreClass(
                                interview
                                  .scores
                                  .overall
                              )
                          }}
                        >
                          {interview
                            .scores
                            .overall > 0
                            ? `${Math.round(
                                interview
                                  .scores
                                  .overall
                              )}%`
                            : '—'}
                        </td>

                        <td
                          style={{
                            padding:
                              '1rem 0.8rem'
                          }}
                        >
                          <span
                            style={{
                              display:
                                'inline-flex',
                              alignItems:
                                'center',
                              padding:
                                '0.3rem 0.6rem',
                              borderRadius:
                                '999px',
                              background:
                                'rgba(34,197,94,0.08)',
                              border:
                                '1px solid rgba(34,197,94,0.16)',
                              color: '#86efac',
                              fontSize:
                                '0.68rem',
                              fontWeight: 700
                            }}
                          >
                            {getStatus(
                              interview
                            )}
                          </span>
                        </td>

                        <td
                          style={{
                            padding:
                              '1rem 0.8rem',
                            textAlign: 'right'
                          }}
                        >
                          <Link
                            to={`/dashboard/interview-mode/${interview.id}`}
                            style={
                              secondaryButtonStyle
                            }
                            onMouseEnter={
                              handleSecondaryEnter
                            }
                            onMouseLeave={
                              handleSecondaryLeave
                            }
                          >
                            View Report
                          </Link>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;