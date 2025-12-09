import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Import Hook
import './Login.css';

export const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate(); // 2. Initialize Hook
  
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [stage, setStage] = useState('auth'); 
  
  const [formData, setFormData] = useState({ 
    login: '', email: '', password: '', otp: '' 
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // --- REGISTER INIT ---
  const handleRegisterInit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/register-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: formData.login, 
          email: formData.email, 
          password: formData.password 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessMsg(`✅ ${data.message}`);
      setStage('otp'); 
    } catch (err) { setError(err.message); } 
    finally { setLoading(false); }
  };

  // --- REGISTER VERIFY ---
  const handleRegisterVerify = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: formData.otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setSuccessMsg("🎉 Account Created! Please Login.");
      setIsLoginMode(true); 
      setStage('auth');     
      setFormData({ ...formData, otp: '' });
    } catch (err) { setError(err.message); } 
    finally { setLoading(false); }
  };

  // --- LOGIN INIT ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setSuccessMsg(''); setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: formData.login, password: formData.password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      if (data.stage === 'otp') {
        setStage('otp');
        setSuccessMsg(data.message);
      }
    } catch (err) { setError(err.message); } 
    finally { setLoading(false); }
  };

  // --- LOGIN VERIFY (THE IMPORTANT PART) ---
  const handleLoginVerify = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: formData.login, otp: formData.otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // Save Token & User Info
      sessionStorage.setItem('civic_token', data.token);
      sessionStorage.setItem('civic_user', JSON.stringify(data.user));
      
      // Trigger App State Update
      onLoginSuccess();

      // 3. CHECK USER ROLE AND REDIRECT
      if (data.user.login === 'admin') {
        console.log("⚡ Admin Detected: Redirecting to Command Center...");
        navigate('/admin');
      } else {
        navigate('/');
      }

    } catch (err) { setError(err.message); } 
    finally { setLoading(false); }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">🔐 CivicChain Cloud</h1>
        <p className="login-subtitle">
          {isLoginMode ? "Secure Decentralized Access" : "Join the Private Network"}
        </p>
        
        {error && <div className="error-message">❌ {error}</div>}
        {successMsg && <div className="success-message" style={{color:'green', background:'#dcfce7', padding:'10px', borderRadius:'8px', marginBottom:'10px'}}>{successMsg}</div>}

        {/* OTP FORM */}
        {stage === 'otp' ? (
          <form onSubmit={isLoginMode ? handleLoginVerify : handleRegisterVerify}>
            <div className="form-group">
              <label>Enter Verification Code</label>
              <input type="text" className="otp-input" value={formData.otp} onChange={e => setFormData({...formData, otp: e.target.value})} required />
            </div>
            <button type="submit" disabled={loading} className="verify-btn">
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
            <button type="button" className="back-btn" onClick={() => setStage('auth')}>Back</button>
          </form>
        ) : (
          /* MAIN FORM */
          <form onSubmit={isLoginMode ? handleLogin : handleRegisterInit}>
            <div className="form-group">
              <label>Username</label>
              <input type="text" value={formData.login} onChange={e => setFormData({...formData, login: e.target.value})} required />
            </div>
            {!isLoginMode && (
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
              </div>
            )}
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
            </div>
            <button type="submit" disabled={loading} style={{background: isLoginMode ? '#2563eb' : '#10b981'}}>
              {loading ? 'Processing...' : (isLoginMode ? 'Login' : 'Send Verification Code')}
            </button>
            <div style={{marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '1rem'}}>
              <button type="button" className="back-btn" onClick={() => { setIsLoginMode(!isLoginMode); setError(''); setSuccessMsg(''); setStage('auth'); }}>
                {isLoginMode ? "New User? Register" : "Have an account? Login"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};