import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const InterviewDetails = () => {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/auth');
          return;
        }

        const response = await fetch(`/api/interviews/${id}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        const data = await response.json();
        
        if (data && !data.error) {
          setResult(data);
        } else {
          console.error("Result not found");
        }
      } catch (err) {
        console.error("Failed to fetch interview details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, navigate]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: '50px', height: '50px' }}></div>
      </div>
    );
  }

  if (!result) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem' }}>
        <h2>Interview Report Not Found</h2>
        <Link to="/dashboard" className="btn btn-secondary" style={{ marginTop: '2rem', display: 'inline-block' }}>Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="details-page" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ← Back to Dashboard
        </Link>
      </div>

      <div className="glass-panel" style={{ padding: '3rem', animation: 'slideUp 0.6s ease forwards' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', margin: 0 }}>{result.session.role}</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              {new Date(result.createdAt).toLocaleDateString()} at {new Date(result.createdAt).toLocaleTimeString()}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: result.overallScore > 70 ? '#22c55e' : '#f59e0b' }}>
              {Math.round(result.overallScore)}%
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>OVERALL SCORE</div>
          </div>
        </div>

        {/* Video Recording Playback */}
        {result.videoRecordingUrl && (
          <div className="video-section" style={{ marginBottom: '3rem', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: 'black' }}>
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              🎥 SESSION RECORDING
            </div>
            <video 
              src={result.videoRecordingUrl} 
              controls 
              style={{ width: '100%', maxHeight: '500px', display: 'block' }}
              poster="/video-placeholder.png"
            />
          </div>
        )}

        {/* Score Breakdown */}
        <div className="score-breakdown" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '3rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
          <div className="score-item" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{Math.round(result.communicationScore)}%</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>COMMUNICATION</div>
          </div>
          <div className="score-item" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{Math.round(result.technicalScore)}%</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>TECHNICAL DEPTH</div>
          </div>
          <div className="score-item" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{Math.round(result.confidenceScore)}%</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>CONFIDENCE</div>
          </div>
          <div className="score-item" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{Math.round(result.starMethodScore)}%</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>STAR METHOD</div>
          </div>
        </div>

        {/* AI Report Content */}
        <div className="report-content" style={{ background: 'rgba(0,0,0,0.2)', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🤖</span> AI Evaluation Report
          </h3>
          <div style={{ 
            whiteSpace: 'pre-wrap', 
            lineHeight: '1.8', 
            color: '#e2e8f0', 
            fontSize: '1rem' 
          }}>
            {result.aiFeedback}
          </div>
        </div>

        <div style={{ marginTop: '3rem', textAlign: 'center' }}>
           <Link to="/" className="btn btn-primary" style={{ width: 'auto', textDecoration: 'none' }}>
              Practice Another One
           </Link>
        </div>
      </div>
    </div>
  );
};

export default InterviewDetails;
