import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const History = () => {
  const navigate = useNavigate();

  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openingRecording, setOpeningRecording] = useState(null);

  const parseScore = (report) => {
    if (!report) {
      return null;
    }

    const reportText =
      typeof report === 'string'
        ? report
        : JSON.stringify(report);

    const match = reportText.match(
      /SCORE_JSON:\s*(\{[\s\S]*?\})/
    );

    if (!match) {
      return null;
    }

    try {
      const scores = JSON.parse(match[1]);
      const overall = Number(scores.overall);

      return Number.isFinite(overall)
        ? Math.round(overall)
        : null;
    } catch {
      return null;
    }
  };

  const getRecordingType = (path) => {
    if (!path) {
      return null;
    }

    const lowerPath = String(path).toLowerCase();

    if (
      lowerPath.includes('video+audio') ||
      lowerPath.includes('video_audio') ||
      lowerPath.includes('video-audio') ||
      lowerPath.includes('video/audio') ||
      lowerPath.includes('/video/')
    ) {
      return 'video';
    }

    if (
      lowerPath.includes('/audio/') ||
      lowerPath.includes('audio')
    ) {
      return 'audio';
    }

    return null;
  };

  const getDateValue = (interview) => {
    return (
      interview.created_at ||
      interview.createdAt ||
      interview.created_on ||
      interview.createdOn ||
      interview.date ||
      interview.interview_date ||
      interview.interviewDate ||
      interview.timestamp ||
      null
    );
  };

  const formatDate = (interview) => {
    const rawDate = getDateValue(interview);

    if (!rawDate) {
      return 'Date unavailable';
    }

    const date = new Date(rawDate);

    if (Number.isNaN(date.getTime())) {
      return 'Date unavailable';
    }

    return date.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (interview) => {
    const rawDate = getDateValue(interview);

    if (!rawDate) {
      return '';
    }

    const date = new Date(rawDate);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openRecording = async (
    interview,
    recordingType
  ) => {
    if (!interview.recording_path) {
      alert(
        'No recording is available for this interview.'
      );
      return;
    }

    try {
      setOpeningRecording(interview.id);

      let path = String(
        interview.recording_path
      );

      if (path.startsWith('AI_MOCK/')) {
        path = path.substring(
          'AI_MOCK/'.length
        );
      }

      const {
        data,
        error: storageError
      } = await supabase.storage
        .from('AI_MOCK')
        .createSignedUrl(
          path,
          60 * 60
        );

      if (storageError) {
        throw storageError;
      }

      if (!data?.signedUrl) {
        throw new Error(
          'Recording URL was not created.'
        );
      }

      window.open(
        data.signedUrl,
        '_blank',
        'noopener,noreferrer'
      );
    } catch (err) {
      console.error(
        'Failed to open recording:',
        err
      );

      alert(
        `Unable to open the ${recordingType} recording.`
      );
    } finally {
      setOpeningRecording(null);
    }
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError('');

        const {
          data: {
            session
          }
        } = await supabase.auth.getSession();

        if (!session) {
          navigate('/auth');
          return;
        }

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

        setInterviews(data || []);
      } catch (err) {
        console.error(
          'Failed to load interview history:',
          err
        );

        setError(
          'Unable to load your interview history.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [navigate]);

  if (loading) {
    return (
      <div
        className="history-page"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div
          className="spinner"
          style={{
            width: '45px',
            height: '45px'
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="history-page"
      style={{
        minHeight: '100vh',
        padding: '2.5rem 4%',
        paddingTop: '7rem',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '2rem',
            marginBottom: '2.5rem',
            flexWrap: 'wrap'
          }}
        >
          <div>
            <div
              style={{
                color: '#a855f7',
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                marginBottom: '0.6rem'
              }}
            >
              AI MOCK INTERVIEW
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: 'clamp(2.7rem, 5vw, 4rem)',
                lineHeight: 1,
                fontWeight: 800
              }}
            >
              History
            </h1>

            <p
              style={{
                marginTop: '1rem',
                color: 'var(--text-muted)',
                fontSize: '1.05rem'
              }}
            >
              Review your previous interview
              sessions and evaluation reports.
            </p>
          </div>

          <Link
            to="/"
            aria-label="Home Screen"
            title="Home Screen"
            style={{
              width: '62px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '10px',
              border:
                '1px solid rgba(255,255,255,0.12)',
              background:
                'rgba(255,255,255,0.035)',
              color: '#e2e8f0',
              textDecoration: 'none'
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 10.5L12 3L21 10.5V20C21 20.55 20.55 21 20 21H4C3.45 21 3 20.55 3 20V10.5Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 21V13H15V21"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>

        <div
          style={{
            marginBottom: '2rem',
            padding: '1.4rem 1.7rem',
            borderRadius: '18px',
            border:
              '1px solid rgba(255,255,255,0.1)',
            background:
              'rgba(255,255,255,0.025)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          <div>
            <div
              style={{
                fontSize: '1.1rem',
                fontWeight: 700
              }}
            >
              Your Interviews
            </div>

            <div
              style={{
                marginTop: '0.35rem',
                color: 'var(--text-muted)'
              }}
            >
              {interviews.length}{' '}
              {interviews.length === 1
                ? 'interview'
                : 'interviews'}{' '}
              saved
            </div>
          </div>

          <div
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.9rem'
            }}
          >
            Most recent first
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '1.5rem',
              borderRadius: '16px',
              border:
                '1px solid rgba(239,68,68,0.25)',
              background:
                'rgba(239,68,68,0.06)',
              color: '#fca5a5',
              marginBottom: '2rem'
            }}
          >
            {error}
          </div>
        )}

        {!error && interviews.length === 0 && (
          <div
            style={{
              minHeight: '300px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '2rem',
              borderRadius: '20px',
              border:
                '1px solid rgba(255,255,255,0.1)',
              background:
                'rgba(255,255,255,0.025)'
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.5rem'
                }}
              >
                No interviews yet
              </h2>

              <p
                style={{
                  color: 'var(--text-muted)',
                  marginTop: '0.7rem'
                }}
              >
                Complete your first interview
                to see it here.
              </p>

              <Link
                to="/interview-mode"
                className="btn btn-primary"
                style={{
                  display: 'inline-block',
                  marginTop: '1.5rem',
                  textDecoration: 'none'
                }}
              >
                Start Interview
              </Link>
            </div>
          </div>
        )}

        {!error && interviews.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fill, minmax(300px, 340px))',
              gap: '1.5rem',
              justifyContent: 'start'
            }}
          >
            {interviews.map((interview) => {
              const score = parseScore(
                interview.final_report
              );

              const recordingType =
                getRecordingType(
                  interview.recording_path
                );

              const isVoice =
                interview.recording_mode ===
                  'voice' ||
                Boolean(recordingType);

              const dateText =
                formatDate(interview);

              const timeText =
                formatTime(interview);

              const isOpening =
                openingRecording ===
                interview.id;

              return (
                <div
                  key={interview.id}
                  style={{
                    width: '100%',
                    height: '340px',
                    padding: '1.5rem',
                    borderRadius: '20px',
                    border:
                      '1px solid rgba(255,255,255,0.1)',
                    background:
                      'rgba(255,255,255,0.025)',
                    display: 'flex',
                    flexDirection: 'column',
                    boxSizing: 'border-box',
                    transition:
                      'transform 0.2s ease, border-color 0.2s ease'
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.transform =
                      'translateY(-3px)';
                    event.currentTarget.style.borderColor =
                      'rgba(168,85,247,0.35)';
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.transform =
                      'translateY(0)';
                    event.currentTarget.style.borderColor =
                      'rgba(255,255,255,0.1)';
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '0.7rem'
                    }}
                  >
                    <h2
                      style={{
                        margin: 0,
                        fontSize: '1.2rem',
                        fontWeight: 750,
                        lineHeight: 1.3
                      }}
                    >
                      {interview.role ||
                        'General Interview'}
                    </h2>

                    <span
                      style={{
                        flexShrink: 0,
                        padding:
                          '0.35rem 0.65rem',
                        borderRadius: '999px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: isVoice
                          ? '#c4b5fd'
                          : '#cbd5e1',
                        background:
                          isVoice
                            ? 'rgba(139,92,246,0.12)'
                            : 'rgba(148,163,184,0.12)',
                        border:
                          isVoice
                            ? '1px solid rgba(139,92,246,0.25)'
                            : '1px solid rgba(148,163,184,0.2)'
                      }}
                    >
                      {isVoice
                        ? 'Voice'
                        : 'Standard'}
                    </span>
                  </div>

                  <div
                    style={{
                      marginTop: '0.8rem',
                      color: 'var(--text-muted)',
                      fontSize: '0.82rem',
                      lineHeight: 1.6
                    }}
                  >
                    {interview.interview_type ||
                      'General'}
                    {' · '}
                    {interview.experience_level ||
                      'N/A'}
                  </div>

                  <div
                    style={{
                      marginTop: '0.35rem',
                      color: 'var(--text-muted)',
                      fontSize: '0.78rem'
                    }}
                  >
                    {dateText}
                    {timeText
                      ? ` · ${timeText}`
                      : ''}
                  </div>

                  <div
                    style={{
                      marginTop: '1.2rem',
                      paddingTop: '0.9rem',
                      borderTop:
                        '1px solid rgba(255,255,255,0.08)'
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.65rem',
                        color: 'var(--text-muted)',
                        fontWeight: 700,
                        letterSpacing:
                          '0.08em'
                      }}
                    >
                      SCORE
                    </div>

                    <div
                      style={{
                        marginTop: '0.2rem',
                        fontSize: '1.8rem',
                        fontWeight: 800
                      }}
                    >
                      {score !== null
                        ? `${score}%`
                        : '—'}
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.55rem'
                    }}
                  >
                    {recordingType && (
                      <button
                        type="button"
                        onClick={() =>
                          openRecording(
                            interview,
                            recordingType
                          )
                        }
                        disabled={isOpening}
                        style={{
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          borderRadius: '9px',
                          border:
                            '1px solid rgba(255,255,255,0.12)',
                          background:
                            'rgba(255,255,255,0.04)',
                          color: '#e2e8f0',
                          fontSize: '0.85rem',
                          fontWeight: 650,
                          cursor: isOpening
                            ? 'wait'
                            : 'pointer',
                          opacity: isOpening
                            ? 0.6
                            : 1
                        }}
                      >
                        {recordingType ===
                        'audio' ? (
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >
                            <rect
                              x="7"
                              y="3"
                              width="10"
                              height="13"
                              rx="5"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            />
                            <path
                              d="M4 11C4 15.42 7.58 19 12 19C16.42 19 20 15.42 20 11"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                            <path
                              d="M12 19V22"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                          </svg>
                        ) : (
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >
                            <rect
                              x="3"
                              y="6"
                              width="13"
                              height="12"
                              rx="2"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            />
                            <path
                              d="M16 10L21 7.5V16.5L16 14V10Z"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}

                        {isOpening
                          ? 'Opening...'
                          : recordingType ===
                            'audio'
                          ? 'View Audio'
                          : 'View Video'}
                      </button>
                    )}

                    <Link
                      to={`/dashboard/interview/${interview.id}`}
                      style={{
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '9px',
                        border:
                          '1px solid rgba(255,255,255,0.12)',
                        background:
                          'rgba(255,255,255,0.07)',
                        color: '#e2e8f0',
                        textDecoration: 'none',
                        fontSize: '0.85rem',
                        fontWeight: 650
                      }}
                    >
                      View Report
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;