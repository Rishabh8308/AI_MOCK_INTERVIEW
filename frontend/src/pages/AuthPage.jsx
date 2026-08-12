import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/');
    });
  }, [navigate]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        if (error) throw error;
        setMessage("Check your email for the confirmation link!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    await supabase.auth.signInWithOAuth({ provider });
  };

  return (
    <div className="auth-page-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-panel auth-card" style={{ maxWidth: '450px', width: '100%', animation: 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <h1 className="title" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>AI Interviewer</h1>
        <p className="subtitle" style={{ marginBottom: '2rem' }}>
          {isSignUp ? 'Create your professional account' : 'Welcome back, candidate.'}
        </p>

        {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '0.8rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
        {message && <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', color: '#86efac', padding: '0.8rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>{message}</div>}

        <form onSubmit={handleAuth}>
          <div className="form-group" style={{ opacity: 1, animation: 'none' }}>
            <label>Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="name@company.com" 
              required 
            />
          </div>
          <div className="form-group" style={{ opacity: 1, animation: 'none' }}>
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
              required 
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '1rem', opacity: 1, animation: 'none' }}>
            {loading ? <div className="spinner"></div> : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div style={{ margin: '2rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>OR CONTINUE WITH</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => handleSocialLogin('github')} className="btn btn-secondary" style={{ flex: 1, display: 'flex', gap: '0.5rem' }}>
             GitHub
          </button>
          <button onClick={() => handleSocialLogin('google')} className="btn btn-secondary" style={{ flex: 1, display: 'flex', gap: '0.5rem' }}>
             Google
          </button>
        </div>

        <p style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <button 
            onClick={() => setIsSignUp(!isSignUp)} 
            style={{ background: 'none', border: 'none', color: '#a855f7', fontWeight: 600, marginLeft: '0.5rem', cursor: 'pointer' }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up Free'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
