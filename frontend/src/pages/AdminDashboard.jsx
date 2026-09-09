import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const usersSectionRef = useRef(null);
  const userDetailsRef = useRef(null);
  const rankingsSectionRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userInterviews, setUserInterviews] = useState([]);

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingInterviews, setLoadingInterviews] = useState(false);

  const [showUsers, setShowUsers] = useState(
    searchParams.get('users') === 'open'
  );

  const [showRankings, setShowRankings] = useState(
    searchParams.get('rankings') === 'open'
  );

  const [rankingField, setRankingField] =
    useState('overall');

  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

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
        overall: Number(scores.overall) || 0,
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

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      setError('');

      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session) {
        navigate('/auth');
        return;
      }

      const apiUrl =
        import.meta.env.VITE_API_URL || '';

      const response = await fetch(
        `${apiUrl}/api/admin/users`,
        {
          headers: {
            Authorization:
              `Bearer ${session.access_token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Failed to load users'
        );
      }

      setUsers(data.users || []);
    } catch (err) {
      console.error(
        'Failed to load admin users:',
        err
      );

      setError(
        err.message ||
          'Failed to load users.'
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadUserInterviews = async (user) => {
    try {
      setSelectedUser(user);
      setLoadingInterviews(true);
      setUserInterviews([]);
      setError('');

      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session) {
        navigate('/auth');
        return;
      }

      const apiUrl =
        import.meta.env.VITE_API_URL || '';

      const response = await fetch(
        `${apiUrl}/api/admin/users/${user.id}/interviews`,
        {
          headers: {
            Authorization:
              `Bearer ${session.access_token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Failed to load interviews'
        );
      }

      setUserInterviews(
        data.interviews || []
      );
    } catch (err) {
      console.error(
        'Failed to load user interviews:',
        err
      );

      setError(
        err.message ||
          'Failed to load interviews.'
      );
    } finally {
      setLoadingInterviews(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const userId =
      searchParams.get('user');

    if (
      userId &&
      users.length > 0 &&
      !selectedUser
    ) {
      const user = users.find(
        (item) => item.id === userId
      );

      if (user) {
        loadUserInterviews(user);
      }
    }
  }, [
    users,
    searchParams,
    selectedUser
  ]);

  useEffect(() => {
    if (
      showUsers &&
      usersSectionRef.current &&
      !selectedUser
    ) {
      setTimeout(() => {
        usersSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  }, [showUsers, selectedUser]);

  useEffect(() => {
    if (
      selectedUser &&
      userDetailsRef.current
    ) {
      setTimeout(() => {
        userDetailsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 150);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (
      showRankings &&
      rankingsSectionRef.current
    ) {
      setTimeout(() => {
        rankingsSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  }, [showRankings]);

  const openUsers = () => {
    setShowUsers(true);
    setShowRankings(false);

    const params = new URLSearchParams();

    params.set('users', 'open');

    setSearchParams(params);
  };

  const closeUsers = () => {
    setShowUsers(false);
    setSelectedUser(null);
    setUserInterviews([]);

    setSearchParams({});
  };

  const openRankings = () => {
    setShowRankings(true);
    setShowUsers(false);
    setSelectedUser(null);
    setUserInterviews([]);

    const params = new URLSearchParams();

    params.set('rankings', 'open');

    setSearchParams(params);
  };

  const closeRankings = () => {
    setShowRankings(false);

    setSearchParams({});
  };

  const openUser = async (user) => {
    setShowUsers(true);
    setShowRankings(false);

    const params = new URLSearchParams();

    params.set('users', 'open');
    params.set('user', user.id);

    setSearchParams(params);

    await loadUserInterviews(user);
  };

  const closeUser = () => {
    setSelectedUser(null);
    setUserInterviews([]);

    const params = new URLSearchParams();

    if (showUsers) {
      params.set('users', 'open');
    }

    setSearchParams(params);
  };

  const filteredUsers = useMemo(() => {
    const value =
      search.trim().toLowerCase();

    if (!value) {
      return users;
    }

    return users.filter(
      (user) =>
        user.email
          ?.toLowerCase()
          .includes(value)
    );
  }, [users, search]);

  const rankings = useMemo(() => {
    return [...users]
      .filter(
        (user) =>
          user.interview_count > 0
      )
      .sort(
        (a, b) =>
          (b.averages?.[rankingField] || 0) -
          (a.averages?.[rankingField] || 0)
      );
  }, [users, rankingField]);

  const totalInterviews =
    users.reduce(
      (total, user) =>
        total +
        (user.interview_count || 0),
      0
    );

  const averageScore = useMemo(() => {
    const scoredUsers =
      users.filter(
        (user) =>
          user.interview_count > 0 &&
          user.averages?.overall > 0
      );

    if (!scoredUsers.length) {
      return null;
    }

    return Math.round(
      scoredUsers.reduce(
        (sum, user) =>
          sum +
          user.averages.overall,
        0
      ) / scoredUsers.length
    );
  }, [users]);

  const interviewsToday = 0;

  const fieldLabels = {
    overall: 'Overall',
    technical: 'Technical',
    communication: 'Communication',
    confidence: 'Confidence',
    starMethod: 'STAR Method'
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '2rem 5%',
        paddingTop: '7rem',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}
      >
        <div
          style={{
            marginBottom: '2.5rem'
          }}
        >
          <div
            style={{
              color: '#a855f7',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              marginBottom: '0.5rem'
            }}
          >
            ADMIN PANEL
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: '2.4rem'
            }}
          >
            Admin Dashboard
          </h1>

          <p
            style={{
              marginTop: '0.7rem',
              color: 'var(--text-muted)'
            }}
          >
            Manage your AI Mock Interview platform.
          </p>
        </div>

        {error && (
          <div
            style={{
              marginBottom: '1.5rem',
              padding: '1rem',
              borderRadius: '10px',
              background:
                'rgba(239,68,68,0.1)',
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
            gap: '1.2rem',
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
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
                marginBottom: '0.7rem'
              }}
            >
              Total Users
            </div>

            <div
              style={{
                fontSize: '2rem',
                fontWeight: 700
              }}
            >
              {loadingUsers
                ? '...'
                : users.length}
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
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
                marginBottom: '0.7rem'
              }}
            >
              Total Interviews
            </div>

            <div
              style={{
                fontSize: '2rem',
                fontWeight: 700
              }}
            >
              {loadingUsers
                ? '...'
                : totalInterviews}
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
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
                marginBottom: '0.7rem'
              }}
            >
              Average Score
            </div>

            <div
              style={{
                fontSize: '2rem',
                fontWeight: 700
              }}
            >
              {averageScore === null
                ? '—'
                : `${averageScore}/100`}
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
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
                marginBottom: '0.7rem'
              }}
            >
              Interviews Today
            </div>

            <div
              style={{
                fontSize: '2rem',
                fontWeight: 700
              }}
            >
              {interviewsToday}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.2rem'
          }}
        >
          <div
            className="glass-panel"
            style={{
              padding: '1.7rem'
            }}
          >
            <h2
              style={{
                marginTop: 0,
                marginBottom: '0.7rem'
              }}
            >
              User Management
            </h2>

            <p
              style={{
                color: 'var(--text-muted)',
                lineHeight: 1.6,
                marginBottom: '1.3rem'
              }}
            >
              View registered users, interview history,
              scores and recordings.
            </p>

            <button
              type="button"
              onClick={
                showUsers
                  ? closeUsers
                  : openUsers
              }
              style={{
                padding:
                  '0.75rem 1.2rem',
                borderRadius:
                  '10px',
                border: 'none',
                background:
                  'rgba(168,85,247,0.35)',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {showUsers
                ? 'Hide Users'
                : 'View Users'}
            </button>
          </div>

          <div
            className="glass-panel"
            style={{
              padding: '1.7rem'
            }}
          >
            <h2
              style={{
                marginTop: 0,
                marginBottom: '0.7rem'
              }}
            >
              User Rankings
            </h2>

            <p
              style={{
                color: 'var(--text-muted)',
                lineHeight: 1.6,
                marginBottom: '1.3rem'
              }}
            >
              See which users perform best in each
              evaluation category.
            </p>

            <button
              type="button"
              onClick={
                showRankings
                  ? closeRankings
                  : openRankings
              }
              style={{
                padding:
                  '0.75rem 1.2rem',
                borderRadius:
                  '10px',
                border: 'none',
                background:
                  'rgba(168,85,247,0.35)',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {showRankings
                ? 'Hide Rankings'
                : 'View Rankings'}
            </button>
          </div>
        </div>

        {showUsers && (
          <div
            ref={usersSectionRef}
            className="glass-panel"
            style={{
              marginTop: '1.2rem',
              padding: '1.7rem',
              overflowX: 'auto',
              scrollMarginTop: '100px'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.5rem',
                flexWrap: 'wrap'
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0
                  }}
                >
                  Registered Users
                </h2>

                <p
                  style={{
                    margin:
                      '0.4rem 0 0',
                    color:
                      'var(--text-muted)'
                  }}
                >
                  Select a user to view their interviews.
                </p>
              </div>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search by email"
                style={{
                  width: '240px',
                  maxWidth: '100%',
                  padding:
                    '0.7rem 0.9rem',
                  borderRadius:
                    '10px',
                  border:
                    '1px solid rgba(255,255,255,0.12)',
                  background:
                    'rgba(255,255,255,0.05)',
                  color: '#fff',
                  outline: 'none'
                }}
              />
            </div>

            {loadingUsers ? (
              <div
                style={{
                  padding: '3rem',
                  textAlign:
                    'center',
                  color:
                    'var(--text-muted)'
                }}
              >
                Loading users...
              </div>
            ) : (
              <table
                style={{
                  width: '100%',
                  borderCollapse:
                    'collapse',
                  minWidth: '850px'
                }}
              >
                <thead>
                  <tr>
                    {[
                      'Email',
                      'Role',
                      'Interviews',
                      'Overall',
                      'Joined',
                      ''
                    ].map(
                      (heading, index) => (
                        <th
                          key={index}
                          style={{
                            textAlign:
                              index === 5
                                ? 'center'
                                : 'left',
                            padding:
                              '0.9rem',
                            color:
                              'var(--text-muted)',
                            borderBottom:
                              '1px solid rgba(255,255,255,0.1)'
                          }}
                        >
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map(
                    (user) => (
                      <tr
                        key={user.id}
                      >
                        <td
                          style={{
                            padding:
                              '1rem 0.9rem',
                            borderBottom:
                              '1px solid rgba(255,255,255,0.06)'
                          }}
                        >
                          {user.email ||
                            '—'}
                        </td>

                        <td
                          style={{
                            padding:
                              '1rem 0.9rem',
                            borderBottom:
                              '1px solid rgba(255,255,255,0.06)'
                          }}
                        >
                          {user.role}
                        </td>

                        <td
                          style={{
                            padding:
                              '1rem 0.9rem',
                            borderBottom:
                              '1px solid rgba(255,255,255,0.06)'
                          }}
                        >
                          {user.interview_count}
                        </td>

                        <td
                          style={{
                            padding:
                              '1rem 0.9rem',
                            borderBottom:
                              '1px solid rgba(255,255,255,0.06)'
                          }}
                        >
                          {user.interview_count
                            ? `${user.averages.overall}/100`
                            : '—'}
                        </td>

                        <td
                          style={{
                            padding:
                              '1rem 0.9rem',
                            borderBottom:
                              '1px solid rgba(255,255,255,0.06)',
                            color:
                              'var(--text-muted)'
                          }}
                        >
                          {user.created_at
                            ? new Date(
                                user.created_at
                              ).toLocaleDateString()
                            : '—'}
                        </td>

                        <td
                          style={{
                            padding:
                              '1rem 0.9rem',
                            borderBottom:
                              '1px solid rgba(255,255,255,0.06)'
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              openUser(
                                user
                              )
                            }
                            style={{
                              padding:
                                '0.55rem 0.8rem',
                              borderRadius:
                                '8px',
                              border:
                                'none',
                              background:
                                'rgba(168,85,247,0.35)',
                              color:
                                '#fff',
                              fontWeight:
                                600,
                              cursor:
                                'pointer'
                            }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {selectedUser && (
          <div
            ref={userDetailsRef}
            className="glass-panel"
            style={{
              marginTop:
                '1.2rem',
              padding:
                '1.7rem',
              scrollMarginTop:
                '100px'
            }}
          >
            <div
              style={{
                display:
                  'flex',
                justifyContent:
                  'space-between',
                alignItems:
                  'flex-start',
                gap:
                  '1rem',
                marginBottom:
                  '1.5rem',
                flexWrap:
                  'wrap'
              }}
            >
              <div>
                <div
                  style={{
                    color:
                      'var(--text-muted)',
                    fontSize:
                      '0.85rem',
                    marginBottom:
                      '0.4rem'
                  }}
                >
                  USER DETAILS
                </div>

                <h2
                  style={{
                    margin: 0
                  }}
                >
                  {selectedUser.email}
                </h2>

                <p
                  style={{
                    margin:
                      '0.5rem 0 0',
                    color:
                      'var(--text-muted)'
                  }}
                >
                  {selectedUser.interview_count}{' '}
                  interview
                  {selectedUser.interview_count !==
                  1
                    ? 's'
                    : ''}{' '}
                  · Overall average{' '}
                  {selectedUser.averages.overall}/100
                </p>
              </div>

              <button
                type="button"
                onClick={closeUser}
                style={{
                  padding:
                    '0.6rem 0.9rem',
                  borderRadius:
                    '8px',
                  border:
                    '1px solid rgba(255,255,255,0.12)',
                  background:
                    'rgba(255,255,255,0.05)',
                  color: '#fff',
                  cursor:
                    'pointer'
                }}
              >
                Close
              </button>
            </div>

            {loadingInterviews ? (
              <div
                style={{
                  padding:
                    '3rem',
                  textAlign:
                    'center',
                  color:
                    'var(--text-muted)'
                }}
              >
                Loading interviews...
              </div>
            ) : userInterviews.length === 0 ? (
              <div
                style={{
                  padding:
                    '2rem',
                  textAlign:
                    'center',
                  color:
                    'var(--text-muted)'
                }}
              >
                This user has not completed any interviews.
              </div>
            ) : (
              <div
                style={{
                  display:
                    'grid',
                  gap:
                    '1rem'
                }}
              >
                {userInterviews.map(
                  (interview) => {
                    const scores =
                      interview.scores ||
                      parseScores(
                        interview.final_report
                      );

                    return (
                      <div
                        key={
                          interview.id
                        }
                        style={{
                          padding:
                            '1.2rem',
                          borderRadius:
                            '12px',
                          background:
                            'rgba(255,255,255,0.04)',
                          border:
                            '1px solid rgba(255,255,255,0.08)'
                        }}
                      >
                        <div
                          style={{
                            display:
                              'flex',
                            justifyContent:
                              'space-between',
                            gap:
                              '1rem',
                            alignItems:
                              'flex-start',
                            flexWrap:
                              'wrap'
                          }}
                        >
                          <div>
                            <h3
                              style={{
                                margin:
                                  '0 0 0.4rem'
                              }}
                            >
                              {interview.role ||
                                'General Interview'}
                            </h3>

                            <div
                              style={{
                                color:
                                  'var(--text-muted)',
                                fontSize:
                                  '0.9rem'
                              }}
                            >
                              {interview.created_at
                                ? new Date(
                                    interview.created_at
                                  ).toLocaleString()
                                : 'Date unavailable'}
                            </div>
                          </div>

                          <div
                            style={{
                              fontWeight:
                                700,
                              fontSize:
                                '1.2rem'
                            }}
                          >
                            {scores.overall}/100
                          </div>
                        </div>

                        <div
                          style={{
                            display:
                              'grid',
                            gridTemplateColumns:
                              'repeat(auto-fit, minmax(120px, 1fr))',
                            gap:
                              '0.7rem',
                            marginTop:
                              '1rem'
                          }}
                        >
                          {[
                            [
                              'Technical',
                              scores.technical
                            ],
                            [
                              'Communication',
                              scores.communication
                            ],
                            [
                              'Confidence',
                              scores.confidence
                            ],
                            [
                              'STAR',
                              scores.starMethod
                            ]
                          ].map(
                            ([label, score]) => (
                              <div
                                key={
                                  label
                                }
                                style={{
                                  padding:
                                    '0.7rem',
                                  borderRadius:
                                    '8px',
                                  background:
                                    'rgba(255,255,255,0.04)'
                                }}
                              >
                                <div
                                  style={{
                                    color:
                                      'var(--text-muted)',
                                    fontSize:
                                      '0.75rem',
                                    marginBottom:
                                      '0.2rem'
                                  }}
                                >
                                  {label}
                                </div>

                                <strong>
                                  {score}/100
                                </strong>
                              </div>
                            )
                          )}
                        </div>

                        <div
                          style={{
                            display:
                              'flex',
                            gap:
                              '0.7rem',
                            marginTop:
                              '1rem',
                            flexWrap:
                              'wrap'
                          }}
                        >
                          <Link
                            to={`/admin/interview/${interview.id}`}
                            style={{
                              padding:
                                '0.6rem 0.9rem',
                              borderRadius:
                                '8px',
                              background:
                                'rgba(255,255,255,0.06)',
                              color:
                                '#fff',
                              textDecoration:
                                'none',
                              fontSize:
                                '0.9rem'
                            }}
                          >
                            View Evaluation
                          </Link>

                          {interview.recording_path && (
                            <Link
                              to={`/admin/recording/${interview.id}?recording=${interview.recording_mode === 'audio' ? 'audio' : 'video'}`}
                              style={{
                                padding:
                                  '0.6rem 0.9rem',
                                borderRadius:
                                  '8px',
                                background:
                                  'rgba(168,85,247,0.35)',
                                color:
                                  '#fff',
                                textDecoration:
                                  'none',
                                fontSize:
                                  '0.9rem'
                              }}
                            >
                              View Recording
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        )}

        {showRankings && (
          <div
            ref={
              rankingsSectionRef
            }
            className="glass-panel"
            style={{
              marginTop:
                '1.2rem',
              padding:
                '1.7rem',
              scrollMarginTop:
                '100px'
            }}
          >
            <div
              style={{
                display:
                  'flex',
                justifyContent:
                  'space-between',
                alignItems:
                  'center',
                gap:
                  '1rem',
                flexWrap:
                  'wrap',
                marginBottom:
                  '1.5rem'
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0
                  }}
                >
                  User Rankings
                </h2>

                <p
                  style={{
                    margin:
                      '0.4rem 0 0',
                    color:
                      'var(--text-muted)'
                  }}
                >
                  Rankings are based on each user's
                  average interview score.
                </p>
              </div>

              <select
                value={
                  rankingField
                }
                onChange={(event) =>
                  setRankingField(
                    event.target.value
                  )
                }
                style={{
                  padding:
                    '0.7rem 0.9rem',
                  borderRadius:
                    '10px',
                  border:
                    '1px solid rgba(255,255,255,0.12)',
                  background:
                    '#15151c',
                  color:
                    '#fff',
                  outline:
                    'none',
                  cursor:
                    'pointer'
                }}
              >
                {Object.entries(
                  fieldLabels
                ).map(
                  ([value, label]) => (
                    <option
                      key={value}
                      value={
                        value
                      }
                    >
                      {label}
                    </option>
                  )
                )}
              </select>
            </div>

            {rankings.length === 0 ? (
              <div
                style={{
                  padding:
                    '3rem',
                  textAlign:
                    'center',
                  color:
                    'var(--text-muted)'
                }}
              >
                There are not enough completed interviews
                to create a ranking yet.
              </div>
            ) : (
              <div
                style={{
                  display:
                    'grid',
                  gap:
                    '0.7rem'
                }}
              >
                {rankings.map(
                  (user, index) => (
                    <div
                      key={
                        user.id
                      }
                      style={{
                        display:
                          'grid',
                        gridTemplateColumns:
                          '55px minmax(180px, 1fr) 120px 120px',
                        alignItems:
                          'center',
                        gap:
                          '1rem',
                        padding:
                          '1rem',
                        borderRadius:
                          '10px',
                        background:
                          index ===
                          0
                            ? 'rgba(168,85,247,0.12)'
                            : 'rgba(255,255,255,0.03)',
                        border:
                          '1px solid rgba(255,255,255,0.07)'
                      }}
                    >
                      <div
                        style={{
                          fontSize:
                            '1.1rem',
                          fontWeight:
                            700
                        }}
                      >
                        #{index +
                          1}
                      </div>

                      <div
                        style={{
                          minWidth:
                            0
                        }}
                      >
                        <div
                          style={{
                            fontWeight:
                              600,
                            overflow:
                              'hidden',
                            textOverflow:
                              'ellipsis'
                          }}
                        >
                          {user.email}
                        </div>

                        <div
                          style={{
                            color:
                              'var(--text-muted)',
                            fontSize:
                              '0.8rem',
                            marginTop:
                              '0.2rem'
                          }}
                        >
                          {
                            user.interview_count
                          }{' '}
                          interview
                          {user.interview_count !==
                          1
                            ? 's'
                            : ''}
                        </div>
                      </div>

                      <div
                        style={{
                          color:
                            'var(--text-muted)',
                          fontSize:
                            '0.85rem'
                        }}
                      >
                        {
                          fieldLabels[
                            rankingField
                          ]
                        }
                      </div>

                      <div
                        style={{
                          fontSize:
                            '1.2rem',
                          fontWeight:
                            700,
                          textAlign:
                            'right'
                        }}
                      >
                        {user.averages?.[
                          rankingField
                        ] || 0}
                        /100
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}

        <div
          style={{
            marginTop:
              '2rem'
          }}
        >
          <Link
            to="/"
            style={{
              color:
                'var(--text-muted)',
              textDecoration:
                'none'
            }}
          >
            ← Back to Home Page
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;