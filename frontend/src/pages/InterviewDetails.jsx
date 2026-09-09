import { useEffect, useState } from 'react';
import {
  useLocation,
  useParams,
  Link,
  useNavigate
} from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const InterviewDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdminViewer =
    location.pathname.startsWith('/admin/interview/');

  const apiUrl = import.meta.env.VITE_API_URL || '';

  const parseScores = (report) => {
    const defaultScores = {
      overall: 0,
      communication: 0,
      technical: 0,
      confidence: 0,
      starMethod: 0
    };

    if (!report || typeof report !== 'string') {
      return defaultScores;
    }

    const match = report.match(
      /SCORE_JSON:\s*(\{[\s\S]*?\})/
    );

    if (!match) {
      return defaultScores;
    }

    try {
      const scores = JSON.parse(match[1]);

      return {
        overall:
          Number(scores.overall) || 0,
        communication:
          Number(scores.communication) || 0,
        technical:
          Number(scores.technical) || 0,
        confidence:
          Number(scores.confidence) || 0,
        starMethod:
          Number(scores.starMethod) || 0
      };
    } catch {
      return defaultScores;
    }
  };

  const cleanReport = (report) => {
    if (!report || typeof report !== 'string') {
      return 'No evaluation report available.';
    }

    return report
      .replace(
        /SCORE_JSON:\s*\{[\s\S]*?\}/,
        ''
      )
      .trim();
  };

  useEffect(() => {
    let mounted = true;

    const fetchDetails = async () => {
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

        let data;

        if (isAdminViewer) {
          const response = await fetch(
            `${apiUrl}/api/admin/interview/${id}`,
            {
              headers: {
                Authorization:
                  `Bearer ${session.access_token}`
              }
            }
          );

          const responseData =
            await response.json();

          if (!response.ok) {
            throw new Error(
              responseData.error ||
                'Unable to load this interview.'
            );
          }

          data = responseData.interview;
        } else {
          const {
            data: interview,
            error: queryError
          } = await supabase
            .from('AI_MOCK')
            .select('*')
            .eq('id', id)
            .eq('user_id', session.user.id)
            .single();

          if (queryError) {
            throw queryError;
          }

          data = interview;
        }

        if (!data) {
          throw new Error(
            'Interview report not found.'
          );
        }

        const scores = parseScores(
          data.final_report
        );

        if (!mounted) {
          return;
        }

        setResult({
          ...data,
          scores,
          cleanReport: cleanReport(
            data.final_report
          )
        });
      } catch (err) {
        console.error(
          'Failed to fetch interview details:',
          err
        );

        if (mounted) {
          setError(
            err.message ||
              'Unable to load this interview report.'
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchDetails();

    return () => {
      mounted = false;
    };
  }, [
    id,
    navigate,
    isAdminViewer,
    apiUrl
  ]);

  if (loading) {
    return (
      <div
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
            width: '50px',
            height: '50px'
          }}
        />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center'
        }}
      >
        <div>
          <h2>
            Interview Report Not Found
          </h2>

          <p
            style={{
              color: 'var(--text-muted)',
              marginTop: '0.7rem'
            }}
          >
            {error ||
              'This interview could not be loaded.'}
          </p>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
            style={{
              marginTop: '2rem'
            }}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  const isVoice =
    result.recording_mode === 'voice';

  const recordingMode =
    result.recording_mode === 'audio'
      ? 'audio'
      : 'video';

  return (
    <div
      className="details-page"
      style={{
        padding: '2rem',
        paddingTop: '6rem',
        maxWidth: '1000px',
        margin: '0 auto',
        minHeight: '100vh'
      }}
    >
      <div
        style={{
          marginBottom: '2rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap'
        }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            color: 'var(--text-muted)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'none',
            border: 'none',
            padding: 0,
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          ← Back
        </button>
      </div>

      <div
        className="glass-panel"
        style={{
          padding: '3rem',
          animation:
            'slideUp 0.6s ease forwards'
        }}
      >
        {isAdminViewer && (
          <div
            style={{
              color: '#a855f7',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              marginBottom: '1.5rem'
            }}
          >
            ADMIN · INTERVIEW REVIEW
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '2rem',
                margin: 0
              }}
            >
              {result.role ||
                'General Interview'}
            </h1>

            <p
              style={{
                color: 'var(--text-muted)',
                marginTop: '0.5rem'
              }}
            >
              {result.created_at
                ? new Date(
                    result.created_at
                  ).toLocaleDateString()
                : 'N/A'}
              {' at '}
              {result.created_at
                ? new Date(
                    result.created_at
                  ).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : ''}
            </p>

            <div
              style={{
                display: 'flex',
                gap: '0.6rem',
                flexWrap: 'wrap',
                marginTop: '1rem'
              }}
            >
              <span className="skill-badge">
                {isVoice
                  ? 'Voice Interview'
                  : 'Normal Interview'}
              </span>

              {result.interview_type && (
                <span className="skill-badge">
                  {result.interview_type}
                </span>
              )}

              {result.experience_level && (
                <span className="skill-badge">
                  {result.experience_level}
                </span>
              )}
            </div>

            {isAdminViewer &&
              result.user_id && (
                <p
                  style={{
                    color:
                      'var(--text-muted)',
                    marginTop: '1rem',
                    fontSize: '0.85rem'
                  }}
                >
                  User ID: {result.user_id}
                </p>
              )}
          </div>

          <div
            style={{
              textAlign: 'right'
            }}
          >
            <div
              style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                color:
                  result.scores.overall >= 70
                    ? '#22c55e'
                    : '#f59e0b'
              }}
            >
              {Math.round(
                result.scores.overall
              )}
              %
            </div>

            <div
              style={{
                fontSize: '0.8rem',
                color:
                  'var(--text-muted)',
                fontWeight: 600
              }}
            >
              OVERALL SCORE
            </div>
          </div>
        </div>

        <div
          className="score-breakdown"
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
            marginBottom: '3rem',
            borderTop:
              '1px solid rgba(255,255,255,0.1)',
            paddingTop: '2rem'
          }}
        >
          <div
            className="score-item"
            style={{
              textAlign: 'center'
            }}
          >
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 700
              }}
            >
              {Math.round(
                result.scores.communication
              )}
              %
            </div>

            <div
              style={{
                fontSize: '0.7rem',
                color:
                  'var(--text-muted)',
                fontWeight: 600
              }}
            >
              COMMUNICATION
            </div>
          </div>

          <div
            className="score-item"
            style={{
              textAlign: 'center'
            }}
          >
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 700
              }}
            >
              {Math.round(
                result.scores.technical
              )}
              %
            </div>

            <div
              style={{
                fontSize: '0.7rem',
                color:
                  'var(--text-muted)',
                fontWeight: 600
              }}
            >
              TECHNICAL DEPTH
            </div>
          </div>

          <div
            className="score-item"
            style={{
              textAlign: 'center'
            }}
          >
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 700
              }}
            >
              {Math.round(
                result.scores.confidence
              )}
              %
            </div>

            <div
              style={{
                fontSize: '0.7rem',
                color:
                  'var(--text-muted)',
                fontWeight: 600
              }}
            >
              CONFIDENCE
            </div>
          </div>

          <div
            className="score-item"
            style={{
              textAlign: 'center'
            }}
          >
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 700
              }}
            >
              {Math.round(
                result.scores.starMethod
              )}
              %
            </div>

            <div
              style={{
                fontSize: '0.7rem',
                color:
                  'var(--text-muted)',
                fontWeight: 600
              }}
            >
              STAR METHOD
            </div>
          </div>
        </div>

        <div
          className="report-content"
          style={{
            background:
              'rgba(0,0,0,0.2)',
            padding: '2rem',
            borderRadius: '16px',
            border:
              '1px solid rgba(255,255,255,0.05)'
          }}
        >
          <h3
            style={{
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            AI Evaluation Report
          </h3>

          <div
            style={{
              whiteSpace: 'pre-wrap',
              lineHeight: '1.8',
              color: '#e2e8f0',
              fontSize: '1rem'
            }}
          >
            {result.cleanReport}
          </div>
        </div>

        {result.recording_path && (
          <div
            style={{
              marginTop: '2rem',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <Link
              to={
                isAdminViewer
                  ? `/admin/recording/${result.id}?recording=${recordingMode}`
                  : `/dashboard/recording/${result.id}?recording=${recordingMode}`
              }
              className="btn btn-secondary"
              style={{
                textDecoration: 'none'
              }}
            >
              View Recording
            </Link>
          </div>
        )}

        {!isAdminViewer && (
          <div
            style={{
              marginTop: '3rem',
              textAlign: 'center'
            }}
          >
            <Link
              to="/interview-mode"
              className="btn btn-primary"
              style={{
                width: 'auto',
                textDecoration: 'none'
              }}
            >
              Practice Another One
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewDetails;