import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });
  }, [navigate]);

  const switchMode = () => {
    setError(null);
    setMessage(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsSignUp((prev) => !prev);
  };

  const handleAuth = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }

        if (password.length < 6) {
          throw new Error(
            'Password must be at least 6 characters long.'
          );
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });

        if (error) {
          throw error;
        }

        setMessage(
          'Account created successfully. Check your email for the confirmation link.'
        );
      } else {
        const { error } =
          await supabase.auth.signInWithPassword({
            email,
            password
          });

        if (error) {
          throw error;
        }

        navigate('/');
      }
    } catch (err) {
      setError(err.message);
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
    setError(err.message);
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
          background:
            radial-gradient(
              circle at 50% 45%,
              rgba(30, 58, 110, 0.38) 0%,
              rgba(7, 21, 47, 0.72) 35%,
              rgba(2, 6, 23, 1) 75%
            );
        }

        .auth-page::before {
          content: '';
          position: absolute;
          width: 650px;
          height: 650px;
          border-radius: 50%;
          background:
            radial-gradient(
              circle,
              rgba(124, 58, 237, 0.18),
              rgba(56, 189, 248, 0.08) 45%,
              transparent 70%
            );
          filter: blur(35px);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        .auth-page::after {
          content: '';
          position: absolute;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          border: 1px solid rgba(56, 189, 248, 0.08);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          box-shadow:
            0 0 80px rgba(56, 189, 248, 0.06),
            inset 0 0 60px rgba(124, 58, 237, 0.05);
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
              rgba(30, 58, 110, 0.5),
              transparent 45%
            ),
            linear-gradient(
              145deg,
              rgba(15, 31, 61, 0.92),
              rgba(2, 6, 23, 0.96)
            );

          border: 1px solid rgba(56, 189, 248, 0.28);

          box-shadow:
            0 0 25px rgba(56, 189, 248, 0.12),
            0 0 65px rgba(124, 58, 237, 0.14),
            0 25px 70px rgba(0, 0, 0, 0.55),
            inset 0 0 45px rgba(124, 58, 237, 0.06);
        }

        .auth-face::before {
          content: '';
          position: absolute;
          inset: 12px;
          border-radius: 50%;
          border: 1px solid rgba(56, 189, 248, 0.14);
          box-shadow:
            inset 0 0 25px rgba(56, 189, 248, 0.04),
            0 0 20px rgba(124, 58, 237, 0.04);
          pointer-events: none;
        }

        .auth-face::after {
          content: '';
          position: absolute;
          inset: 24px;
          border-radius: 50%;
          border: 1px solid rgba(124, 58, 237, 0.12);
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
          font-size: 2.7rem;
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1;

          background:
            linear-gradient(
              135deg,
              #38bdf8,
              #7c3aed 55%,
              #db2777
            );

          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .auth-subheading {
          margin: 0.65rem 0 1.7rem;
          color: #94a3b8;
          font-size: 0.85rem;
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
          border-radius: 12px;

          border: 1px solid rgba(56, 189, 248, 0.18);

          outline: none;

          padding: 0 1rem;

          background:
            linear-gradient(
              145deg,
              rgba(15, 31, 61, 0.9),
              rgba(7, 21, 47, 0.92)
            );

          color: #e2e8f0;

          font-size: 0.82rem;

          box-shadow:
            inset 0 0 15px rgba(2, 6, 23, 0.45),
            0 0 10px rgba(56, 189, 248, 0.03);

          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            background 0.2s ease;
        }

        .auth-input:focus {
          border-color: rgba(56, 189, 248, 0.65);

          background:
            linear-gradient(
              145deg,
              rgba(15, 31, 61, 0.98),
              rgba(7, 21, 47, 0.98)
            );

          box-shadow:
            0 0 0 2px rgba(56, 189, 248, 0.08),
            0 0 18px rgba(56, 189, 248, 0.12),
            inset 0 0 15px rgba(124, 58, 237, 0.05);
        }

        .auth-input::placeholder {
          color: #64748b;
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
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border-radius: 8px;
          transition:
            color 0.2s ease,
            background 0.2s ease;
        }

        .password-toggle:hover {
          color: #38bdf8;
          background: rgba(56, 189, 248, 0.08);
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
          color: #64748b;
          font-size: 0.7rem;
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

          background: #0f1f3d;

          border: 1px solid rgba(56, 189, 248, 0.18);

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
          background: #64748b;
          transition:
            transform 0.2s ease,
            background 0.2s ease;
        }

        .remember input:checked::before {
          transform: translateX(10px);
          background: #38bdf8;
          box-shadow:
            0 0 8px rgba(56, 189, 248, 0.7);
        }

        .forgot {
          color: #64748b;
          border: none;
          background: transparent;
          padding: 0;
          font-size: 0.7rem;
          cursor: pointer;
          transition:
            color 0.2s ease,
            text-shadow 0.2s ease;
        }

        .forgot:hover {
          color: #38bdf8;
          text-shadow:
            0 0 8px rgba(56, 189, 248, 0.4);
        }

        .forgot:disabled {
          cursor: wait;
          opacity: 0.6;
        }

        .auth-submit {
          width: 100%;
          height: 48px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 13px;

          background:
            linear-gradient(
              135deg,
              #7c3aed,
              #db2777
            );

          color: #ffffff;

          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.1em;

          cursor: pointer;

          box-shadow:
            0 0 18px rgba(124, 58, 237, 0.25),
            0 0 30px rgba(219, 39, 119, 0.12);

          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            filter 0.2s ease;
        }

        .auth-submit:hover {
          transform: translateY(-2px);

          box-shadow:
            0 0 25px rgba(124, 58, 237, 0.38),
            0 0 40px rgba(219, 39, 119, 0.2);

          filter: brightness(1.08);
        }

        .auth-submit:active {
          transform: translateY(0);
        }

        .auth-submit:disabled {
          cursor: not-allowed;
          opacity: 0.65;
          transform: none;
        }

        .auth-switch {
          margin: 1.2rem 0 0;
          color: #64748b;
          font-size: 0.72rem;
        }

        .auth-switch button {
          border: none;
          background: transparent;

          color: #38bdf8;

          font-weight: 800;

          cursor: pointer;

          padding: 0;

          margin-left: 0.25rem;

          transition:
            color 0.2s ease,
            text-shadow 0.2s ease;
        }

        .auth-switch button:hover {
          color: #7dd3fc;

          text-shadow:
            0 0 10px rgba(56, 189, 248, 0.5);
        }

        .auth-error,
        .auth-message {
          border-radius: 10px;
          padding: 0.65rem 0.8rem;
          margin-bottom: 0.7rem;
          font-size: 0.7rem;
          line-height: 1.35;
        }

        .auth-error {
          color: #fda4af;

          background:
            rgba(190, 24, 93, 0.08);

          border:
            1px solid rgba(219, 39, 119, 0.2);

          box-shadow:
            0 0 15px rgba(219, 39, 119, 0.05);
        }

        .auth-message {
          color: #67e8f9;

          background:
            rgba(14, 116, 144, 0.08);

          border:
            1px solid rgba(56, 189, 248, 0.2);

          box-shadow:
            0 0 15px rgba(56, 189, 248, 0.05);
        }

        .auth-spinner {
          width: 17px;
          height: 17px;
          border-radius: 50%;

          border:
            2px solid rgba(255, 255, 255, 0.18);

          border-top-color: #38bdf8;

          animation:
            authSpin 0.7s linear infinite;

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
                      <input
                        type="checkbox"
                      />
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