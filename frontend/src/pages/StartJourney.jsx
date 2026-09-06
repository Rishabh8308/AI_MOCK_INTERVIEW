import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const GITHUB_REPO_URL =
  'https://github.com/Rishabh8308/AI_MOCK_INTERVIEW';

const StartJourney = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (mounted) {
        setUser(session?.user || null);
        setLoading(false);
      }
    };

    loadSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) {
          setUser(session?.user || null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const getUsername = () => {
    if (!user) {
      return '';
    }

    const metadata = user.user_metadata || {};

    return (
      metadata.username ||
      metadata.full_name ||
      metadata.name ||
      user.email?.split('@')[0] ||
      'there'
    );
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="start-journey-page">
        <div className="start-journey-loading">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="start-journey-page">
      <header className="start-journey-header">
        <button
          type="button"
          className="start-journey-logo"
          onClick={() => navigate('/')}
        >
          <span className="start-journey-logo-mark">
            AI
          </span>

          <span>AI-MOCK-INTERVIEW</span>
        </button>

        <nav className="start-journey-nav">
          {user ? (
            <>
              <button
                type="button"
                className="start-journey-nav-button"
                onClick={() => navigate('/dashboard')}
              >
                Dashboard
              </button>

              <button
  type="button"
  className="start-journey-nav-button"
  onClick={() => navigate('/about')}
>
  About Us
</button>

              <button
                type="button"
                className="start-journey-nav-button"
                onClick={handleLogout}
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="start-journey-nav-button"
                onClick={() =>
                  navigate('/auth?mode=signin')
                }
              >
                Sign In
              </button>

              <button
                type="button"
                className="start-journey-primary-button"
                onClick={() =>
                  navigate('/auth?mode=signup')
                }
              >
                Get Started
              </button>
            </>
          )}
        </nav>
      </header>

      <main className="start-journey-main">
        <section className="start-journey-hero">
          <div className="start-journey-content">
            <div className="start-journey-eyebrow">
              <span></span>
              AI-POWERED INTERVIEW PREPARATION
            </div>

            {user ? (
              <>
                <h1 className="start-journey-title">
                  Hello,{' '}
                  <span>{getUsername()}</span>
                </h1>

                <p className="start-journey-description">
                  Welcome back. Continue practicing,
                  sharpen your answers, and get ready
                  for your next interview.
                </p>

                <div className="start-journey-actions">
                  <button
                    type="button"
                    className="start-journey-main-button"
                    onClick={() => navigate('/interview-mode')}
                  >
                    Start Interview
                    <span>→</span>
                  </button>

                  
                </div>
              </>
            ) : (
              <>
                <h1 className="start-journey-title">
                  Start your{' '}
                  <span>journey.</span>
                </h1>

                <p className="start-journey-description">
                  Practice realistic interviews with
                  an AI-powered interviewer. Improve
                  your answers, understand your
                  weaknesses, and build confidence
                  before the real interview.
                </p>

                <div className="start-journey-actions">
                  <button
                    type="button"
                    className="start-journey-main-button"
                    onClick={() =>
                      navigate(
                        '/auth?mode=signup'
                      )
                    }
                  >
                    Get Started
                    <span>→</span>
                  </button>

                  <button
                    type="button"
                    className="start-journey-secondary-button"
                    onClick={() =>
                      navigate(
                        '/auth?mode=signin'
                      )
                    }
                  >
                    Already have an account?
                    <span>Sign In</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

        <section className="start-journey-about">
          <div className="start-journey-about-header">
            <div className="start-journey-about-label">
              <span></span>
              ABOUT THE PLATFORM
            </div>

            <h2>
              Practice with purpose.
              <br />
              <span>Improve with every interview.</span>
            </h2>
          </div>

          <div className="start-journey-about-body">
            <p>
              AI Mock Interview gives you a focused
              environment to practice interviews without
              the pressure of a real interview. Have
              realistic conversations with an AI interviewer,
              work through technical and behavioral
              questions, and receive feedback that helps
              you understand what to improve.
            </p>

            <div className="start-journey-about-features">
              <div className="start-journey-about-feature">
                <span>01</span>
                <div>
                  <strong>Technical</strong>
                  <p>Role-focused interview practice</p>
                </div>
              </div>

              <div className="start-journey-about-feature">
                <span>02</span>
                <div>
                  <strong>Behavioral</strong>
                  <p>Realistic communication practice</p>
                </div>
              </div>

              <div className="start-journey-about-feature">
                <span>03</span>
                <div>
                  <strong>AI Feedback</strong>
                  <p>Detailed performance evaluation</p>
                </div>
              </div>

              <div className="start-journey-about-feature">
                <span>04</span>
                <div>
                  <strong>Progress</strong>
                  <p>Review your previous sessions</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="start-journey-how-it-works">
          <div className="start-journey-section-heading">
            <div className="start-journey-section-label">
              <span></span>
              SIMPLE INTERVIEW PROCESS
            </div>

            <h2>
              How It Works
            </h2>

            <p>
              Prepare, practice, and improve through
              a simple AI-powered interview experience.
            </p>
          </div>

          <div className="start-journey-steps">
            <article className="start-journey-step">
              <div className="start-journey-step-top">
                <div className="start-journey-step-icon">
                  01
                </div>

                <span className="start-journey-step-number">
                  01
                </span>
              </div>

              <h3>
                Set Up Your Interview
              </h3>

              <p>
                Choose your role, experience level,
                interview type, and provide the
                information needed for your session.
              </p>
            </article>

            <article className="start-journey-step">
              <div className="start-journey-step-top">
                <div className="start-journey-step-icon">
                  02
                </div>

                <span className="start-journey-step-number">
                  02
                </span>
              </div>

              <h3>
                Interview With AI
              </h3>

              <p>
                Have a realistic conversation with
                the AI interviewer and answer questions
                just like you would in a real interview.
              </p>
            </article>

            <article className="start-journey-step">
              <div className="start-journey-step-top">
                <div className="start-journey-step-icon">
                  03
                </div>

                <span className="start-journey-step-number">
                  03
                </span>
              </div>

              <h3>
                Review Your Performance
              </h3>

              <p>
                Receive detailed feedback and review
                your interview performance to understand
                where you can improve.
              </p>
            </article>
          </div>
        </section>

        
      </main>
    </div>
  );
};

export default StartJourney;