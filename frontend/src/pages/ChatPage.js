// Chat Page - AI Assistant Interface
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatAPI } from '../services/api';
import deeplixMark from '../assets/deeplix-Logo.png';

const STARTERS = [
  { icon: '📋', text: 'Help me plan my week and create tasks' },
  { icon: '✍️', text: 'Write a professional email for me' },
  { icon: '🎯', text: 'Analyze my productivity and give tips' },
  { icon: '🧠', text: 'Help me break down a complex project' },
];

function Message({ msg, isLatest }) {
  const isUser = msg.role === 'user';

  return (
    <div className={isLatest ? 'fade-in' : ''} style={{
      display: 'flex', gap: '0.75rem', padding: '1rem 0',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      maxWidth: '100%'
    }}>
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.8rem', fontWeight: 700, color: 'white',
          boxShadow: 'var(--shadow-glow-sm)', marginTop: 2,
          overflow: 'hidden'
        }}>
          <img src={deeplixMark} alt="Deeplix AI" style={{ width: '100%', height: '100%', display: 'block' }} />
        </div>
      )}

      <div style={{
        maxWidth: isUser ? '70%' : '85%',
        background: isUser ? 'var(--grad-primary)' : 'var(--bg-surface)',
        border: isUser ? 'none' : '1px solid var(--bg-border)',
        borderRadius: isUser ? '18px 18px 6px 18px' : '18px 18px 18px 6px',
        padding: '0.75rem 1rem',
        boxShadow: isUser ? 'var(--shadow-glow-sm)' : 'var(--shadow-sm)'
      }}>
        {isUser ? (
          <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'white', margin: 0 }}>{msg.content}</p>
        ) : (
          <div className="markdown-content" style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}
            dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
          />
        )}

        {msg.metadata?.processingTime && (
          <div style={{ fontSize: '0.7rem', color: isUser ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)', marginTop: 6 }}>
            {(msg.metadata.processingTime / 1000).toFixed(1)}s · {msg.metadata.intent || 'general'}
          </div>
        )}
      </div>

      {isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.85rem', fontWeight: 700, marginTop: 2, color: 'var(--text-secondary)'
        }}>U</div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem 0', alignItems: 'flex-start' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: 'var(--grad-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.8rem', fontWeight: 700, color: 'white', boxShadow: 'var(--shadow-glow-sm)'
      }}>N</div>
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
        borderRadius: '18px 18px 18px 6px', padding: '0.875rem 1.1rem',
        display: 'flex', gap: 5, alignItems: 'center'
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--accent-primary)',
            animation: 'typing 1.2s ease infinite',
            animationDelay: `${i * 0.2}s`
          }} />
        ))}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { sessionId: urlSessionId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(urlSessionId || null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // Load sessions
  const loadSessions = useCallback(async () => {
    try {
      const { data } = await chatAPI.getSessions({ limit: 30 });
      setSessions(data.sessions || data || []);
    } catch (e) {}
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  // Load specific session
  useEffect(() => {
    if (urlSessionId) {
      setLoadingSession(true);
      chatAPI.getSession(urlSessionId)
        .then(({ data }) => {
          setMessages(data.session?.messages || data.messages || []);
          setCurrentSessionId(urlSessionId);
        })
        .catch(() => navigate('/chat'))
        .finally(() => setLoadingSession(false));
    }
  }, [urlSessionId, navigate]);

  const startNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    navigate('/chat');
    inputRef.current?.focus();
  };

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || sending) return;
    setInput('');
    setError('');

    // Optimistically add user message
    const userMsg = { role: 'user', content: msg, _id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);

    try {
      const { data } = await chatAPI.sendMessage({
        message: msg,
        sessionId: currentSessionId
      });

      setCurrentSessionId(data.sessionId);
      navigate(`/chat/${data.sessionId}`, { replace: true });

      // Add AI response
      setMessages(prev => [...prev, { ...data.message, _id: Date.now() + 1 }]);

      // Refresh sessions list
      loadSessions();

      if (data.tasksCreated > 0) {
        setError(`✦ ${data.tasksCreated} task${data.tasksCreated > 1 ? 's' : ''} created automatically!`);
        setTimeout(() => setError(''), 4000);
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to get response. Please try again.';
      setError(errMsg);
      setMessages(prev => prev.filter(m => m._id !== userMsg._id));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const deleteSession = async (id, e) => {
    e.stopPropagation();
    try {
      await chatAPI.deleteSession(id);
      if (currentSessionId === id) startNewChat();
      loadSessions();
    } catch (e) {}
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Session sidebar */}
      {sidebarOpen && (
        <div style={{
          width: 260, background: 'var(--bg-surface)', borderRight: '1px solid var(--bg-border)',
          display: 'flex', flexDirection: 'column', flexShrink: 0
        }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--bg-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>CONVERSATIONS</span>
              <button onClick={() => setSidebarOpen(false)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', fontSize: '0.9rem', fontFamily: 'var(--font-body)'
              }}>✕</button>
            </div>
            <button onClick={startNewChat} style={{
              width: '100%', padding: '0.6rem', background: 'var(--bg-elevated)',
              border: '1px dashed var(--bg-border)', borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem',
              fontFamily: 'var(--font-body)', transition: 'all var(--transition-fast)',
              display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.color = 'var(--accent-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bg-border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              + New chat
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
            {sessions.map(session => (
              <div key={session._id}
                onClick={() => navigate(`/chat/${session._id}`)}
                style={{
                  padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  background: currentSessionId === session._id ? 'var(--accent-primary-glow)' : 'transparent',
                  border: `1px solid ${currentSessionId === session._id ? 'rgba(124,106,247,0.2)' : 'transparent'}`,
                  marginBottom: 2, transition: 'all var(--transition-fast)',
                  display: 'flex', alignItems: 'flex-start', gap: 8
                }}
                onMouseEnter={e => { if (currentSessionId !== session._id) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                onMouseLeave={e => { if (currentSessionId !== session._id) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.8rem', fontWeight: 500,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    color: currentSessionId === session._id ? 'var(--accent-primary)' : 'var(--text-primary)'
                  }}>
                    {session.title}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {session.preview}
                  </div>
                </div>
                <button onClick={(e) => deleteSession(session._id, e)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: '0.8rem', padding: '0 2px',
                  opacity: 0, transition: 'opacity var(--transition-fast)', flexShrink: 0
                }}
                className="delete-btn"
                >✕</button>
              </div>
            ))}

            {sessions.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No conversations yet.<br />Start chatting!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Chat header */}
        <div style={{
          padding: '0.875rem 1.5rem', borderBottom: '1px solid var(--bg-border)',
          display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-surface)'
        }}>
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)', fontSize: '1rem', padding: 4
            }}>☰</button>
          )}
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.85rem', fontWeight: 700, color: 'white', flexShrink: 0,
            boxShadow: 'var(--shadow-glow-sm)', animation: 'pulse-glow 3s ease infinite',
            overflow: 'hidden'
          }}>
            <img src={deeplixMark} alt="Deeplix AI" style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Deeplix AI</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-green)' }} />
              Online · AI-powered
            </div>
          </div>
          {messages.length > 0 && (
            <button onClick={startNewChat} style={{
              marginLeft: 'auto', padding: '0.4rem 0.875rem',
              background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)',
              borderRadius: 'var(--radius-full)', color: 'var(--text-secondary)',
              cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'var(--font-body)',
              transition: 'all var(--transition-fast)'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.color = 'var(--accent-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bg-border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              + New chat
            </button>
          )}
        </div>

        {/* Messages area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.5rem' }}>
          {loadingSession ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                border: '2px solid var(--bg-border)', borderTopColor: 'var(--accent-primary)',
                animation: 'spin 0.8s linear infinite'
              }} />
            </div>
          ) : messages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '2rem' }}>
              <div className="fade-in" style={{
                width: 64, height: 64, borderRadius: '50%', background: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', fontWeight: 800, color: 'white',
                boxShadow: 'var(--shadow-glow)', marginBottom: '1.5rem',
                animation: 'pulse-glow 3s ease infinite',
                overflow: 'hidden'
              }}>
                <img src={deeplixMark} alt="Deeplix AI" style={{ width: '100%', height: '100%', display: 'block' }} />
              </div>
              <h2 className="fade-in delay-1" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.5rem', marginBottom: 8 }}>
                How can I help you today?
              </h2>
              <p className="fade-in delay-2" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem', textAlign: 'center', maxWidth: 400 }}>
                I'm Deeplix, your AI productivity assistant. I can help with tasks, planning, writing, and much more.
              </p>

              <div className="fade-in delay-3" style={{
                display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', width: '100%', maxWidth: 500
              }}>
                {STARTERS.map((s, i) => (
                  <button key={i} onClick={() => send(s.text)} style={{
                    padding: '0.875rem 1rem', background: 'var(--bg-surface)',
                    border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-md)',
                    cursor: 'pointer', textAlign: 'left', fontSize: '0.82rem',
                    color: 'var(--text-secondary)', transition: 'all var(--transition-fast)',
                    fontFamily: 'var(--font-body)', display: 'flex', gap: 8, alignItems: 'flex-start'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--accent-primary-glow)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bg-border)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-surface)'; }}
                  >
                    <span>{s.icon}</span>
                    <span>{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ paddingBottom: '1rem' }}>
              {messages.map((msg, i) => (
                <Message key={msg._id || i} msg={msg} isLatest={i === messages.length - 1 && msg.role === 'assistant'} />
              ))}
              {sending && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Notification bar */}
        {error && (
          <div style={{
            margin: '0 1.5rem 0.5rem', padding: '0.6rem 1rem',
            background: error.startsWith('✦') ? 'rgba(124,106,247,0.1)' : 'rgba(248,113,113,0.1)',
            border: `1px solid ${error.startsWith('✦') ? 'rgba(124,106,247,0.3)' : 'rgba(248,113,113,0.3)'}`,
            borderRadius: 'var(--radius-md)',
            color: error.startsWith('✦') ? 'var(--accent-primary)' : 'var(--accent-red)',
            fontSize: '0.82rem'
          }}>
            {error}
          </div>
        )}

        {/* Input area */}
        <div style={{ padding: '1rem 1.5rem', background: 'var(--bg-surface)', borderTop: '1px solid var(--bg-border)' }}>
          <div style={{
            display: 'flex', gap: 10, alignItems: 'flex-end',
            background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)',
            borderRadius: 'var(--radius-lg)', padding: '0.5rem 0.5rem 0.5rem 1rem',
            transition: 'border-color var(--transition-fast)'
          }}
          onFocus={() => {}}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(124,106,247,0.4)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--bg-border)'}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Message Deeplix AI... (Shift+Enter for new line)"
              rows={1}
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                resize: 'none', color: 'var(--text-primary)', fontSize: '0.9rem',
                lineHeight: 1.6, fontFamily: 'var(--font-body)', paddingTop: '0.35rem',
                maxHeight: 160, overflowY: 'auto'
              }}
              onInput={e => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
              }}
              disabled={sending}
            />
            <button onClick={() => send()} disabled={!input.trim() || sending} style={{
              width: 36, height: 36, borderRadius: 10,
              background: input.trim() && !sending ? 'var(--grad-primary)' : 'var(--bg-border)',
              border: 'none', cursor: input.trim() && !sending ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', color: 'white', transition: 'all var(--transition-fast)',
              boxShadow: input.trim() && !sending ? 'var(--shadow-glow-sm)' : 'none', flexShrink: 0
            }}>
              {sending ? (
                <div style={{
                  width: 14, height: 14, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white',
                  animation: 'spin 0.8s linear infinite'
                }} />
              ) : '↑'}
            </button>
          </div>
          <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 6 }}>
            Deeplix AI can make mistakes. Tasks mentioned in chat may be auto-created.
          </div>
        </div>
      </div>

      <style>{`
        .delete-btn { opacity: 0 !important; }
        div:hover > .delete-btn,
        div:hover .delete-btn { opacity: 1 !important; }
      `}</style>
    </div>
  );
}

// Simple markdown formatter
function formatMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^---$/gm, '<hr/>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/^[\d]+\. (.+)$/gm, '<li>$1</li>')
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .split('\n\n')
    .map(block => {
      if (block.match(/^<[h1-6|pre|ul|ol|blockquote|hr]/)) return block;
      if (block.includes('<li>')) return `<ul>${block}</ul>`;
      return `<p>${block.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('');
}
