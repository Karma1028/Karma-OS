import React, { useMemo } from 'react';
import { AreaChart, Area, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid, ScatterChart, Scatter, Cell } from 'recharts';
import { CHART_COLORS } from '../utils/helpers';

export default function Analytics({ data }) {
  const fields = [
    { key: 'workouts', label: 'Training', color: CHART_COLORS[0] },
    { key: 'music_min', label: 'Music', color: CHART_COLORS[1] },
    { key: 'knowledge', label: 'Knowledge', color: CHART_COLORS[2] },
    { key: 'memory', label: 'Memory', color: CHART_COLORS[3] },
    { key: 'events', label: 'Intel', color: CHART_COLORS[4] }
  ];

  const maxes = useMemo(() => {
    const m = {};
    fields.forEach(f => {
      m[f.key] = Math.max(1, ...data.monthly.map(x => x[f.key] || 0));
    });
    return m;
  }, [data]);

  const corrMatrix = useMemo(() => {
    const pearson = (x, y) => {
      const n = x.length;
      if (!n) return 0;
      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = y.reduce((a, b) => a + b, 0);
      const sumX2 = x.reduce((a, b) => a + b * b, 0);
      const sumY2 = y.reduce((a, b) => a + b * b, 0);
      const pSum = x.map((xi, i) => xi * y[i]).reduce((a, b) => a + b, 0);
      const num = pSum - (sumX * sumY / n);
      const den = Math.sqrt((sumX2 - sumX * sumX / n) * (sumY2 - sumY * sumY / n));
      return den === 0 ? 0 : num / den;
    };
    const matrix = [];
    for(let i=0; i<fields.length; i++) {
      const row = [];
      for(let j=0; j<fields.length; j++) {
        const x = data.monthly.map(m => m[fields[i].key] || 0);
        const y = data.monthly.map(m => m[fields[j].key] || 0);
        row.push(pearson(x, y));
      }
      matrix.push(row);
    }
    return matrix;
  }, [data]);

  const scatterData = useMemo(() => {
    return data.monthly.map(m => ({
      x: m.workouts || 0,
      y: m.music_min || 0,
      month: m.label
    }));
  }, [data]);

  const radarData = useMemo(() => {
    if (!data.monthly.length) return [];
    const latest = data.monthly[data.monthly.length - 1];
    return fields.map(f => ({
      subject: f.label,
      A: ((latest[f.key] || 0) / maxes[f.key]) * 100
    }));
  }, [data, maxes]);

  const compoundData = useMemo(() => {
    return data.monthly.map(m => {
      let score = 0;
      fields.forEach(f => {
        score += ((m[f.key] || 0) / maxes[f.key]) * 100;
      });
      return { month: m.label, score: score / fields.length };
    });
  }, [data, maxes]);

  const renderCellColor = (val) => {
    if (val > 0.5) return 'var(--goodBg)';
    if (val < -0.5) return 'var(--badBg)';
    return 'transparent';
  };
  
  const renderCellBorder = (val) => {
    if (val > 0.5) return '1px solid var(--goodBd)';
    if (val < -0.5) return '1px solid var(--badBd)';
    return '1px solid var(--border)';
  };
  
  const renderCellText = (val) => {
    if (val > 0.5) return 'var(--good)';
    if (val < -0.5) return 'var(--bad)';
    return 'var(--text2)';
  };

  const CustomScatterTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10, padding: '10px' }}>
          <div style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 5 }}>{data.month}</div>
          <div style={{ color: 'var(--mut)', fontSize: 12 }}>Workouts: <span style={{color: 'var(--text)'}}>{data.x}</span></div>
          <div style={{ color: 'var(--mut)', fontSize: 12 }}>Music Min: <span style={{color: 'var(--text)'}}>{data.y}</span></div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 }}>
      <div className="brief">
        <div style={{ color: 'var(--text)' }}>Cross-stream analytics — how your five life streams interact.</div>
      </div>

      <div className="g2">
        <div className="card">
          <div className="h2">Correlation Matrix</div>
          <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(5, 1fr)', gap: 4, marginTop: 15 }}>
            <div />
            {fields.map(f => <div key={f.key} style={{ fontSize: 10, color: 'var(--mut)', textAlign: 'center', fontFamily: 'IBM Plex Mono' }}>{f.label.slice(0,3).toUpperCase()}</div>)}
            {fields.map((f, i) => (
              <React.Fragment key={f.key}>
                <div style={{ fontSize: 10, color: 'var(--mut)', display: 'flex', alignItems: 'center', fontFamily: 'IBM Plex Mono' }}>{f.label.slice(0,3).toUpperCase()}</div>
                {fields.map((f2, j) => {
                  const val = corrMatrix[i][j];
                  return (
                    <div key={j} style={{
                      background: renderCellColor(val),
                      border: renderCellBorder(val),
                      color: renderCellText(val),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, padding: '8px 0', borderRadius: 4, fontFamily: 'IBM Plex Mono'
                    }}>
                      {val.toFixed(2)}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="h2">Training ↔ Music Scatter</div>
          <div style={{ color: 'var(--mut)', fontSize: 12, marginBottom: 15, fontFamily: 'IBM Plex Mono' }}>
            Corr: {(data.stats.corr || 0).toFixed(2)}
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" />
                <XAxis type="number" dataKey="x" name="Workouts" tick={{ fill: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="number" dataKey="y" name="Music Min" tick={{ fill: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomScatterTooltip />} />
                <Scatter name="Training vs Music" data={scatterData} fill="var(--accent)" animationDuration={800} animationEasing="ease-out">
                  {scatterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="var(--accent)" />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="g3">
        <div className="card">
          <div className="h2">Monthly Radar</div>
          <div style={{ height: 200, marginTop: 15 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart outerRadius="70%" data={radarData}>
                <PolarGrid stroke="var(--border2)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--mut)', fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Latest Month" dataKey="A" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.3} animationDuration={800} animationEasing="ease-out" />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="h2">Compound Score Trend</div>
          <div style={{ height: 200, marginTop: 15 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={compoundData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10 }} />
                <Line type="monotone" dataKey="score" stroke="var(--good)" strokeWidth={2} dot={{ r: 3, fill: 'var(--good)' }} animationDuration={800} animationEasing="ease-out" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="h2">Stream Momentum</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 15, marginTop: 15 }}>
          {fields.map(f => {
            const vals = data.monthly.slice(-3).map(m => m[f.key] || 0);
            const current = vals[2] || 0;
            const prev = vals[1] || 0;
            const trend = current > prev ? '↑' : current < prev ? '↓' : '→';
            const color = current > prev ? 'var(--good)' : current < prev ? 'var(--warn)' : 'var(--mut)';
            const sparkData = data.monthly.slice(-6).map(m => ({ v: m[f.key] || 0 }));
            const peak = maxes[f.key] || 0;
            return (
              <div key={f.key} style={{ background: 'var(--card2)', padding: 15, borderRadius: 8, border: '1px solid var(--border2)' }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5 }}>{f.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)' }}>{current}</div>
                  <div style={{ fontSize: 12, color: 'var(--mut)', fontFamily: 'IBM Plex Mono' }}>/ {peak} pk</div>
                  <div style={{ fontSize: 14, color, fontFamily: 'IBM Plex Mono', marginLeft: 'auto' }}>{trend}</div>
                </div>
                <div style={{ height: 40, marginTop: 10 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sparkData}>
                      <Area type="monotone" dataKey="v" stroke={f.color} fill={f.color} fillOpacity={0.2} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div className="h2">Attention Heatmap</div>
        <div style={{ marginTop: 15, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, r) => (
            <div key={day} style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <div style={{ width: 30, fontSize: 10, color: 'var(--mut)', fontFamily: 'IBM Plex Mono' }}>{day}</div>
              {Array.from({ length: 24 }).map((_, c) => {
                const val = (data.stats.heat && data.stats.heat[r]) ? data.stats.heat[r][c] : 0;
                return (
                  <div key={c} style={{
                    flex: 1, height: 16, borderRadius: 2,
                    background: val ? `rgba(168, 128, 255, ${Math.min(1, 0.2 + val/100)})` : 'var(--card2)'
                  }} title={`${day} ${c}:00 - ${val} acts`} />
                );
              })}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 2, alignItems: 'center', marginTop: 4 }}>
            <div style={{ width: 30 }} />
            {Array.from({ length: 24 }).map((_, c) => (
              <div key={c} style={{ flex: 1, fontSize: 8, color: 'var(--mut)', textAlign: 'center', fontFamily: 'IBM Plex Mono' }}>{c % 3 === 0 ? c : ''}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="h2">Monthly Stacked Activity</div>
        <div style={{ height: 300, marginTop: 15 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.monthly} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10 }} />
              {fields.map((f, i) => (
                <Area key={f.key} type="monotone" dataKey={f.key} name={f.label} stackId="1" stroke={f.color} fill={f.color} fillOpacity={0.6} animationDuration={800} animationEasing="ease-out" />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
