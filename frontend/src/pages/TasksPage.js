// Tasks Page - Full Task Management
import React, { useState, useEffect, useCallback } from 'react';
import { tasksAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const PRIORITIES = ['all', 'urgent', 'high', 'medium', 'low'];
const STATUSES = ['all', 'todo', 'in-progress', 'completed', 'cancelled'];
const PRIORITY_COLORS = { urgent: '#f87171', high: '#fb923c', medium: '#fbbf24', low: '#4ade80' };
const STATUS_COLORS = { todo: '#8b8aa8', 'in-progress': '#7c6af7', completed: '#4ade80', cancelled: '#4a4964' };

function TaskCard({ task, onUpdate, onDelete }) {
  const [loading, setLoading] = useState(false);

  const updateStatus = async (newStatus) => {
    setLoading(true);
    try {
      await onUpdate(task._id, { status: newStatus });
    } finally {
      setLoading(false);
    }
  };

  const nextStatus = {
    'todo': 'in-progress',
    'in-progress': 'completed',
    'completed': 'todo'
  };

  return (
    <div className="fade-in" style={{
      background: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
      borderRadius: 'var(--radius-md)', padding: '1rem',
      transition: 'all var(--transition-fast)',
      borderLeft: `3px solid ${PRIORITY_COLORS[task.priority] || 'var(--bg-border)'}`,
      opacity: task.status === 'cancelled' ? 0.5 : 1
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(2px)'; e.currentTarget.style.borderColor = 'rgba(124,106,247,0.3)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.borderColor = 'var(--bg-border)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Status toggle button */}
        <button onClick={() => updateStatus(nextStatus[task.status] || 'todo')}
          disabled={loading || task.status === 'cancelled'}
          style={{
            width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 2,
            border: `2px solid ${STATUS_COLORS[task.status] || 'var(--bg-border)'}`,
            background: task.status === 'completed' ? STATUS_COLORS.completed : 'transparent',
            cursor: loading || task.status === 'cancelled' ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all var(--transition-fast)'
          }}>
          {task.status === 'completed' && <span style={{ color: 'var(--bg-base)', fontSize: '0.65rem' }}>✓</span>}
          {task.status === 'in-progress' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS['in-progress'] }} />}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 500, fontSize: '0.88rem', marginBottom: 4,
            textDecoration: task.status === 'completed' ? 'line-through' : 'none',
            color: task.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)'
          }}>
            {task.title}
            {task.aiGenerated && (
              <span style={{
                marginLeft: 6, fontSize: '0.65rem', background: 'var(--accent-primary-glow)',
                color: 'var(--accent-primary)', padding: '1px 5px', borderRadius: 4,
                border: '1px solid rgba(124,106,247,0.2)'
              }}>✦ AI</span>
            )}
          </div>

          {task.description && (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {task.description}
            </div>
          )}

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              fontSize: '0.68rem', padding: '2px 7px', borderRadius: 'var(--radius-full)',
              background: `${PRIORITY_COLORS[task.priority]}20`,
              color: PRIORITY_COLORS[task.priority],
              border: `1px solid ${PRIORITY_COLORS[task.priority]}40`
            }}>{task.priority}</span>

            <span style={{
              fontSize: '0.68rem', padding: '2px 7px', borderRadius: 'var(--radius-full)',
              background: `${STATUS_COLORS[task.status]}20`,
              color: STATUS_COLORS[task.status],
              border: `1px solid ${STATUS_COLORS[task.status]}40`
            }}>{task.status}</span>

            {task.category && (
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {task.category}
              </span>
            )}

            {task.dueDate && (
              <span style={{
                fontSize: '0.68rem', color: new Date(task.dueDate) < new Date() && task.status !== 'completed'
                  ? 'var(--accent-red)' : 'var(--text-muted)'
              }}>
                📅 {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Delete button */}
        <button onClick={() => onDelete(task._id)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', fontSize: '0.9rem', padding: 4,
          borderRadius: 4, transition: 'color var(--transition-fast)', flexShrink: 0
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-red)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >✕</button>
      </div>
    </div>
  );
}

