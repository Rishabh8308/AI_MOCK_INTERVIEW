import { useNavigate } from 'react-router-dom';

const InterviewMode = () => {
  const navigate = useNavigate();

  return (
    <div className="interview-mode-page">
      <header className="interview-mode-header">
        <button
          type="button"
          className="interview-mode-logo"
          onClick={() => navigate('/')}
        >
          <span className="interview-mode-logo-mark">AI</span>
          <span>Mock Interview</span>
        </button>

        <button
          type="button"
          className="interview-mode-home"
          onClick={() => navigate('/')}
        >
          Home
        </button>
      </header>

      <main className="interview-mode-main">
        <div className="interview-mode-intro">
          <span className="interview-mode-label">
            START YOUR INTERVIEW
          </span>

          <h1>
            Choose how you want
            <br />
            <span>to practice.</span>
          </h1>

          <p>
            Select an interview format that matches how you want to
            prepare. You can configure your interview after making your
            choice.
          </p>
        </div>

        <div className="interview-mode-options">
          <button
            type="button"
            className="interview-mode-card"
            onClick={() => navigate('/interview?mode=normal')}
          >
            <div className="interview-mode-card-top">
              <div className="interview-mode-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H12l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5v-8Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <span className="interview-mode-arrow">→</span>
            </div>

            <div className="interview-mode-card-content">
              <h2>Normal Interview</h2>

              <p>
                Practice through a traditional interview experience with
                questions and responses on screen.
              </p>

              <span className="interview-mode-card-action">
                Continue with Normal
              </span>
            </div>
          </button>

          <button
            type="button"
            className="interview-mode-card"
            onClick={() => navigate('/interview?mode=voice')}
          >
            <div className="interview-mode-card-top">
              <div className="interview-mode-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect
                    x="8"
                    y="3"
                    width="8"
                    height="13"
                    rx="4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                  <path
                    d="M5 11a7 7 0 0 0 14 0M12 18v3M8.5 21h7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <span className="interview-mode-arrow">→</span>
            </div>

            <div className="interview-mode-card-content">
              <h2>Voice Interview</h2>

              <p>
                Practice a more natural interview using voice-based
                interaction with the AI interviewer.
              </p>

              <span className="interview-mode-card-action">
                Continue with Voice
              </span>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
};

export default InterviewMode;