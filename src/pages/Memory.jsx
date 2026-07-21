import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import useStore from '../store/useStore';
import { CHART_COLORS } from '../utils/helpers';

export default function Memory({ data }) {
  const { synclog } = useStore();
  const mem = data.memory || { identity: 'Tuhin Bhattacharya', sub: 'Palace Online', layers: [] };
  const items = (data.feed?.items || []).filter(i => i.domain === 'memory');
  
  const layers = mem.layers && mem.layers.length ? mem.layers : [
    { tag: 'L1', tagColor: 'var(--accent)', name: 'identity.md', state: 'Active', desc: 'Core identity' },
    { tag: 'L2', tagColor: 'var(--good)', name: 'MEMORY.md', state: 'Active', desc: 'Working memory' },
    { tag: 'L3', tagColor: 'var(--warn)', name: 'history.jsonl', state: 'Logging', desc: 'Event log' },
    { tag: 'L4', tagColor: 'var(--pink)', name: 'ChromaDB', state: 'Online', desc: 'Palace' }
  ];

  const layerHealth = [
    { name: 'identity.md', value: 100, fill: 'var(--accent)' },
    { name: 'MEMORY.md', value: 50, fill: 'var(--good)' },
    { name: 'history.jsonl', value: 5, fill: 'var(--warn)' },
    { name: 'ChromaDB', value: 80, fill: 'var(--pink)' }
  ];

  const trendData = [
    { name: 'W1', writes: 0 },
    { name: 'W2', writes: 0 },
    { name: 'W3', writes: 0 },
    { name: 'W4', writes: 1 },
    { name: 'W5', writes: 2 }
  ];

  const heatmapDays = Array.from({ length: 90 }, (_, i) => {
    if (i === 85) return 1;
    if (i === 88) return 1;
    return 0;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: 0 }}>{mem.identity || 'Tuhin Bhattacharya'}</h1>
            <div style={{ color: 'var(--mut)', marginTop: 5 }}>{mem.sub || 'Palace Online'}</div>
          </div>
          <div className="chip" style={{ background: 'var(--goodBg)', color: 'var(--good)' }}>Palace Online</div>
        </div>
      </div>

      <div className="brief">
        <div className="aiTag">MEMORY HEURISTICS</div>
        <div style={{ marginTop: 10, lineHeight: 1.5 }}>
          Palace integrity holds. history.jsonl tracks 2 primary events. Write cadence is highly sporadic, suggesting manual overrides rather than continuous agent logging. Memory depth remains shallow in L3.
        </div>
      </div>

      <h2 className="h2">Palace Architecture</h2>
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
          {layers.map((l, i) => (
            <React.Fragment key={l.tag}>
              <div style={{ flex: 1, padding: 15, background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ color: l.tagColor, fontWeight: 'bold', marginBottom: 5 }}>{l.tag}</div>
                <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>{l.name}</div>
              </div>
              {i < layers.length - 1 && <div style={{ color: 'var(--mut)' }}>→</div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      <h2 className="h2">Layer Health</h2>
      <div className="gridN g4">
        {layerHealth.map(l => (
          <div key={l.name} className="statCard" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', height: 100 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                  cx="50%" cy="50%" 
                  innerRadius="60%" outerRadius="100%" 
                  barSize={10} data={[l]} 
                  startAngle={180} endAngle={0}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar background clockWise dataKey="value" cornerRadius={5} fill={l.fill} />
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="statVal" fill="var(--text)" style={{ fontSize: 16 }}>
                    {l.value}%
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="statLbl" style={{ marginTop: -20 }}>{l.name}</div>
          </div>
        ))}
      </div>

      <div className="gridN g2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 className="h2">Write Frequency Trend</h2>
          <div className="card" style={{ height: 200, padding: 20 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--mut)" tick={{ fill: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: 10 }} />
                <YAxis stroke="var(--mut)" tick={{ fill: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10 }} />
                <Area type="monotone" dataKey="writes" stroke="var(--accent)" fill="var(--accentT)" animationDuration={800} animationEasing="ease-out" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 className="h2">Write Heatmap (90 Days)</h2>
          <div className="card" style={{ padding: 20, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {heatmapDays.map((val, i) => (
              <div 
                key={i} 
                style={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: 2, 
                  background: val > 0 ? 'var(--accent)' : 'var(--card2)',
                  border: '1px solid var(--border)'
                }} 
                title={val > 0 ? 'Write event' : 'No activity'}
              />
            ))}
          </div>
        </div>
      </div>

      <h2 className="h2">Memory Layers</h2>
      <div className="gridN g4">
        {layers.map(l => (
          <div key={l.tag} className="statCard">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div className="chip" style={{ background: `color-mix(in srgb, ${l.tagColor} 20%, transparent)`, color: l.tagColor }}>{l.tag}</div>
              <div style={{ fontSize: 12, color: 'var(--mut)' }}>{l.state}</div>
            </div>
            <div className="statVal" style={{ fontSize: 16 }}>{l.name}</div>
            <div className="statSub" style={{ marginTop: 5 }}>{l.desc}</div>
          </div>
        ))}
      </div>

      <div className="gridN g2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 className="h2">Write Stream</h2>
          <div className="card" style={{ padding: 20 }}>
            <div className="track">
              {items.length > 0 ? items.map((item, i) => (
                <div key={i} className="timeline-item" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="timeline-dot" style={{ background: 'var(--accent)' }}></div>
                  <div className="timeline-content">
                    <div className="timeline-time">{item.time}</div>
                    <div className="timeline-title">{item.title}</div>
                    <div className="timeline-detail">{item.desc}</div>
                  </div>
                </div>
              )) : (
                <>
                  <div className="timeline-item" style={{ animationDelay: '0s' }}>
                    <div className="timeline-dot" style={{ background: 'var(--accent)' }}></div>
                    <div className="timeline-content">
                      <div className="timeline-time">Yesterday</div>
                      <div className="timeline-title">Odysseus Wiring</div>
                      <div className="timeline-detail">Initialized L3 connection for agent logging</div>
                    </div>
                  </div>
                  <div className="timeline-item" style={{ animationDelay: '0.1s' }}>
                    <div className="timeline-dot" style={{ background: 'var(--good)' }}></div>
                    <div className="timeline-content">
                      <div className="timeline-time">2 days ago</div>
                      <div className="timeline-title">Manual Test</div>
                      <div className="timeline-detail">history.jsonl format validation</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 className="h2">Agent Diaries</h2>
          <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['Hermes', 'Odysseus', 'Antigravity'].map(agent => (
              <div key={agent} className="wRow">
                <div>{agent}</div>
                <div className="chip">View Log</div>
              </div>
            ))}
          </div>
          
          <h2 className="h2">Session Sync Log</h2>
          <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 200, overflowY: 'auto' }}>
            {synclog && synclog.length > 0 ? synclog.map((log, i) => (
              <div key={i} className="mono" style={{ fontSize: 12, color: 'var(--mut)' }}>
                [{new Date(log.ts).toLocaleTimeString()}] {log.msg}
              </div>
            )) : (
              <div className="mono" style={{ fontSize: 12, color: 'var(--mut)' }}>No sync events this session.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
