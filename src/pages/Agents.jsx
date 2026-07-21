import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { CHART_COLORS } from '../utils/helpers';

export default function Agents({ data }) {
  const { agents } = data;

  // Mock data for new features if not fully in props
  const timeline = [
    { time: '10:00', agent: 'Hermes', event: 'Sync complete' },
    { time: '11:30', agent: 'Odysseus', event: 'Memory optimized' },
    { time: '13:15', agent: 'Antigravity', event: 'Deployed build' },
    { time: '15:45', agent: 'Hermes', event: 'Processed query' }
  ];

  const mcpTools = [
    { name: 'Memory Read/Write', status: 'online' },
    { name: 'Presets Loader', status: 'online' },
    { name: 'FastEmbed Server', status: 'standby' }
  ];

  const caps = [
    { target: 'Wiki', Hermes: 'RW', Odysseus: 'R', Antigravity: 'RW', Proxy: '✘' },
    { target: 'Raw Data', Hermes: 'R', Odysseus: 'RW', Antigravity: 'R', Proxy: '✘' },
    { target: 'Knowledge', Hermes: 'RW', Odysseus: 'RW', Antigravity: 'R', Proxy: 'R' },
    { target: 'Personal', Hermes: 'RW', Odysseus: 'R', Antigravity: '✘', Proxy: '✘' },
    { target: 'Projects', Hermes: 'RW', Odysseus: 'R', Antigravity: 'RW', Proxy: '✘' },
    { target: 'System', Hermes: 'R', Odysseus: 'R', Antigravity: 'RW', Proxy: '✘' },
    { target: 'Graphify-out', Hermes: 'RW', Odysseus: 'RW', Antigravity: '✘', Proxy: 'RW' }
  ];

  const healthData = [
    { name: 'Hermes', score: 98 },
    { name: 'Odysseus', score: 92 },
    { name: 'Antigravity', score: 99 },
    { name: 'Proxy', score: 65 }
  ];

  const renderGauge = (score) => {
    const data = [
      { name: 'score', value: score },
      { name: 'rem', value: 100 - score }
    ];
    return (
      <ResponsiveContainer width="100%" height={80}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="100%"
            startAngle={180}
            endAngle={0}
            innerRadius={40}
            outerRadius={55}
            paddingAngle={0}
            dataKey="value"
            stroke="none"
          >
            <Cell fill={score > 90 ? 'var(--good)' : score > 70 ? 'var(--warn)' : 'var(--bad)'} />
            <Cell fill="var(--track)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const getCapColor = (val) => {
    if (val === 'RW') return 'var(--good)';
    if (val === 'R') return 'var(--info)';
    return 'var(--bad)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 2x2 AGENT GRID */}
      <div className="gridN g2">
        {agents && agents.map((ag, i) => (
          <div key={i} className="card" style={{ transition: 'transform 0.2s ease', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  backgroundColor: ag.dot,
                  boxShadow: ag.anim ? `0 0 10px ${ag.dot}` : 'none',
                  animation: ag.anim ? 'pulse 2s infinite' : 'none'
                }} />
                <div className="h2" style={{ margin: 0 }}>{ag.name}</div>
              </div>
              <div className="chip mono" style={{ background: ag.badgeBg, color: ag.badgeColor, border: 'none', padding: '2px 8px', fontSize: '10px' }}>
                {ag.state}
              </div>
            </div>
            
            <div style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '15px', lineHeight: 1.4 }}>
              {ag.desc}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {ag.facts && ag.facts.map((f, idx) => (
                <div key={idx} className="wRow mono" style={{ fontSize: '11px' }}>
                  <span style={{ color: 'var(--mut)' }}>{f.label}</span>
                  <span style={{ color: 'var(--text)' }}>{f.val}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="gridN g2">
        {/* AGENT TIMELINE */}
        <div className="card">
          <div className="h2sub mb">AGENT TIMELINE</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '10px', left: 0, right: 0, height: '2px', background: 'var(--border)' }} />
            {timeline.map((evt, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--card)', border: '2px solid var(--accent)', marginBottom: '8px' }} />
                <div className="mono" style={{ fontSize: '10px', color: 'var(--mut)' }}>{evt.time}</div>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>{evt.agent}</div>
                <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{evt.event}</div>
              </div>
            ))}
          </div>
        </div>

        {/* DELEGATION GRAPH */}
        <div className="card">
          <div className="h2sub mb">DELEGATION GRAPH</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', marginTop: '10px' }}>
            <div className="chip" style={{ background: 'var(--card2)', border: '1px solid var(--border)', fontSize: '14px' }}>User</div>
            <div style={{ width: '2px', height: '15px', background: 'var(--mut)' }} />
            <div style={{ display: 'flex', gap: '40px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="chip" style={{ background: 'var(--infoBg)', color: 'var(--info)', border: '1px solid var(--infoBd)' }}>Hermes</div>
                <div style={{ display: 'flex', gap: '20px', marginTop: '15px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                     <div style={{ width: '1px', height: '15px', background: 'var(--mut)', transform: 'rotate(-30deg)', transformOrigin: 'top' }} />
                     <div className="chip mono" style={{ fontSize: '10px' }}>Gemini CLI</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                     <div style={{ width: '1px', height: '15px', background: 'var(--mut)', transform: 'rotate(30deg)', transformOrigin: 'top' }} />
                     <div className="chip mono" style={{ fontSize: '10px' }}>NotebookLM</div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="chip" style={{ background: 'var(--warnBg)', color: 'var(--warn)', border: '1px solid var(--warnBd)' }}>Antigravity</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="gridN g3">
        {/* CAPABILITY MATRIX */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="h2sub mb">CAPABILITY MATRIX</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '8px', color: 'var(--mut)' }}>Target</th>
                <th style={{ padding: '8px', color: 'var(--mut)' }}>Hermes</th>
                <th style={{ padding: '8px', color: 'var(--mut)' }}>Odysseus</th>
                <th style={{ padding: '8px', color: 'var(--mut)' }}>Antigravity</th>
                <th style={{ padding: '8px', color: 'var(--mut)' }}>Proxy</th>
              </tr>
            </thead>
            <tbody>
              {caps.map((c, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border2)' }}>
                  <td style={{ padding: '8px', fontWeight: 600 }}>{c.target}</td>
                  <td style={{ textAlign: 'center', padding: '8px', color: getCapColor(c.Hermes) }}>{c.Hermes}</td>
                  <td style={{ textAlign: 'center', padding: '8px', color: getCapColor(c.Odysseus) }}>{c.Odysseus}</td>
                  <td style={{ textAlign: 'center', padding: '8px', color: getCapColor(c.Antigravity) }}>{c.Antigravity}</td>
                  <td style={{ textAlign: 'center', padding: '8px', color: getCapColor(c.Proxy) }}>{c.Proxy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MCP TOOLS PANEL */}
        <div className="card">
          <div className="h2sub mb">ODYSSEUS MCP TOOLS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {mcpTools.map((t, i) => (
              <div key={i} className="taskRow" style={{ padding: '10px', background: 'var(--card2)', borderRadius: '6px', border: '1px solid var(--border2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '13px' }}>{t.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: t.status === 'online' ? 'var(--good)' : 'var(--warn)' }} />
                  <span className="mono" style={{ fontSize: '10px', color: 'var(--mut)' }}>{t.status.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SYSTEM HEALTH CARDS */}
      <div className="card">
        <div className="h2sub mb">SYSTEM HEALTH</div>
        <div className="gridN g4">
          {healthData.map((h, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px', background: 'var(--card2)', borderRadius: '8px' }}>
              {renderGauge(h.score)}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '-15px' }}>
                <div className="mono" style={{ fontSize: '18px', fontWeight: 'bold' }}>{h.score}%</div>
                <div style={{ fontSize: '12px', color: 'var(--mut)', marginTop: '4px' }}>{h.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(100, 255, 100, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(100, 255, 100, 0); }
          100% { box-shadow: 0 0 0 0 rgba(100, 255, 100, 0); }
        }
      `}</style>
    </div>
  );
}
