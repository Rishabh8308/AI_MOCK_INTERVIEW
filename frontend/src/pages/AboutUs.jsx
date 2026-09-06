import { useNavigate } from 'react-router-dom';

const AboutUs = () => {
  const navigate = useNavigate();

  return (
    <div className="about-page">
      <header className="about-header">
        <div className="about-nav">
          <button
            type="button"
            className="about-logo"
            onClick={() => navigate('/')}
          >
            <span className="about-logo-mark">AI</span>
            <span>Mock Interview</span>
          </button>

          <nav className="about-nav-links">
            <button
              type="button"
              className="about-nav-link active"
              onClick={() => navigate('/about')}
            >
              About Us
            </button>

            <button
              type="button"
              className="about-nav-link"
              onClick={() => navigate('/')}
            >
              Home
            </button>
          </nav>

          <button
            type="button"
            className="about-nav-cta"
            onClick={() => navigate('/interview-mode')}
          >
            Start Interview
          </button>
        </div>
      </header>

      <main>
        <section className="about-hero">
          <div className="about-hero-content">
            <span className="about-label">ABOUT THE PLATFORM</span>

            <h1>
              Prepare smarter.
              <br />
              <span>Interview better.</span>
            </h1>

            <p>
              AI Mock Interview is an interview preparation platform designed
              to help you practice realistic interviews, improve your answers,
              and understand where you can do better.
            </p>

            <div className="about-hero-actions">
              <button
                type="button"
                className="about-primary-button"
                onClick={() => navigate('/interview-mode')}
              >
                Start an Interview
              </button>

              <button
                type="button"
                className="about-secondary-button"
                onClick={() => navigate('/')}
              >
                Back to Home
              </button>
            </div>
          </div>
        </section>

        <section className="about-section">
          <div className="about-section-heading">
            <span className="about-label">WHY WE BUILT IT</span>
            <h2>A practical way to build interview confidence</h2>
          </div>

          <div className="about-intro-grid">
            <div className="about-intro-main">
              <p>
                Interviews can be difficult to prepare for because reading
                questions is very different from actually answering them under
                pressure.
              </p>

              <p>
                This platform gives you a place to practice that experience.
                Instead of simply memorizing answers, you can work through
                interview questions, communicate your thinking, and receive
                AI-powered evaluation.
              </p>
            </div>

            <div className="about-intro-card">
              <div className="about-card-number">01</div>
              <h3>Practice with purpose</h3>
              <p>
                Turn interview preparation into repeated, structured practice
                instead of last-minute revision.
              </p>
            </div>
          </div>
        </section>

        <section className="about-section about-features-section">
          <div className="about-section-heading centered">
            <span className="about-label">WHAT YOU CAN DO</span>
            <h2>Everything you need to practice</h2>
            <p>
              The platform combines interview simulation, AI evaluation, and
              performance history in one place.
            </p>
          </div>

          <div className="about-feature-grid">
            <article className="about-feature-card">
              <span className="about-feature-number">01</span>
              <h3>Technical Interviews</h3>
              <p>
                Practice technical questions and explain your approach as you
                would during a real interview.
              </p>
            </article>

            <article className="about-feature-card">
              <span className="about-feature-number">02</span>
              <h3>Behavioral Practice</h3>
              <p>
                Work on communication, confidence, and structured responses to
                behavioral interview questions.
              </p>
            </article>

            <article className="about-feature-card">
              <span className="about-feature-number">03</span>
              <h3>AI Interviewer</h3>
              <p>
                Interact with an AI interviewer that can guide the interview
                and respond to your answers.
              </p>
            </article>

            <article className="about-feature-card">
              <span className="about-feature-number">04</span>
              <h3>AI Evaluation</h3>
              <p>
                Review feedback on your performance and identify areas that
                need more practice.
              </p>
            </article>

            <article className="about-feature-card">
              <span className="about-feature-number">05</span>
              <h3>Interview History</h3>
              <p>
                Keep track of previous interviews and return to your results
                when you want to measure progress.
              </p>
            </article>

            <article className="about-feature-card">
              <span className="about-feature-number">06</span>
              <h3>Voice Experience</h3>
              <p>
                Practice in a more natural interview environment with
                voice-based interaction.
              </p>
            </article>
          </div>
        </section>

        <section className="about-section about-process-section">
          <div className="about-section-heading">
            <span className="about-label">HOW IT WORKS</span>
            <h2>From preparation to improvement</h2>
          </div>

          <div className="about-process">
            <div className="about-process-step">
              <div className="about-process-icon">01</div>
              <div>
                <h3>Configure your interview</h3>
                <p>
                  Choose the interview type and provide the information needed
                  to create your interview experience.
                </p>
              </div>
            </div>

            <div className="about-process-line" />

            <div className="about-process-step">
              <div className="about-process-icon">02</div>
              <div>
                <h3>Complete the interview</h3>
                <p>
                  Answer questions and communicate your reasoning just as you
                  would in an actual interview.
                </p>
              </div>
            </div>

            <div className="about-process-line" />

            <div className="about-process-step">
              <div className="about-process-icon">03</div>
              <div>
                <h3>Review your performance</h3>
                <p>
                  Analyze your evaluation, understand your strengths, and find
                  areas where you can improve.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="about-section about-tech-section">
          <div className="about-section-heading">
            <span className="about-label">TECHNOLOGY</span>
            <h2>Built with modern web technology</h2>
            <p>
              The application brings together a modern frontend, backend
              services, authentication, data storage, and generative AI.
            </p>
          </div>

          <div className="about-tech-grid">
            <div className="about-tech-item">
              <strong>React</strong>
              <span>Frontend interface</span>
            </div>

            <div className="about-tech-item">
              <strong>Vite</strong>
              <span>Development tooling</span>
            </div>

            <div className="about-tech-item">
              <strong>Node.js</strong>
              <span>Backend runtime</span>
            </div>

            <div className="about-tech-item">
              <strong>Express</strong>
              <span>Backend API</span>
            </div>

            <div className="about-tech-item">
              <strong>Google Gemini</strong>
              <span>AI interview intelligence</span>
            </div>

            <div className="about-tech-item">
              <strong>Supabase</strong>
              <span>Authentication and data</span>
            </div>
          </div>
        </section>

        <section className="about-creator-section">
          <div className="about-creator-content">
            <span className="about-label">THE CREATOR</span>

            <h2>Built by RISHABH DOBRIYAL</h2>

            <p>
              AI Mock Interview is an independent project focused on making
              interview preparation more practical, accessible, and
              interactive through AI.
            </p>

            <div className="about-contact">
              <a
                href="https://www.linkedin.com/in/rishabh-dobriyal-604ba6362"
                target="_blank"
                rel="noreferrer"
                className="about-contact-link"
              >
                <span className="about-contact-icon">in</span>
                <span>
                  <small>LinkedIn</small>
                  <strong>Connect on LinkedIn</strong>
                </span>
                <span className="about-contact-arrow">↗</span>
              </a>

              <a
                href="https://github.com/Rishabh8308"
                target="_blank"
                rel="noreferrer"
                className="about-contact-link"
              >
                <span className="about-contact-icon">⌘</span>
                <span>
                  <small>GitHub</small>
                  <strong>View GitHub Profile</strong>
                </span>
                <span className="about-contact-arrow">↗</span>
              </a>
            </div>
          </div>
        </section>

        <section className="about-final-cta">
          <span className="about-label">READY TO PRACTICE?</span>
          <h2>Make your next interview your best one.</h2>
          <p>
            Start practicing with an AI-powered interview experience today.
          </p>

          <button
            type="button"
            className="about-primary-button"
            onClick={() => navigate('/interview-mode')}
          >
            Start Interview
          </button>
        </section>
      </main>

      <footer className="about-footer">
        <div className="about-footer-inner">
          <button
            type="button"
            className="about-footer-logo"
            onClick={() => navigate('/')}
          >
            <span className="about-logo-mark">AI</span>
            <span>AI Mock Interview</span>
          </button>

          <p>Built to help you prepare with confidence.</p>

          <span>© {new Date().getFullYear()} AI Mock Interview</span>
        </div>
      </footer>
    </div>
  );
};

export default AboutUs;