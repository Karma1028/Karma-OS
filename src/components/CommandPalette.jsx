import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CommandPalette({ routes, onClose }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef();
  const navigate = useNavigate();

  const filtered = routes.filter(r => r.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => { setSelected(0); }, [query]);

  const go = (route) => {
    navigate(route.id);
    onClose();
  };

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && filtered[selected]) go(filtered[selected]);
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="modal-bg" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modalHead">
          <span className="mono" style={{ color: 'var(--accentT)' }}>⌘K</span>
          <input
            ref={inputRef}
            className="paletteInput"
            placeholder="jump to a view…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
          />
        </div>
        <div className="modalBody">
          {filtered.length === 0 ? (
            <div style={{ color: 'var(--mut)', fontSize: 12, padding: 8 }}>no matches</div>
          ) : filtered.map((r, i) => (
            <div
              key={r.id}
              className={`paletteRow${i === selected ? ' sel' : ''}`}
              onClick={() => go(r)}
            >
              <span className="mono">{r.glyph}</span>
              <span>{r.label}</span>
              <span style={{ flex: 1 }} />
              <span className="mono" style={{ fontSize: 10, color: 'var(--mut)' }}>{r.sub}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
