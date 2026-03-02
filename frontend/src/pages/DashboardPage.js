// Dashboard Page - Main overview
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { tasksAPI, chatAPI } from '../services/api';

const StatCard = ({ label, value, icon, color, delay }) => (
  <div className={`fade-in delay-${delay}`} style={{
    background: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
    borderRadius: 'var(--radius-lg)', padding: '1.5rem',
    transition: 'all var(--transition-base)', cursor: 'default'
  }}
  onMouseEnter={e => {
    e.currentTarget.style.borderColor = 'rgba(124,106,247,0.3)';
    e.currentTarget.style.transform = 'translateY(-2px)';
    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
  }}
  onMouseLeave={e => {
    e.currentTarget.style.borderColor = 'var(--bg-border)';
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = 'none';
  }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: `${color}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.2rem'
      }}>{icon}</div>
    </div>
    <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1 }}>
      {value}
    </div>
    <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: 4 }}>{label}</div>
  </div>
);

const QuickAction = ({ icon, title, desc, to, onClick }) => {
  const navigate = useNavigate();
  return (
    <button onClick={onClick || (() => navigate(to))} style={{
      background: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
      borderRadius: 'var(--radius-md)', padding: '1rem',
      display: 'flex', alignItems: 'center', gap: 12,
      cursor: 'pointer', textAlign: 'left', transition: 'all var(--transition-fast)',
      fontFamily: 'var(--font-body)', color: 'var(--text-primary)', width: '100%'
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = 'var(--accent-primary)';
      e.currentTarget.style.background = 'var(--accent-primary-glow)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = 'var(--bg-border)';
      e.currentTarget.style.background = 'var(--bg-surface)';
    }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 8, background: 'var(--bg-elevated)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0
      }}>{icon}</div>
      <div>
        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{title}</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{desc}</div>
      </div>
      <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>→</span>
    </button>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, tasksRes] = await Promise.all([
          tasksAPI.getStats(),
          tasksAPI.getAll({ sort: '-createdAt', limit: 5, status: 'todo' })
        ]);
        setStats(statsRes.data);
        setTasks(tasksRes.data.tasks);
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, []);

  const getAnalysis = async () => {
    setLoadingAnalysis(true);
    try {
      const { data } = await chatAPI.analyzeProductivity();
      setAnalysis(data.analysis);
    } catch (e) {
      setAnalysis('Unable to generate analysis. Please configure your AI API key.');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const priorityColors = { urgent: '#f87171', high: '#fb923c', medium: '#fbbf24', low: '#4ade80' };

  return (
    <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div className="fade-in" style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: 4
        }}>
          {greeting}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '1rem', marginBottom: '2rem'
      }}>
        <StatCard delay="1" label="Total Tasks" value={stats?.total ?? '—'} icon="📋" color="#7c6af7" />
        <StatCard delay="2" label="Completed" value={stats?.completed ?? '—'} icon="✅" color="#4ade80" />
        <StatCard delay="3" label="In Progress" value={stats?.inProgress ?? '—'} icon="⚡" color="#fb923c" />
        <StatCard delay="4" label="Overdue" value={stats?.overdue ?? '—'} icon="⚠️" color="#f87171" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,380px)', gap: '1.5rem' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Quick actions */}
          <div className="fade-in delay-2" style={{
            background: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
            borderRadius: 'var(--radius-lg)', padding: '1.5rem'
          }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>
              Quick Actions
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <QuickAction icon="◈" title="Open AI Assistant" desc="Chat with Deeplix AI" to="/chat" />
              <QuickAction icon="+" title="Create New Task" desc="Add to your task list" to="/tasks" />
              <QuickAction icon="📊" title="Get AI Analysis" desc="Productivity insights" onClick={getAnalysis} />
            </div>
          </div>

          {/* AI Analysis panel */}
          {(analysis || loadingAnalysis) && (
            <div className="fade-in" style={{
              background: 'var(--bg-surface)', border: '1px solid rgba(124,106,247,0.3)',
              borderRadius: 'var(--radius-lg)', padding: '1.5rem',
              background: 'linear-gradient(135deg, rgba(124,106,247,0.05) 0%, var(--bg-surface) 100%)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 6, background: 'var(--grad-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem'
                }}>✦</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem' }}>
                  AI Productivity Analysis
                </h2>
              </div>
              {loadingAnalysis ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    border: '2px solid var(--bg-border)', borderTopColor: 'var(--accent-primary)',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  Analyzing your productivity patterns...
                </div>
              ) : (
                <div className="markdown-content" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(analysis) }} />
              )}
            </div>
          )}
        </div>

        {/* Right column - Recent tasks */}
        <div className="fade-in delay-3" style={{
          background: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
          borderRadius: 'var(--radius-lg)', padding: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>
              Upcoming Tasks
            </h2>
            <button onClick={() => navigate('/tasks')} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--accent-primary)', fontSize: '0.8rem', fontFamily: 'var(--font-body)'
            }}>View all →</button>
          </div>

          {tasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>✓</div>
              <div style={{ fontSize: '0.85rem' }}>No pending tasks!</div>
              <button onClick={() => navigate('/tasks')} style={{
                marginTop: 12, padding: '0.5rem 1rem',
                background: 'var(--accent-primary-glow)', border: '1px solid rgba(124,106,247,0.3)',
                borderRadius: 'var(--radius-md)', color: 'var(--accent-primary)',
                cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--font-body)'
              }}>
                + Add task
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tasks.map((task, i) => (
                <div key={task._id} className={`fade-in delay-${i+1}`} style={{
                  padding: '0.875rem', background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-md)', border: '1px solid var(--bg-border)',
                  transition: 'all var(--transition-fast)', cursor: 'pointer'
                }}
                onClick={() => navigate('/tasks')}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,106,247,0.3)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bg-border)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 6,
                      background: priorityColors[task.priority] || '#4a4964'
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: 2 }}>
                        {task.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {task.category} · {task.priority}
                        {task.aiGenerated && <span style={{ color: 'var(--accent-primary)', marginLeft: 6 }}>✦ AI</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .dashboard-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

// Simple markdown to HTML converter for AI responses
function formatMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gm, (line) => {
      if (line.match(/^<[hlu]/)) return line;
      return `<p>${line}</p>`;
    });
}
