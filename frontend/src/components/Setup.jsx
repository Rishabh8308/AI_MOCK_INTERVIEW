import { useState } from 'react';
import Dropdown from './Dropdown';

const Setup = ({ onStart }) => {
  const [formData, setFormData] = useState({
    role: 'Frontend Developer',
    experienceLevel: 'Mid-level',
    skills: 'React, JavaScript, CSS',
    interviewType: 'Technical',
    leetcodeUsername: '',
    githubUsername: '',
    sessionMode: 'New',
    persona: 'Friendly',
    pressureMode: false,
    liveMode: false
  });
  const [leetcodeData, setLeetcodeData] = useState(null);
  const [githubData, setGithubData] = useState(null);
  const [fetchingLeetcode, setFetchingLeetcode] = useState(false);
  const [fetchingGithub, setFetchingGithub] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFetchLeetCode = async () => {
    if (!formData.leetcodeUsername) return;
    setFetchingLeetcode(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/leetcode-profile/${formData.leetcodeUsername}`);
      const data = await response.json();
      if (response.ok) {
        setLeetcodeData(data);
      } else {
        alert(data.error || "Could not find profile. Make sure it's public.");
        setLeetcodeData(null);
      }
    } catch (err) {
      console.error(err);
      alert("Error fetching LeetCode profile.");
    } finally {
      setFetchingLeetcode(false);
    }
  };

  const handleFetchGitHub = async () => {
    if (!formData.githubUsername) return;
    setFetchingGithub(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/github-profile/${formData.githubUsername}`);
      const data = await response.json();
      if (response.ok) {
        setGithubData(data);
      } else {
        alert(data.error || "Could not find profile.");
        setGithubData(null);
      }
    } catch {
      alert("Error fetching GitHub profile.");
    } finally {
      setFetchingGithub(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (resumeFile) {
      data.append('resume', resumeFile);
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/start`, {
        method: 'POST',
        body: data
      });
      const respData = await response.json();
      if (response.ok) {
        onStart(respData.sessionId, respData.reply, formData.interviewType, formData.pressureMode, formData.liveMode);
      } else {
        alert('Error: ' + respData.error);
      }
    } catch(err) {
      console.error('Fetch error:', err);
      alert('Error connecting to backend: ' + err.message + '\n\nMake sure the backend is running and the domain is correct.');
    }
    setLoading(false);
  };

  return (
    <div className="glass-panel" style={{animationDelay: '0.1s'}}>
      <h2 className="subtitle">Configure your advanced mock interview.</h2>
      <form onSubmit={handleSubmit}>
        
        {/* Row 1 */}
        <div style={{display: 'flex', gap: '1rem', position: 'relative', zIndex: 10}}>
          <div className="form-group" style={{flex: 1}}>
            <label>Job Role</label>
            <Dropdown 
              options={[
                "Frontend Developer", 
                "Backend Developer", 
                "Full Stack Developer", 
                "Mobile Developer", 
                "Data Scientist", 
                "Machine Learning Engineer",
                "DevOps Engineer", 
                "Product Manager", 
                "UI/UX Designer",
                "QA Engineer",
                "Security Engineer"
              ]}
              value={formData.role}
              onChange={(val) => setFormData({...formData, role: val})}
            />
          </div>
          <div className="form-group" style={{flex: 1}}>
            <label>Experience Level</label>
            <Dropdown 
              options={["Junior", "Mid-level", "Senior", "Lead"]}
              value={formData.experienceLevel}
              onChange={(val) => setFormData({...formData, experienceLevel: val})}
            />
          </div>
        </div>

        {/* Row 2 */}
        <div style={{display: 'flex', gap: '1rem', position: 'relative', zIndex: 9}}>
          <div className="form-group" style={{flex: 1}}>
            <label>Key Skills</label>
            <input 
              type="text" required
              value={formData.skills}
              onChange={(e) => setFormData({...formData, skills: e.target.value})}
              placeholder="e.g. React, Node..."
            />
            <div className="skill-badges">
              {["React", "Node.js", "Python", "Java", "AWS", "SQL", "TypeScript", "System Design"].map(skill => (
                <span 
                  key={skill} 
                  className="skill-badge"
                  onClick={() => {
                    const current = formData.skills.trim();
                    if (!current.includes(skill)) {
                      setFormData({
                        ...formData, 
                        skills: current ? `${current}, ${skill}` : skill
                      });
                    }
                  }}
                >
                  +{skill}
                </span>
              ))}
            </div>
          </div>
          <div className="form-group" style={{flex: 1}}>
            <label>Interview Type</label>
            <Dropdown 
              options={["Technical", "Behavioral", "Mixed"]}
              value={formData.interviewType}
              onChange={(val) => setFormData({...formData, interviewType: val})}
            />
          </div>
        </div>

        {/* LeetCode & GitHub Section */}
        <div style={{display: 'flex', gap: '1rem', position: 'relative', zIndex: 8}}>
          <div className="form-group" style={{flex: 1}}>
            <label>LeetCode Username</label>
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <input 
                type="text"
                value={formData.leetcodeUsername}
                onChange={(e) => setFormData({...formData, leetcodeUsername: e.target.value})}
                placeholder="Username"
                style={{flex: 1}}
              />
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleFetchLeetCode}
                disabled={fetchingLeetcode || !formData.leetcodeUsername}
                style={{padding: '0 1rem', width: 'auto'}}
              >
                {fetchingLeetcode ? <div className="spinner" style={{width: '18px', height: '18px'}}></div> : 'Fetch'}
              </button>
            </div>
            {leetcodeData && (
              <div className="skill-badges" style={{marginTop: '0.5rem'}}>
                <span className="skill-badge" style={{background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderColor: '#22c55e'}}>Solved: {leetcodeData.submitStats?.acSubmissionNum.find(s => s.difficulty === 'All')?.count || 0}</span>
                <span className="skill-badge" style={{background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', borderColor: '#a855f7'}}>Rank: {leetcodeData.profile?.ranking || 'N/A'}</span>
              </div>
            )}
          </div>

          <div className="form-group" style={{flex: 1}}>
            <label>GitHub Username</label>
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <input 
                type="text"
                value={formData.githubUsername}
                onChange={(e) => setFormData({...formData, githubUsername: e.target.value})}
                placeholder="Username"
                style={{flex: 1}}
              />
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleFetchGitHub}
                disabled={fetchingGithub || !formData.githubUsername}
                style={{padding: '0 1rem', width: 'auto'}}
              >
                {fetchingGithub ? <div className="spinner" style={{width: '18px', height: '18px'}}></div> : 'Fetch'}
              </button>
            </div>
            {githubData && (
              <div style={{marginTop: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '0.8rem', border: '1px solid rgba(255,255,255,0.05)'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem'}}>
                   <img src={githubData.profile.avatarUrl} alt="avatar" style={{width: '24px', height: '24px', borderRadius: '50%'}} />
                   <span style={{fontSize: '0.85rem', fontWeight: 600}}>{githubData.profile.name || githubData.profile.username}</span>
                </div>
                <div className="skill-badges">
                  {githubData.repositories.slice(0, 3).map(repo => (
                    <span key={repo.name} className="skill-badge" style={{fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderStyle: 'dashed'}} title={repo.description}>
                      📦 {repo.name}
                    </span>
                  ))}
                  {githubData.repositories.length > 3 && <span style={{fontSize: '0.7rem', opacity: 0.5}}>+{githubData.repositories.length - 3} more</span>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* V2 Features Row */}
        <div style={{display: 'flex', gap: '1rem', alignItems: 'center', position: 'relative', zIndex: 8}}>
          <div className="form-group" style={{flex: 1}}>
            <label>Interviewer Persona</label>
            <Dropdown 
              options={["Friendly", "Strict", "Guru", "FAANG Style", "Startup Style", "Corporate Style"]}
              value={formData.persona}
              onChange={(val) => setFormData({...formData, persona: val})}
            />
          </div>
          <div className="form-group" style={{flex: 1, display: 'flex', gap: '10px', paddingTop: '10px'}}>
            <div 
              className={`switch-container ${formData.pressureMode ? 'active' : ''}`}
              onClick={() => setFormData({...formData, pressureMode: !formData.pressureMode})}
            >
              <span className="switch-label">🔥 Pressure Mode</span>
              <div className={`switch-track ${formData.pressureMode ? 'active' : ''}`}>
                <div className="switch-thumb"></div>
              </div>
            </div>

            <div 
              className={`switch-container ${formData.liveMode ? 'active' : ''}`}
              onClick={() => setFormData({...formData, liveMode: !formData.liveMode})}
            >
              <span className="switch-label">🎤 Live Mode</span>
              <div className={`switch-track ${formData.liveMode ? 'active' : ''}`}>
                <div className="switch-thumb"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="form-group slide-up" style={{position: 'relative', zIndex: 7}}>
          <label>Upload Resume (PDF only)</label>
          <input 
            type="file" 
            accept="application/pdf"
            onChange={(e) => setResumeFile(e.target.files[0])}
            style={{padding: '0.8rem', cursor: 'pointer'}}
          />
        </div>
        
        <button type="submit" className="btn btn-primary" disabled={loading} style={{marginTop: '1rem', animation: 'slideUp 0.6s ease forwards', animationDelay: '0.6s', opacity: 0}}>
          {loading ? <div className="spinner"></div> : 'Start Interview Session'}
        </button>
      </form>
    </div>
  );
};

export default Setup;
