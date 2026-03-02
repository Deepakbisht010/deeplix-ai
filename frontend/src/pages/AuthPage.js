// Auth Page - Login & Registration
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import deeplixMark from '../assets/deeplix-Logo.png';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', background: 'var(--bg-base)',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Background effects */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(124,106,247,0.18) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', top: '20%', left: '10%', width: 300, height: 300,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,106,247,0.07) 0%, transparent 70%)',
        filter: 'blur(40px)', pointerEvents: 'none'
      }} />

      {/* Left panel - branding */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '3rem', maxWidth: 600,
        borderRight: '1px solid var(--bg-border)'
      }} className="fade-in">
        <div style={{ marginBottom: '3rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            marginBottom: '2rem'
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-glow-sm)',
              overflow: 'hidden'
            }}>
              <img src={deeplixMark} alt="Deeplix AI" style={{ width: '100%', height: '100%', display: 'block' }} />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>
              Deeplix AI
            </span>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: 'clamp(2rem, 4vw, 3.5rem)', lineHeight: 1.1,
            marginBottom: '1.5rem'
          }}>
            Your intelligent<br />
            <span style={{
              background: 'var(--grad-primary)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>
              productivity OS
            </span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.7, maxWidth: 420 }}>
            Deeplix combines AI-powered conversation, smart task management, and productivity analytics into one seamless workspace.
          </p>
        </div>

        {/* Feature bullets */}
        {[
          ['⚡', 'Real-time AI assistant'],
          ['📋', 'Smart task creation & prioritization'],
          ['📊', 'Productivity insights & analytics'],
          ['🌙', 'Beautiful dark & light interface'],
        ].map(([icon, text], i) => (
          <div key={i} className={`fade-in delay-${i+1}`} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            marginBottom: '0.75rem', color: 'var(--text-secondary)'
          }}>
            <span style={{ fontSize: '1.1rem' }}>{icon}</span>
            <span style={{ fontSize: '0.9rem' }}>{text}</span>
          </div>
        ))}
      </div>

      {/* Right panel - form */}
      <div style={{
        width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '3rem',
        background: 'var(--bg-surface)'
      }}>
        <div className="scale-in" style={{ maxWidth: 380, width: '100%', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: '1.75rem', marginBottom: 8
          }}>
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
            {mode === 'login' ? 'Sign in to your Deeplix workspace' : 'Start your productivity journey'}
          </p>

          {/* Tab switcher */}
          <div style={{
            display: 'flex', background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-md)', padding: 4, marginBottom: '1.5rem'
          }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                style={{
                  flex: 1, padding: '0.5rem', border: 'none', cursor: 'pointer',
                  borderRadius: 'calc(var(--radius-md) - 4px)',
                  background: mode === m ? 'var(--accent-primary)' : 'transparent',
                  color: mode === m ? 'white' : 'var(--text-secondary)',
                  fontSize: '0.85rem', fontWeight: 600, transition: 'all var(--transition-fast)',
                  fontFamily: 'var(--font-body)'
                }}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={submit}>
            {mode === 'register' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  FULL NAME
                </label>
                <input
                  name="name" value={form.name} onChange={handle}
                  placeholder="Alex Johnson" required
                  style={{
                    width: '100%', padding: '0.75rem 1rem',
                    background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)',
                    borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
                    fontSize: '0.9rem', transition: 'border-color var(--transition-fast)',
                    outline: 'none'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--bg-border)'}
                />
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                EMAIL ADDRESS
              </label>
              <input
                name="email" type="email" value={form.email} onChange={handle}
                placeholder="you@company.com" required
                style={{
                  width: '100%', padding: '0.75rem 1rem',
                  background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)',
                  borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
                  fontSize: '0.9rem', transition: 'border-color var(--transition-fast)',
                  outline: 'none'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--bg-border)'}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                PASSWORD
              </label>
              <input
                name="password" type="password" value={form.password} onChange={handle}
                placeholder={mode === 'register' ? 'Minimum 6 characters' : '••••••••'} required
                style={{
                  width: '100%', padding: '0.75rem 1rem',
                  background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)',
                  borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
                  fontSize: '0.9rem', transition: 'border-color var(--transition-fast)',
                  outline: 'none'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--bg-border)'}
              />
            </div>

            {error && (
              <div style={{
                padding: '0.75rem 1rem', background: 'rgba(248,113,113,0.1)',
                border: '1px solid rgba(248,113,113,0.3)', borderRadius: 'var(--radius-md)',
                color: 'var(--accent-red)', fontSize: '0.85rem', marginBottom: '1rem'
              }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '0.875rem',
              background: loading ? 'var(--bg-elevated)' : 'var(--grad-primary)',
              border: 'none', borderRadius: 'var(--radius-md)',
              color: 'white', fontSize: '0.95rem', fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all var(--transition-fast)',
              fontFamily: 'var(--font-body)',
              boxShadow: loading ? 'none' : 'var(--shadow-glow-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}>
              {loading ? (
                <>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white', animation: 'spin 0.8s linear infinite'
                  }} />
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                mode === 'login' ? '→ Sign In' : '→ Create Account'
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Demo: demo@nexusai.com / demo123456
          </p>
        </div>
      </div>

      {/* Mobile responsive */}
      <style>{`
        @media (max-width: 768px) {
          .auth-left { display: none !important; }
        }
      `}</style>
    </div>
  );
}