function AddTaskModal({ onAdd, onClose }) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', category: '', dueDate: '' });
  const [loading, setLoading] = useState(false);
  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);
    try {
      await onAdd(form);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem', backdropFilter: 'blur(4px)'
    }} onClick={onClose}>
      <div className="scale-in" style={{
        background: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
        borderRadius: 'var(--radius-xl)', padding: '2rem', width: '100%', maxWidth: 500,
        boxShadow: 'var(--shadow-lg)'
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1.5rem', fontSize: '1.2rem' }}>
          New Task
        </h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { name: 'title', label: 'TITLE *', placeholder: 'What needs to be done?', required: true },
            { name: 'description', label: 'DESCRIPTION', placeholder: 'Optional details...' },
            { name: 'category', label: 'CATEGORY', placeholder: 'Work, Personal, Learning...' },
          ].map(({ name, label, placeholder, required }) => (
            <div key={name}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 5, color: 'var(--text-secondary)' }}>{label}</label>
              {name === 'description' ? (
                <textarea name={name} value={form[name]} onChange={handle} placeholder={placeholder}
                  rows={2} style={{
                    width: '100%', padding: '0.65rem 0.875rem', background: 'var(--bg-elevated)',
                    border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none',
                    resize: 'vertical', fontFamily: 'var(--font-body)'
                  }} />
              ) : (
                <input name={name} value={form[name]} onChange={handle} placeholder={placeholder} required={required}
                  style={{
                    width: '100%', padding: '0.65rem 0.875rem', background: 'var(--bg-elevated)',
                    border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
                  }} />
              )}
            </div>
          ))}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 5, color: 'var(--text-secondary)' }}>PRIORITY</label>
              <select name="priority" value={form.priority} onChange={handle} style={{
                width: '100%', padding: '0.65rem 0.875rem', background: 'var(--bg-elevated)',
                border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
              }}>
                {['urgent', 'high', 'medium', 'low'].map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 5, color: 'var(--text-secondary)' }}>DUE DATE</label>
              <input type="date" name="dueDate" value={form.dueDate} onChange={handle}
                style={{
                  width: '100%', padding: '0.65rem 0.875rem', background: 'var(--bg-elevated)',
                  border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
                }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '0.75rem', background: 'var(--bg-elevated)',
              border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-body)'
            }}>Cancel</button>
            <button type="submit" disabled={loading} style={{
              flex: 1, padding: '0.75rem', background: 'var(--grad-primary)',
              border: 'none', borderRadius: 'var(--radius-md)', color: 'white',
              fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)',
              boxShadow: 'var(--shadow-glow-sm)'
            }}>
              {loading ? 'Creating...' : '+ Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [search, setSearch] = useState('');

  const fetchTasks = useCallback(async () => {
    try {
      const params = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterPriority !== 'all') params.priority = filterPriority;
      const { data } = await tasksAPI.getAll(params);
      setTasks(data.tasks);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPriority]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleAdd = async (form) => {
    const { data } = await tasksAPI.create(form);
    setTasks(prev => [data.task, ...prev]);
  };

  const handleUpdate = async (id, updates) => {
    const { data } = await tasksAPI.update(id, updates);
    setTasks(prev => prev.map(t => t._id === id ? data.task : t));
  };

  const handleDelete = async (id) => {
    await tasksAPI.delete(id);
    setTasks(prev => prev.filter(t => t._id !== id));
  };

  const filtered = tasks.filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.category?.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = {
    todo: filtered.filter(t => t.status === 'todo'),
    'in-progress': filtered.filter(t => t.status === 'in-progress'),
    completed: filtered.filter(t => t.status === 'completed'),
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div className="fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.75rem' }}>Tasks</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 2 }}>
            {tasks.filter(t => t.status !== 'completed').length} active · {tasks.filter(t => t.status === 'completed').length} completed
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => navigate('/chat')} style={{
            padding: '0.6rem 1rem', background: 'var(--bg-surface)',
            border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-md)',
            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.82rem',
            fontFamily: 'var(--font-body)', transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.color = 'var(--accent-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bg-border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            ✦ Ask AI
          </button>
          <button onClick={() => setShowModal(true)} style={{
            padding: '0.6rem 1.25rem', background: 'var(--grad-primary)',
            border: 'none', borderRadius: 'var(--radius-md)', color: 'white',
            cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', fontFamily: 'var(--font-body)',
            boxShadow: 'var(--shadow-glow-sm)', transition: 'all var(--transition-fast)'
          }}>
            + New Task
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="fade-in delay-1" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..."
          style={{
            padding: '0.55rem 0.875rem', background: 'var(--bg-surface)',
            border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none',
            minWidth: 200, transition: 'border-color var(--transition-fast)'
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
          onBlur={e => e.target.style.borderColor = 'var(--bg-border)'}
        />

        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'todo', 'in-progress', 'completed'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{
              padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-full)',
              border: '1px solid',
              borderColor: filterStatus === s ? 'var(--accent-primary)' : 'var(--bg-border)',
              background: filterStatus === s ? 'var(--accent-primary-glow)' : 'var(--bg-surface)',
              color: filterStatus === s ? 'var(--accent-primary)' : 'var(--text-secondary)',
              cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'var(--font-body)',
              transition: 'all var(--transition-fast)'
            }}>{s}</button>
          ))}
        </div>

        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{
          padding: '0.5rem 0.75rem', background: 'var(--bg-surface)',
          border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-md)',
          color: 'var(--text-secondary)', fontSize: '0.8rem', outline: 'none', cursor: 'pointer'
        }}>
          {PRIORITIES.map(p => <option key={p} value={p}>{p === 'all' ? 'All priorities' : p}</option>)}
        </select>
      </div>

      {/* Task columns */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            border: '3px solid var(--bg-border)', borderTopColor: 'var(--accent-primary)',
            animation: 'spin 0.8s linear infinite'
          }} />
        </div>
      ) : filterStatus === 'all' && !search ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {Object.entries(grouped).map(([status, items]) => (
            <div key={status}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem', padding: '0.25rem 0'
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[status] }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {status.replace('-', ' ')}
                </span>
                <span style={{
                  fontSize: '0.7rem', padding: '1px 7px', borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-elevated)', color: 'var(--text-muted)'
                }}>{items.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.length === 0 ? (
                  <div style={{
                    padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)',
                    fontSize: '0.8rem', background: 'var(--bg-surface)',
                    border: '1px dashed var(--bg-border)', borderRadius: 'var(--radius-md)'
                  }}>
                    No {status} tasks
                  </div>
                ) : (
                  items.map(task => (
                    <TaskCard key={task._id} task={task} onUpdate={handleUpdate} onDelete={handleDelete} />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No tasks found matching your filters.
            </div>
          ) : (
            filtered.map(task => (
              <TaskCard key={task._id} task={task} onUpdate={handleUpdate} onDelete={handleDelete} />
            ))
          )}
        </div>
      )}

      {showModal && <AddTaskModal onAdd={handleAdd} onClose={() => setShowModal(false)} />}
    </div>
  );
}
