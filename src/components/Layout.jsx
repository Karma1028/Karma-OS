import { NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import useStore from '../store/useStore';
import CommandPalette from './CommandPalette';
import Toast from './Toast';

const ROUTES = [
  { id: '/', label: 'Today', glyph: '◎', sub: 'live timeline · what happened today' },
  { id: '/overview', label: 'Overview', glyph: '◇', sub: 'the whole system, one screen' },
  { id: '/fitness', label: 'Fitness', glyph: '▲', sub: 'Hevy · training science' },
  { id: '/vault', label: 'Vault', glyph: '◈', sub: 'NotebookLM · graphify · wiki' },
  { id: '/spotify', label: 'Spotify', glyph: '♫', sub: '2026 listening · extended history' },
  { id: '/memory', label: 'Memory', glyph: '◉', sub: 'identity · palace · write stream' },
  { id: '/agents', label: 'Agents', glyph: '◆', sub: 'Hermes · Odysseus · Antigravity · LLM Proxy' },
  { id: '/intel', label: 'Intel', glyph: '▤', sub: 'unified event feed' },
  { id: '/tasks', label: 'Tasks', glyph: '☑', sub: 'queue + sync log' },
  { id: '/analytics', label: 'Analytics', glyph: '◫', sub: 'cross-stream correlations' },
  { id: '/repo', label: 'Repo', glyph: '⌥', sub: 'what changed in the codebase' },
];

const CONNECTIONS = [
  { name: 'Hevy', state: 'synced', dot: 'var(--good)', anim: 'kpulse 2s ease infinite' },
  { name: 'Spotify', state: 'synced', dot: 'var(--good)', anim: 'kpulse 2s ease infinite' },
  { name: 'NotebookLM', state: 'idle', dot: 'var(--mut)', anim: 'none' },
  { name: 'Odysseus', state: 'online', dot: 'var(--good)', anim: 'kpulse 2s ease infinite' },
  { name: 'LLM Proxy', state: 'scaffold', dot: 'var(--warn)', anim: 'kpulse 2.4s ease infinite' },
];

export default function Layout({ data, children }) {
  const { theme, setTheme } = useStore();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const location = useLocation();
  const currentRoute = ROUTES.find(r => r.id === location.pathname) || ROUTES[0];

  const tasks = useStore(s => s.tasks);
  const openTaskCount = tasks.filter(t => !t.done).length;

  useEffect(() => {
    document.body.className = theme === 'light' ? 'k-light' : '';
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const handleKeyDown = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      setPaletteOpen(true);
    }
    if (e.key === 'Escape') setPaletteOpen(false);
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const today = new Date();
  const todayStr = today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  const getBadge = (route) => {
    if (route.id === '/tasks') return openTaskCount;
    if (route.id === '/vault' && data?.vault) return data.vault.notebooks;
    if (route.id === '/intel' && data?.feed) return data.feed.items.length;
    return 0;
  };

  return (
    <div className="app">
      <div className="side">
        <div className="brand">
          <div className="logo">K</div>
          <div style={{ minWidth: 0 }}>
            <div className="brandName">KARMA-OS</div>
            <div className="brandSub mono">web · v2</div>
          </div>
        </div>
        <div className="nav">
          {ROUTES.map(r => {
            const badge = getBadge(r);
            return (
              <NavLink
                key={r.id}
                to={r.id}
                className={({ isActive }) => `navItem${isActive ? ' active' : ''}`}
              >
                <span className="navGlyph" style={{ color: location.pathname === r.id ? 'var(--accentT)' : 'var(--mut)' }}>
                  {r.glyph}
                </span>
                <span style={{ flex: 1 }}>{r.label}</span>
                {badge > 0 && <span className="navBadge">{badge}</span>}
              </NavLink>
            );
          })}
        </div>
        <div style={{ flex: 1 }} />
        <div className="conns">
          <div className="connsTitle mono">Connections</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {CONNECTIONS.map(c => (
              <div key={c.name} className="connRow">
                <span className="dot" style={{ background: c.dot, animation: c.anim }} />
                <span style={{ flex: 1 }}>{c.name}</span>
                <span className="mono" style={{ fontSize: '9.5px', color: 'var(--mut)' }}>{c.state}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="main">
        <div className="topbar">
          <div className="viewTitle">{currentRoute.label}</div>
          <div className="viewSub mono">{currentRoute.sub}</div>
          <div style={{ flex: 1 }} />
          <div className="pill" onClick={() => setPaletteOpen(true)} title="Command palette">
            <span>⌘K</span>
          </div>
          <div className="pill" onClick={toggleTheme} title="Toggle light / dark">
            <span>{theme === 'light' ? '☀' : '☾'}</span>
            <span>{theme}</span>
          </div>
          <div className="pillGood">
            <span className="dot" style={{ background: 'var(--good)', animation: 'kpulse 2s ease infinite' }} />
            SYNCED
          </div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text3)' }}>{todayStr}</div>
        </div>
        <div className="content">
          {children}
        </div>
      </div>

      {paletteOpen && <CommandPalette routes={ROUTES} onClose={() => setPaletteOpen(false)} />}
      <Toast />
    </div>
  );
}
