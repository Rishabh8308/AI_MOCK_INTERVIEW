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
    const emptyScores = {
      overall: 0,
      communication: 0,
      technical: 0,
      confidence: 0,
      starMethod: 0
    };

    if (!report || typeof report !== 'string') {
      return emptyScores;
    }

    const match = report.match(
      /SCORE_JSON:\s*(\{[\s\S]*?\})/
    );

    if (!match) {
      return emptyScores;
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
      return emptyScores;
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

  const skillPerformance = useMemo(() => {
    const skills = [
      {
        key: 'technical',
        label: 'Technical'
      },
      {
        key: 'communication',
        label: 'Communication'
      },
      {
        key: 'confidence',
        label: 'Confidence'
      },
      {
        key: 'starMethod',
        label: 'STAR Method'
      }
    ];

    return skills.map((skill) => {
      const validInterviews =
        scoredInterviews.filter(
          (interview) =>
            interview.scores[skill.key] > 0
        );

      const average =
        validInterviews.length > 0
          ? Math.round(
              validInterviews.reduce(
                (total, interview) =>
                  total +
                  interview.scores[
                    skill.key
                  ],
                0
              ) / validInterviews.length
            )
          : 0;

      return {
        ...skill,
        average
      };
    });
  }, [scoredInterviews]);

  const strongestSkill = useMemo(() => {
    const availableSkills =
      skillPerformance.filter(
        (skill) => skill.average > 0
      );

    if (availableSkills.length === 0) {
      return null;
    }

    return availableSkills.reduce(
      (best, skill) =>
        skill.average > best.average
          ? skill
          : best
    );
  }, [skillPerformance]);

  const weakestSkill = useMemo(() => {
    const availableSkills =
      skillPerformance.filter(
        (skill) => skill.average > 0
      );

    if (availableSkills.length === 0) {
      return null;
    }

    return availableSkills.reduce(
      (weakest, skill) =>
        skill.average < weakest.average
          ? skill
          : weakest
    );
  }, [skillPerformance]);

  const firstScoredInterview =
    scoredInterviews.length > 0
      ? [...scoredInterviews].sort(
          (a, b) =>
            new Date(a.created_at) -
            new Date(b.created_at)
        )[0]
      : null;

  const improvementScore =
    firstScoredInterview &&
    latestInterview &&
    firstScoredInterview.id !==
      latestInterview.id &&
    latestInterview.scores.overall > 0
      ? Math.round(
          latestInterview.scores.overall -
            firstScoredInterview.scores.overall
        )
      : null;

  const modeStats = useMemo(() => {
    const modes = {
      normal: {
        label: 'Normal',
        count: 0,
        total: 0
      },
      voice: {
        label: 'Voice',
        count: 0,
        total: 0
      }
    };

    scoredInterviews.forEach(
      (interview) => {
        const mode =
          interview.recordingMode ===
          'voice'
            ? 'voice'
            : 'normal';

        modes[mode].count += 1;
        modes[mode].total +=
          interview.scores.overall;
      }
    );

    return Object.values(modes).map(
      (mode) => ({
        ...mode,
        average:
          mode.count > 0
            ? Math.round(
                mode.total / mode.count
              )
            : 0
      })
    );
  }, [scoredInterviews]);

  const chartInterviews = useMemo(() => {
    return [...scoredInterviews]
      .sort(
        (a, b) =>
          new Date(a.created_at) -
          new Date(b.created_at)
      )
      .slice(-8);
  }, [scoredInterviews]);

  const chartPoints = useMemo(() => {
    if (chartInterviews.length === 0) {
      return [];
    }

    const width = 900;
    const height = 280;
    const left = 55;
    const right = 25;
    const top = 25;
    const bottom = 45;

    const graphWidth =
      width - left - right;
    const graphHeight =
      height - top - bottom;

    return chartInterviews.map(
      (interview, index) => {
        const x =
          chartInterviews.length === 1
            ? width / 2
            : left +
              (index /
                (chartInterviews.length -
                  1)) *
                graphWidth;

        const score = Math.min(
          100,
          Math.max(
            0,
            interview.scores.overall
          )
        );

        const y =
          top +
          (1 - score / 100) *
            graphHeight;

        return {
          x,
          y,
          score,
          date: interview.displayDate,
          id: interview.id
        };
      }
    );
  }, [chartInterviews]);

  const chartLine = chartPoints
    .map(
      (point) =>
        `${point.x},${point.y}`
    )
    .join(' ');

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
    padding: '0.6rem 1rem',
    fontSize: '0.75rem',
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

          <div
  style={{
    display: 'flex',
    gap: '0.7rem',
    flexWrap: 'wrap'
  }}
>
  <Link
    to="/"
    style={secondaryButtonStyle}
    onMouseEnter={handleSecondaryEnter}
    onMouseLeave={handleSecondaryLeave}
    aria-label="Home Screen"
    title="Home Screen"
  >
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V10.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 21V13H15V21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </Link>
</div>
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
              alignItems: 'flex-start',
              gap: '1rem',
              flexWrap: 'wrap',
              marginBottom: '1.25rem'
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.35rem'
                }}
              >
                Score Over Time
              </h2>

              <p
                style={{
                  color:
                    'var(--text-muted)',
                  fontSize: '0.8rem',
                  margin:
                    '0.4rem 0 0'
                }}
              >
                Your overall interview performance
              </p>
            </div>

            {chartInterviews.length > 0 && (
              <div
                style={{
                  color:
                    'var(--text-muted)',
                  fontSize: '0.72rem'
                }}
              >
                Last {chartInterviews.length}{' '}
                scored{' '}
                {chartInterviews.length === 1
                  ? 'interview'
                  : 'interviews'}
              </div>
            )}
          </div>

          {loading ? (
            <div
              style={{
                height: '280px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div
                className="spinner"
                style={{
                  width: '40px',
                  height: '40px'
                }}
              />
            </div>
          ) : chartInterviews.length === 0 ? (
            <div
              style={{
                height: '280px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border:
                  '1px dashed rgba(255,255,255,0.12)',
                borderRadius: '14px'
              }}
            >
              <div
                style={{
                  fontSize: '2rem',
                  marginBottom: '0.6rem'
                }}
              >
                📈
              </div>

              <div
                style={{
                  fontWeight: 700
                }}
              >
                No scored interviews yet
              </div>

              <div
                style={{
                  color:
                    'var(--text-muted)',
                  fontSize: '0.8rem',
                  marginTop: '0.35rem'
                }}
              >
                Complete an interview to start
                tracking your progress.
              </div>
            </div>
          ) : (
            <div
              style={{
                width: '100%',
                overflowX: 'auto'
              }}
            >
              <svg
                viewBox="0 0 900 280"
                width="100%"
                height="280"
                preserveAspectRatio="none"
                style={{
                  minWidth: '600px',
                  display: 'block'
                }}
              >
                {[0, 20, 40, 60, 80, 100].map(
                  (score) => {
                    const y =
                      25 +
                      (1 - score / 100) *
                        210;

                    return (
                      <g key={score}>
                        <line
                          x1="55"
                          y1={y}
                          x2="875"
                          y2={y}
                          stroke="rgba(255,255,255,0.07)"
                          strokeWidth="1"
                        />

                        <text
                          x="42"
                          y={y + 4}
                          textAnchor="end"
                          fill="var(--text-muted)"
                          fontSize="11"
                        >
                          {score}
                        </text>
                      </g>
                    );
                  }
                )}

                {chartPoints.length > 1 && (
                  <polyline
                    points={chartLine}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {chartPoints.map(
                  (point) => (
                    <g key={point.id}>
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="6"
                        fill="#a855f7"
                        stroke="rgba(255,255,255,0.9)"
                        strokeWidth="2"
                      />

                      <text
                        x={point.x}
                        y={point.y - 14}
                        textAnchor="middle"
                        fill="#e2e8f0"
                        fontSize="11"
                        fontWeight="700"
                      >
                        {Math.round(
                          point.score
                        )}
                      </text>

                      <text
                        x={point.x}
                        y="258"
                        textAnchor="middle"
                        fill="var(--text-muted)"
                        fontSize="10"
                      >
                        {point.date}
                      </text>
                    </g>
                  )
                )}
              </svg>
            </div>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'minmax(0, 1.35fr) minmax(280px, 0.65fr)',
            gap: '1.5rem',
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
                marginBottom: '1.5rem'
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.35rem'
                }}
              >
                Skill Performance
              </h2>

              <p
                style={{
                  color:
                    'var(--text-muted)',
                  fontSize: '0.8rem',
                  margin:
                    '0.4rem 0 0'
                }}
              >
                Average performance across your completed interviews.
              </p>
            </div>

            {loading ? (
              <div
                style={{
                  minHeight: '230px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <div
                  className="spinner"
                  style={{
                    width: '36px',
                    height: '36px'
                  }}
                />
              </div>
            ) : scoredInterviews.length === 0 ? (
              <div
                style={{
                  minHeight: '230px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color:
                    'var(--text-muted)',
                  textAlign: 'center',
                  fontSize: '0.85rem'
                }}
              >
                Complete a scored interview to see your skill performance.
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem'
                }}
              >
                {skillPerformance.map(
                  (skill) => (
                    <div key={skill.key}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent:
                            'space-between',
                          alignItems: 'center',
                          marginBottom:
                            '0.5rem'
                        }}
                      >
                        <span
                          style={{
                            fontSize:
                              '0.82rem',
                            fontWeight: 700
                          }}
                        >
                          {skill.label}
                        </span>

                        <span
                          style={{
                            fontSize:
                              '0.8rem',
                            fontWeight: 800,
                            color:
                              getScoreClass(
                                skill.average
                              )
                          }}
                        >
                          {skill.average > 0
                            ? `${skill.average}%`
                            : '—'}
                        </span>
                      </div>

                      <div
                        style={{
                          height: '8px',
                          borderRadius:
                            '999px',
                          background:
                            'rgba(255,255,255,0.07)',
                          overflow: 'hidden'
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(
                                0,
                                skill.average
                              )
                            )}%`,
                            height: '100%',
                            borderRadius:
                              '999px',
                            background:
                              getScoreClass(
                                skill.average
                              ),
                            transition:
                              'width 0.4s ease'
                          }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          <div
            className="glass-panel"
            style={{
              padding: '1.5rem'
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: '1.35rem'
              }}
            >
              Your Performance
            </h2>

            <p
              style={{
                color:
                  'var(--text-muted)',
                fontSize: '0.8rem',
                margin:
                  '0.4rem 0 1.4rem'
              }}
            >
              Where you are strongest and where to focus next.
            </p>

            {strongestSkill ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.8rem'
                }}
              >
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    background:
                      'rgba(34,197,94,0.07)',
                    border:
                      '1px solid rgba(34,197,94,0.14)'
                  }}
                >
                  <div
                    style={{
                      color:
                        'var(--text-muted)',
                      fontSize:
                        '0.66rem',
                      fontWeight: 800,
                      letterSpacing:
                        '0.08em',
                      marginBottom:
                        '0.35rem'
                    }}
                  >
                    STRONGEST SKILL
                  </div>

                  <div
                    style={{
                      fontSize:
                        '1.05rem',
                      fontWeight: 800
                    }}
                  >
                    {strongestSkill.label}
                  </div>

                  <div
                    style={{
                      color: '#86efac',
                      fontSize:
                        '0.8rem',
                      fontWeight: 700,
                      marginTop:
                        '0.25rem'
                    }}
                  >
                    {strongestSkill.average}%
                    average
                  </div>
                </div>

                {weakestSkill && (
                  <div
                    style={{
                      padding: '1rem',
                      borderRadius: '12px',
                      background:
                        'rgba(245,158,11,0.07)',
                      border:
                        '1px solid rgba(245,158,11,0.14)'
                    }}
                  >
                    <div
                      style={{
                        color:
                          'var(--text-muted)',
                        fontSize:
                          '0.66rem',
                        fontWeight: 800,
                        letterSpacing:
                          '0.08em',
                        marginBottom:
                          '0.35rem'
                      }}
                    >
                      FOCUS AREA
                    </div>

                    <div
                      style={{
                        fontSize:
                          '1.05rem',
                        fontWeight: 800
                      }}
                    >
                      {weakestSkill.label}
                    </div>

                    <div
                      style={{
                        color: '#fcd34d',
                        fontSize:
                          '0.8rem',
                        fontWeight: 700,
                        marginTop:
                          '0.25rem'
                      }}
                    >
                      {weakestSkill.average}%
                      average
                    </div>
                  </div>
                )}

                {improvementScore !== null && (
                  <div
                    style={{
                      padding: '1rem',
                      borderRadius: '12px',
                      background:
                        improvementScore >= 0
                          ? 'rgba(168,85,247,0.07)'
                          : 'rgba(239,68,68,0.07)',
                      border:
                        improvementScore >= 0
                          ? '1px solid rgba(168,85,247,0.14)'
                          : '1px solid rgba(239,68,68,0.14)'
                    }}
                  >
                    <div
                      style={{
                        color:
                          'var(--text-muted)',
                        fontSize:
                          '0.66rem',
                        fontWeight: 800,
                        letterSpacing:
                          '0.08em',
                        marginBottom:
                          '0.35rem'
                      }}
                    >
                      OVERALL PROGRESS
                    </div>

                    <div
                      style={{
                        fontSize:
                          '1.05rem',
                        fontWeight: 800,
                        color:
                          improvementScore >= 0
                            ? '#c4b5fd'
                            : '#fca5a5'
                      }}
                    >
                      {improvementScore >= 0
                        ? `+${improvementScore}`
                        : improvementScore}{' '}
                      points
                    </div>

                    <div
                      style={{
                        color:
                          'var(--text-muted)',
                        fontSize:
                          '0.72rem',
                        marginTop:
                          '0.25rem'
                      }}
                    >
                      From your first scored interview to your latest.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  minHeight: '230px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color:
                    'var(--text-muted)',
                  textAlign: 'center',
                  fontSize: '0.85rem'
                }}
              >
                Complete a scored interview to unlock performance insights.
              </div>
            )}
          </div>
        </div>

        {scoredInterviews.length > 0 && (
          <div
            className="glass-panel"
            style={{
              padding: '1.5rem',
              marginBottom: '2rem'
            }}
          >
            <div
              style={{
                marginBottom: '1.25rem'
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.35rem'
                }}
              >
                Interview Mode Performance
              </h2>

              <p
                style={{
                  color:
                    'var(--text-muted)',
                  fontSize: '0.8rem',
                  margin:
                    '0.4rem 0 0'
                }}
              >
                Compare your results across Normal and Voice interviews.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem'
              }}
            >
              {modeStats.map((mode) => (
                <div
                  key={mode.label}
                  style={{
                    padding: '1.1rem',
                    borderRadius: '12px',
                    background:
                      'rgba(255,255,255,0.035)',
                    border:
                      '1px solid rgba(255,255,255,0.07)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent:
                        'space-between',
                      alignItems: 'center',
                      gap: '1rem'
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 800
                        }}
                      >
                        {mode.label}
                      </div>

                      <div
                        style={{
                          color:
                            'var(--text-muted)',
                          fontSize:
                            '0.72rem',
                          marginTop:
                            '0.25rem'
                        }}
                      >
                        {mode.count}{' '}
                        {mode.count === 1
                          ? 'interview'
                          : 'interviews'}
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize:
                          '1.5rem',
                        fontWeight: 800,
                        color:
                          getScoreClass(
                            mode.average
                          )
                      }}
                    >
                      {mode.average > 0
                        ? `${mode.average}%`
                        : '—'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
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

                <Link
                  to={`/dashboard/interview/${latestInterview.id}`}
                  style={secondaryButtonStyle}
                  onMouseEnter={
                    handleSecondaryEnter
                  }
                  onMouseLeave={
                    handleSecondaryLeave
                  }
                >
                  View Report
                </Link>
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
                    : 'Standard'}
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
                Quick Actions
              </h2>

              <p
                style={{
                  color:
                    'var(--text-muted)',
                  fontSize: '0.8rem',
                  margin:
                    '0.4rem 0 0'
                }}
              >
                Continue practicing or review your previous results.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '0.7rem',
                flexWrap: 'wrap'
              }}
            >
              <Link
                to="/interview-mode"
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

              <Link
                to="/dashboard/history"
                style={secondaryButtonStyle}
                onMouseEnter={
                  handleSecondaryEnter
                }
                onMouseLeave={
                  handleSecondaryLeave
                }
              >
                View Interview History
              </Link>
            </div>
          </div>
        </div>

        {!loading &&
          interviews.length === 0 && (
            <div
              className="glass-panel"
              style={{
                padding: '3rem 2rem',
                textAlign: 'center'
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
                Complete your first interview
                and your performance data will
                appear here.
              </p>

              <Link
                to="/interview-mode"
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
          )}
      </div>
    </div>
  );
};

export default Dashboard;