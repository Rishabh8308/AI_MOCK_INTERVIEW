import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const avatarColors = [
  '#4285F4',
  '#7B1FA2',
  '#00897B',
  '#5E35B1',
  '#3949AB',
  '#C2185B',
  '#00838F',
  '#6D4C41',
  '#546E7A',
  '#7CB342'
];

const Account = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [sendingReset, setSendingReset] =
    useState(false);

  const [passwordMessage, setPasswordMessage] =
    useState('');

  const [passwordError, setPasswordError] =
    useState('');

  const getDisplayName = (currentUser) => {
    const metadata =
      currentUser?.user_metadata || {};

    return (
      metadata.username ||
      metadata.full_name ||
      metadata.name ||
      currentUser?.email?.split('@')[0] ||
      'User'
    );
  };

  const getAvatarColor = (currentUser) => {
    const value =
      currentUser?.id ||
      currentUser?.email ||
      'user';

    let hash = 0;

    for (let i = 0; i < value.length; i++) {
      hash =
        value.charCodeAt(i) +
        ((hash << 5) - hash);
    }

    return avatarColors[
      Math.abs(hash) % avatarColors.length
    ];
  };

  const getInitial = (currentUser) => {
    const name =
      getDisplayName(currentUser);

    return (
      name.charAt(0).toUpperCase() ||
      'U'
    );
  };

  useEffect(() => {
    let mounted = true;

    const loadAccount = async () => {
      try {
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
          error
        } = await supabase
          .from('AI_MOCK')
          .select(
            'final_report, created_at'
          )
          .eq(
            'user_id',
            session.user.id
          )
          .order('created_at', {
            ascending: false
          });

        if (error) {
          throw error;
        }

        if (mounted) {
          setInterviews(data || []);
        }
      } catch (error) {
        console.error(
          'Failed to load account:',
          error
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadAccount();

    const {
      data: authListener
    } =
      supabase.auth.onAuthStateChange(
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

  const parseScore = (report) => {
    if (
      !report ||
      typeof report !== 'string'
    ) {
      return 0;
    }

    const match = report.match(
      /SCORE_JSON:\s*(\{[\s\S]*?\})/
    );

    if (!match) {
      return 0;
    }

    try {
      const scores = JSON.parse(
        match[1]
      );

      return Number(
        scores.overall
      ) || 0;
    } catch {
      return 0;
    }
  };

  const scoredInterviews =
    interviews
      .map((interview) =>
        parseScore(
          interview.final_report
        )
      )
      .filter(
        (score) => score > 0
      );

  const totalInterviews =
    interviews.length;

  const averageScore =
    scoredInterviews.length > 0
      ? Math.round(
          scoredInterviews.reduce(
            (total, score) =>
              total + score,
            0
          ) /
            scoredInterviews.length
        )
      : 0;

  const bestScore =
    scoredInterviews.length > 0
      ? Math.max(
          ...scoredInterviews
        )
      : 0;

  const joinedDate =
    user?.created_at
      ? new Date(
          user.created_at
        ).toLocaleDateString(
          undefined,
          {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }
        )
      : 'N/A';

  const handlePasswordReset =
    async () => {
      if (!user?.email) {
        setPasswordError(
          'No email address is associated with this account.'
        );

        setTimeout(() => {
          setPasswordError('');
        }, 3000);

        return;
      }

      try {
        setSendingReset(true);
        setPasswordMessage('');
        setPasswordError('');

        const redirectUrl =
          `${window.location.origin}/auth?mode=reset`;

        const { error } =
          await supabase.auth.resetPasswordForEmail(
            user.email,
            {
              redirectTo:
                redirectUrl
            }
          );

        if (error) {
          throw error;
        }

        setPasswordMessage(
          `Password reset link sent to ${user.email}.`
        );

        setTimeout(() => {
          setPasswordMessage('');
        }, 3000);
      } catch (error) {
        console.error(
          'Password reset failed:',
          error
        );

        setPasswordError(
          error.message ||
            'Failed to send password reset link.'
        );

        setTimeout(() => {
          setPasswordError('');
        }, 3000);
      } finally {
        setSendingReset(false);
      }
    };

  const handleLogout = async () => {
    try {
      const { error } =
        await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      navigate(
        '/auth?mode=signin'
      );
    } catch (error) {
      console.error(
        'Logout failed:',
        error
      );
    }
  };

  if (loading) {
    return (
      <div className="account-page">
        <div className="account-loading">
          Loading account...
        </div>
      </div>
    );
  }

  const displayName =
    getDisplayName(user);

  const avatarColor =
    getAvatarColor(user);

  return (
    <div className="account-page">
      <div className="account-container">

        <div className="account-header">
          <button
            type="button"
            className="account-back-button"
            onClick={() =>
              navigate(-1)
            }
            aria-label="Go back"
            title="Back"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M19 12H5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />

              <path
                d="M10 7l-5 5 5 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div>
            <div className="account-eyebrow">
              ACCOUNT SETTINGS
            </div>

            <h1>
              Account
            </h1>

            <p>
              Manage your profile,
              security, and interview
              activity.
            </p>
          </div>
        </div>

        <section className="account-profile-card">
          <div
            className="account-avatar"
            style={{
              background:
                avatarColor
            }}
          >
            {getInitial(user)}
          </div>

          <div className="account-profile-info">
            <h2>
              {displayName}
            </h2>

            <p>
              {user?.email}
            </p>

            <span>
              Member since {joinedDate}
            </span>
          </div>
        </section>

        <section className="account-stats">
          <div className="account-stat">
            <span>
              TOTAL INTERVIEWS
            </span>

            <strong>
              {totalInterviews}
            </strong>
          </div>

          <div className="account-stat">
            <span>
              AVERAGE SCORE
            </span>

            <strong>
              {averageScore}%
            </strong>
          </div>

          <div className="account-stat">
            <span>
              BEST SCORE
            </span>

            <strong>
              {bestScore}%
            </strong>
          </div>
        </section>

        <section className="account-section">
          <div className="account-section-heading">
            <div className="account-section-icon">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />

                <path
                  d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 1.7-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2.4v-.2a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.7-1.7.06-.06A1.7 1.7 0 0 0 8.46 15a1.7 1.7 0 0 0-1.56-1.03H6.7v-2.4h.2A1.7 1.7 0 0 0 8.46 10a1.7 1.7 0 0 0-.34-1.88l-.06-.06 1.7-1.7.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 12.73 5.2V5h2.4v.2a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.7 1.7-.06.06A1.7 1.7 0 0 0 19.4 10a1.7 1.7 0 0 0 1.56 1.03h.2v2.4h-.2A1.7 1.7 0 0 0 19.4 15Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div>
              <h2>
                Security
              </h2>

              <p>
                Keep your account secure
                by resetting your password
                through your email.
              </p>
            </div>
          </div>

          <div className="password-reset-area">
            <div className="password-reset-info">
              <span>
                PASSWORD
              </span>

              <strong>
                Reset your password
              </strong>

              <p>
                We'll send a secure
                password reset link to
                {` ${user?.email}`}.
              </p>
            </div>

            <button
              type="button"
              className="account-primary-button"
              onClick={
                handlePasswordReset
              }
              disabled={
                sendingReset
              }
            >
              {sendingReset
                ? 'Sending...'
                : 'Send Reset Link'}
            </button>
          </div>

          {passwordError && (
            <div className="account-message error">
              {passwordError}
            </div>
          )}

          {passwordMessage && (
            <div className="account-message success">
              {passwordMessage}
            </div>
          )}
        </section>

        <section className="account-section">
          <div className="account-section-heading">
            <div className="account-section-icon">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v13a2.5 2.5 0 0 1-2.5 2h-11A2.5 2.5 0 0 1 4 18.5v-13Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />

                <path
                  d="M8 8h8M8 12h8M8 16h5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div>
              <h2>
                Interview Activity
              </h2>

              <p>
                Review your interview
                history and performance.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="account-row-button"
            onClick={() =>
              navigate('/dashboard')
            }
          >
            <div>
              <strong>
                View Interview History
              </strong>

              <span>
                See all your previous
                interviews and reports
              </span>
            </div>

            <span className="account-arrow">
              →
            </span>
          </button>
        </section>

        <section className="account-danger-section">
          <div>
            <h2>
              Account
            </h2>

            <p>
              Sign out of your current
              account.
            </p>
          </div>

          <button
            type="button"
            className="account-logout-button"
            onClick={
              handleLogout
            }
          >
            Log Out
          </button>
        </section>

      </div>
    </div>
  );
};

export default Account;