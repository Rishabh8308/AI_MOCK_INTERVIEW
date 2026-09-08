import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        boxSizing: 'border-box',
        textAlign: 'center'
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '600px',
          padding: '3rem 2rem'
        }}
      >
        <div
          style={{
            fontSize: '5rem',
            fontWeight: 800,
            lineHeight: 1,
            marginBottom: '1rem',
            color: '#a855f7'
          }}
        >
          404
        </div>

        <h1
          style={{
            margin: '0 0 0.75rem',
            fontSize: '2rem'
          }}
        >
          Page Not Found
        </h1>

        <p
          style={{
            margin: '0 auto 2rem',
            maxWidth: '450px',
            color: 'var(--text-muted)',
            lineHeight: 1.6
          }}
        >
          The page you're looking for doesn't exist or may have
          been moved.
        </p>

        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.8rem 1.5rem',
            borderRadius: '10px',
            background: '#a855f7',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 600
          }}
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;