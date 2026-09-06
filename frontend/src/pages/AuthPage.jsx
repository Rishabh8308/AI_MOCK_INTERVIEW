import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isSignUp, setIsSignUp] = useState(
    searchParams.get('mode') === 'signup'
  );

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] =
    useState(false);

  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const mode = searchParams.get('mode');

    if (mode === 'signup') {
      setIsSignUp(true);
    }

    if (mode === 'signin') {
      setIsSignUp(false);
    }
  }, [searchParams]);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (mounted && session) {
        navigate('/journey', {
          replace: true
        });
      }
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const switchMode = () => {
    setError(null);
    setMessage(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUsername('');
    setShowPassword(false);
    setShowConfirmPassword(false);

    const nextMode = !isSignUp;

    setIsSignUp(nextMode);

    navigate(
      nextMode
        ? '/auth?mode=signup'
        : '/auth?mode=signin',
      {
        replace: true
      }
    );
  };

  const handleAuth = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        if (!username.trim()) {
          throw new Error(
            'Please enter a username.'
          );
        }

        if (username.trim().length < 3) {
          throw new Error(
            'Username must be at least 3 characters long.'
          );
        }

        if (password !== confirmPassword) {
          throw new Error(
            'Passwords do not match.'
          );
        }

        if (password.length < 6) {
          throw new Error(
            'Password must be at least 6 characters long.'
          );
        }

        const { data, error } =
          await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              emailRedirectTo:
                `${window.location.origin}/journey`,
              data: {
                username:
                  username.trim()
              }
            }
          });

        if (error) {
          throw error;
        }

        if (data.session) {
          navigate('/journey', {
            replace: true
          });
        } else {
          setMessage(
            'Account created successfully. Check your email for the confirmation link.'
          );
        }
      } else {
        const { error } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password
          });

        if (error) {
          throw error;
        }

        navigate('/journey', {
          replace: true
        });
      }
    } catch (err) {
      setError(
        err.message ||
          'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    setMessage(null);

    if (!email.trim()) {
      setError(
        'Enter your email address first, then click Forgot password.'
      );
      return;
    }

    setResetLoading(true);

    try {
      const { error } =
        await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo:
              `${window.location.origin}/auth`
          }
        );

      if (error) {
        throw error;
      }

      setMessage(
        'Password reset email sent. Check your inbox.'
      );

      setTimeout(() => {
        setMessage(null);
      }, 4000);
    } catch (err) {
      setError(
        err.message ||
          'Unable to send password reset email.'
      );
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .auth-page {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          box-sizing: border-box;
          position: relative;
          overflow: hidden;
          background: #0b0d0f;
        }

        .auth-page::before {
          content: '';
          position: absolute;
          width: 520px;
          height: 520px;
          border-radius: 50%;
          background: rgba(39, 199, 176, 0.045);
          filter: blur(80px);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        .auth-page::after {
          content: '';
          position: absolute;
          width: 430px;
          height: 430px;
          border-radius: 50%;
          border: 1px solid rgba(39, 199, 176, 0.08);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        .auth-scene {
          width: min(500px, 88vw);
          aspect-ratio: 1 / 1;
          perspective: 1800px;
          position: relative;
          z-index: 2;
        }

        .auth-circle {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          transition:
            transform 0.95s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .auth-circle.signup {
          transform: rotateY(180deg);
        }

        .auth-face {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          padding: 4rem;

          background:
            radial-gradient(
              circle at 35% 25%,
              rgba(39, 199, 176, 0.08),
              transparent 45%
            ),
            #111516;

          border: 1px solid rgba(39, 199, 176, 0.22);

          box-shadow:
            0 0 35px rgba(39, 199, 176, 0.07),
            0 25px 70px rgba(0, 0, 0, 0.55),
            inset 0 0 45px rgba(39, 199, 176, 0.025);
        }

        .auth-face::before {
          content: '';
          position: absolute;
          inset: 12px;
          border-radius: 50%;
          border: 1px solid rgba(39, 199, 176, 0.09);
          pointer-events: none;
        }

        .auth-face::after {
          content: '';
          position: absolute;
          inset: 24px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.035);
          pointer-events: none;
        }

        .auth-face.signup-face {
          transform: rotateY(180deg);
        }

        .auth-content {
          width: 100%;
          max-width: 310px;
          position: relative;
          z-index: 5;
          text-align: center;
        }

        .auth-heading {
          margin: 0;
          color: #f2f4f4;
          font-family: Outfit, Inter, sans-serif;
          font-size: 2.7rem;
          font-weight: 800;
          letter-spacing: -0.05em;
          line-height: 1;
        }

        .auth-heading::after {
          content: '';
          display: block;
          width: 32px;
          height: 2px;
          margin: 0.7rem auto 0;
          background: #27c7b0;
          border-radius: 2px;
        }

        .auth-subheading {
          margin: 0.75rem 0 1.7rem;
          color: #8c969a;
          font-size: 0.82rem;
          font-weight: 500;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .auth-password-wrap {
          position: relative;
          width: 100%;
        }

        .auth-password-wrap .auth-input {
          padding-right: 3.2rem;
        }

        .auth-input {
          width: 100%;
          height: 48px;
          box-sizing: border-box;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.09);
          outline: none;
          padding: 0 1rem;
          background: #181d1f;
          color: #e8ecec;
          font-size: 0.82rem;

          transition:
            border-color 0.2s ease,
            background 0.2s ease;
        }

        .auth-input:focus {
          border-color: rgba(39, 199, 176, 0.55);
          background: #1a2021;
        }

        .auth-input::placeholder {
          color: #687275;
        }

        .password-toggle {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          color: #707b7f;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border-radius: 7px;
          transition:
            color 0.2s ease,
            background 0.2s ease;
        }

        .password-toggle:hover {
          color: #62d6c5;
          background: rgba(39, 199, 176, 0.07);
        }

        .password-toggle svg {
          width: 17px;
          height: 17px;
          pointer-events: none;
        }

        .auth-options {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 0.05rem 0 0.35rem;
          color: #707b7f;
          font-size: 0.68rem;
        }

        .remember {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          cursor: pointer;
          user-select: none;
        }

        .remember input {
          appearance: none;
          -webkit-appearance: none;
          width: 24px;
          height: 13px;
          margin: 0;
          border-radius: 20px;
          background: #202628;
          border: 1px solid rgba(255, 255, 255, 0.1);
          position: relative;
          cursor: pointer;
        }

        .remember input::before {
          content: '';
          position: absolute;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          left: 2px;
          top: 1px;
          background: #687275;
          transition:
            transform 0.2s ease,
            background 0.2s ease;
        }

        .remember input:checked::before {
          transform: translateX(10px);
          background: #27c7b0;
        }

        .forgot {
          color: #707b7f;
          border: none;
          background: transparent;
          padding: 0;
          font-size: 0.68rem;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .forgot:hover {
          color: #62d6c5;
        }

        .forgot:disabled {
          cursor: wait;
          opacity: 0.6;
        }

        .auth-submit {
          width: 100%;
          height: 48px;
          border: 1px solid #27c7b0;
          border-radius: 10px;
          background: #27c7b0;
          color: #071211;
          font-size: 0.76rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          cursor: pointer;

          transition:
            background 0.2s ease,
            border-color 0.2s ease,
            transform 0.2s ease;
        }

        .auth-submit:hover:not(:disabled) {
          background: #31d4bd;
          border-color: #31d4bd;
          transform: translateY(-2px);
        }

        .auth-submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .auth-submit:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .auth-switch {
          margin: 1.2rem 0 0;
          color: #707b7f;
          font-size: 0.72rem;
        }

        .auth-switch button {
          border: none;
          background: transparent;
          color: #62d6c5;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
          margin-left: 0.25rem;
          transition: color 0.2s ease;
        }

        .auth-switch button:hover {
          color: #8ae5d7;
        }

        .auth-error,
        .auth-message {
          border-radius: 9px;
          padding: 0.65rem 0.8rem;
          margin-bottom: 0.7rem;
          font-size: 0.68rem;
          line-height: 1.4;
        }

        .auth-error {
          color: #f0a0a0;
          background: rgba(239, 107, 107, 0.07);
          border: 1px solid rgba(239, 107, 107, 0.18);
        }

        .auth-message {
          color: #7ce0d0;
          background: rgba(39, 199, 176, 0.06);
          border: 1px solid rgba(39, 199, 176, 0.18);
        }

        .auth-spinner {
          width: 17px;
          height: 17px;
          border-radius: 50%;
          border: 2px solid rgba(7, 18, 17, 0.25);
          border-top-color: #071211;
          animation: authSpin 0.7s linear infinite;
          margin: 0 auto;
        }

        @keyframes authSpin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 600px) {
          .auth-page {
            padding: 1rem;
          }

          .auth-scene {
            width: min(430px, 94vw);
          }

          .auth-face {
            padding: 3rem;
          }

          .auth-heading {
            font-size: 2.25rem;
          }

          .auth-content {
            max-width: 285px;
          }
        }

        @media (max-width: 400px) {
          .auth-face {
            padding: 2.7rem;
          }

          .auth-heading {
            font-size: 2rem;
          }

          .auth-content {
            max-width: 255px;
          }

          .auth-input,
          .auth-submit {
            height: 44px;
          }
        }
      `}</style>

      <div className="auth-page">
        <div className="auth-scene">
          <div
            className={`auth-circle ${
              isSignUp ? 'signup' : ''
            }`}
          >
            <div className="auth-face signin-face">
              <div className="auth-content">
                <h1 className="auth-heading">
                  Sign In
                </h1>

                <p className="auth-subheading">
                  Welcome back to AI Interviewer
                </p>

                {error && (
                  <div className="auth-error">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="auth-message">
                    {message}
                  </div>
                )}

                <form
                  className="auth-form"
                  onSubmit={handleAuth}
                >
                  <input
                    className="auth-input"
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="Email address"
                    autoComplete="email"
                    required
                  />

                  <div className="auth-password-wrap">
                    <input
                      className="auth-input"
                      type={
                        showPassword
                          ? 'text'
                          : 'password'
                      }
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      placeholder="Password"
                      autoComplete="current-password"
                      required
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowPassword(
                          (prev) => !prev
                        )
                      }
                      aria-label={
                        showPassword
                          ? 'Hide password'
                          : 'Show password'
                      }
                    >
                      {showPassword ? (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 3l18 18" />
                          <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                          <path d="M9.88 4.24A9.77 9.77 0 0 1 12 4c7 0 10 8 10 8a17.9 17.9 0 0 1-3.17 4.4" />
                          <path d="M6.61 6.61C3.62 8.59 2 12 2 12s3 8 10 8a9.77 9.77 0 0 0 3.88-.8" />
                        </svg>
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8S2 12 2 12Z" />
                          <circle
                            cx="12"
                            cy="12"
                            r="3"
                          />
                        </svg>
                      )}
                    </button>
                  </div>

                  <div className="auth-options">
                    <label className="remember">
                      <input type="checkbox" />
                      <span>
                        Remember me
                      </span>
                    </label>

                    <button
                      type="button"
                      className="forgot"
                      onClick={
                        handleForgotPassword
                      }
                      disabled={
                        resetLoading
                      }
                    >
                      {resetLoading
                        ? 'Sending...'
                        : 'Forgot password?'}
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="auth-submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="auth-spinner"></div>
                    ) : (
                      'SIGN IN'
                    )}
                  </button>
                </form>

                <p className="auth-switch">
                  Don't have an account?
                  <button
                    type="button"
                    onClick={switchMode}
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </div>

            <div className="auth-face signup-face">
              <div className="auth-content">
                <h1 className="auth-heading">
                  Sign Up
                </h1>

                <p className="auth-subheading">
                  Create your AI Interviewer account
                </p>

                {error && (
                  <div className="auth-error">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="auth-message">
                    {message}
                  </div>
                )}

                <form
                  className="auth-form"
                  onSubmit={handleAuth}
                >
                  <input
                    className="auth-input"
                    type="text"
                    value={username}
                    onChange={(e) =>
                      setUsername(
                        e.target.value
                      )
                    }
                    placeholder="Username"
                    autoComplete="username"
                    minLength={3}
                    maxLength={30}
                    required
                  />

                  <input
                    className="auth-input"
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="Email address"
                    autoComplete="email"
                    required
                  />

                  <div className="auth-password-wrap">
                    <input
                      className="auth-input"
                      type={
                        showPassword
                          ? 'text'
                          : 'password'
                      }
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      placeholder="Password"
                      autoComplete="new-password"
                      required
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowPassword(
                          (prev) => !prev
                        )
                      }
                      aria-label={
                        showPassword
                          ? 'Hide password'
                          : 'Show password'
                      }
                    >
                      {showPassword ? (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 3l18 18" />
                          <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                          <path d="M9.88 4.24A9.77 9.77 0 0 1 12 4c7 0 10 8 10 8a17.9 17.9 0 0 1-3.17 4.4" />
                          <path d="M6.61 6.61C3.62 8.59 2 12 2 12s3 8 10 8a9.77 9.77 0 0 0 3.88-.8" />
                        </svg>
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8S2 12 2 12Z" />
                          <circle
                            cx="12"
                            cy="12"
                            r="3"
                          />
                        </svg>
                      )}
                    </button>
                  </div>

                  <div className="auth-password-wrap">
                    <input
                      className="auth-input"
                      type={
                        showConfirmPassword
                          ? 'text'
                          : 'password'
                      }
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(
                          e.target.value
                        )
                      }
                      placeholder="Confirm password"
                      autoComplete="new-password"
                      required
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowConfirmPassword(
                          (prev) => !prev
                        )
                      }
                      aria-label={
                        showConfirmPassword
                          ? 'Hide confirm password'
                          : 'Show confirm password'
                      }
                    >
                      {showConfirmPassword ? (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 3l18 18" />
                          <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                          <path d="M9.88 4.24A9.77 9.77 0 0 1 12 4c7 0 10 8 10 8a17.9 17.9 0 0 1-3.17 4.4" />
                          <path d="M6.61 6.61C3.62 8.59 2 12 2 12s3 8 10 8a9.77 9.77 0 0 0 3.88-.8" />
                        </svg>
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8S2 12 2 12Z" />
                          <circle
                            cx="12"
                            cy="12"
                            r="3"
                          />
                        </svg>
                      )}
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="auth-submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="auth-spinner"></div>
                    ) : (
                      'CREATE ACCOUNT'
                    )}
                  </button>
                </form>

                <p className="auth-switch">
                  Already have an account?
                  <button
                    type="button"
                    onClick={switchMode}
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthPage;