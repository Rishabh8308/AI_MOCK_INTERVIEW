import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, avgScore: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/auth');
          return;
        }

        const response = await fetch('/api/user/interviews', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setInterviews(data);
          
          // Calculate stats
          const total = data.length;
          const completedWithScore = data.filter(i => i.results && i.results.length > 0);
          const avg = completedWithScore.length > 0
            ? Math.round(completedWithScore.reduce((acc, curr) => acc + Number(curr.results[0].overallScore || 0), 0) / completedWithScore.length)
            : 0;
            
          setStats({ total, avgScore: avg });
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [navigate]);

  return (
    <div className="dashboard-page" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 className="title" style={{ textAlign: 'left', fontSize: '2.5rem' }}>Dashboard.</h1>
          <p style={{ color: 'var(--text-muted)' }}>Welcome back! Here is your interview performance at a glance.</p>
        </div>
        <Link to="/" className="btn btn-primary" style={{ width: 'auto', textDecoration: 'none' }}>
           Start New Session
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
        <div className="glass-panel stat-card" style={{ padding: '2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600, letterSpacing: '0.05em' }}>TOTAL ATTEMPTS</div>
          <div style={{ fontSize: '3rem', fontWeight: 800, background: 'linear-gradient(to right, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{stats.total}</div>
          <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', fontSize: '5rem', opacity: 0.05, fontWeight: 900 }}>📊</div>
        </div>
        <div className="glass-panel stat-card" style={{ padding: '2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600, letterSpacing: '0.05em' }}>AVG. OVERALL SCORE</div>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: stats.avgScore > 70 ? '#22c55e' : '#f59e0b' }}>{stats.avgScore}%</div>
          <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', fontSize: '5rem', opacity: 0.05, fontWeight: 900 }}>⭐</div>
        </div>
        <div className="glass-panel stat-card" style={{ padding: '2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600, letterSpacing: '0.05em' }}>LATEST PERFORMANCE</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{interviews.length > 0 ? interviews[0].role : 'N/A'}</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {interviews.length > 0 ? new Date(interviews[0].startedAt).toLocaleDateString() : 'No data yet'}
          </p>
        </div>
      </div>

      {/* History Table */}
      <div className="glass-panel history-section" style={{ padding: '2rem' }}>
        <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem', fontWeight: 700 }}>Interview History</h2>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div className="spinner" style={{ margin: '0 auto', width: '40px', height: '40px' }}></div>
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading your records...</p>
          </div>
        ) : interviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '20px' }}>
             <span style={{ fontSize: '3rem' }}>📝</span>
             <h3 style={{ marginTop: '1rem' }}>No interviews yet</h3>
             <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Your past interview sessions and evaluations will appear here.</p>
             <Link to="/" className="btn btn-secondary" style={{ width: 'auto', textDecoration: 'none' }}>
                Conduct your first interview
             </Link>
          </div>
        ) : (
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>DATE</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>ROLE</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>TYPE</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>SCORE</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {interviews.map((session) => (
                  <tr key={session.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.3s ease' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '1.2rem 1rem' }}>{new Date(session.startedAt).toLocaleDateString()}</td>
                    <td style={{ padding: '1.2rem 1rem', fontWeight: 600 }}>{session.role || 'General Interview'}</td>
                    <td style={{ padding: '1.2rem 1rem' }}>
                      <span className="skill-badge" style={{ cursor: 'default' }}>{session.experienceLevel}</span>
                    </td>
                    <td style={{ padding: '1.2rem 1rem' }}>
                      <span style={{ 
                        fontWeight: 700, 
                        color: (session.results?.[0]?.overallScore || 0) > 70 ? '#22c55e' : '#f59e0b'
                      }}>
                        {session.results?.[0]?.overallScore ? `${Math.round(session.results[0].overallScore)}%` : '---'}
                      </span>
                    </td>
                    <td style={{ padding: '1.2rem 1rem' }}>
                      <Link to={`/interviews/${session.id}`} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
                        View Report
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ marginTop: '3rem', textAlign: 'center' }}>
         <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>← Back to Home</Link>
      </div>
    </div>
  );
};

export default Dashboard;
