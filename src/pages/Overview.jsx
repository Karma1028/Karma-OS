import React from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, RadialBarChart, RadialBar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { fmtInt, fmtKg, pct, daysBetween, short, DOMAIN_COLORS, SPLIT_COLORS, CHART_COLORS, TODAY, computeHealth, healthLabel } from '../utils/helpers';

export default function Overview({ data }) {
  const navigate = useNavigate();
  const { tasks, toggleTask } = useStore();

  const health = computeHealth(data);
  const hScore = health.score;
  const openTasks = tasks.filter(t => !t.done).slice(0, 4);
  const fstats = data.stats?.fitness || {};
  const vaultStats = data.stats?.vault || {};

  const mData = data.monthly || [];
  const latestMonth = mData[mData.length - 1] || {};
  const prevMonth = mData[mData.length - 2] || {};

  const getDelta = (curr, prev) => {
    if (!prev || prev === 0) return '+0%';
    const p = ((curr - prev) / prev) * 100;
    return (p > 0 ? '+' : '') + p.toFixed(1) + '%';
  };

  const getDeltaCls = (curr, prev, invert = false) => {
    if (!prev || prev === 0) return 'deltaChip';
    const p = ((curr - prev) / prev) * 100;
    let good = p >= 0;
    if (invert) good = !good;
    return good ? 'deltaChip good' : 'deltaChip bad';
  };

  const metrics = [
    { lbl: 'WORKOUTS', val: latestMonth.workouts, prev: prevMonth.workouts, fmt: fmtInt },
    { lbl: 'VOLUME', val: latestMonth.vol, prev: prevMonth.vol, fmt: fmtKg },
    { lbl: 'LISTENING', val: latestMonth.music_min, prev: prevMonth.music_min, fmt: (v) => fmtInt(v) + 'm' },
    { lbl: 'KNOWLEDGE', val: latestMonth.knowledge, prev: prevMonth.knowledge, fmt: fmtInt },
    { lbl: 'EVENTS', val: latestMonth.events, prev: prevMonth.events, fmt: fmtInt },
    { lbl: 'MOOD', val: latestMonth.mood, prev: prevMonth.mood, fmt: (v) => (v || 0).toFixed(1) }
  ];

  const heatStreams = data.activity?.streams || [
    { label: 'Training', arr: Array(41).fill(0).map(()=>Math.random()) },
    { label: 'Listening', arr: Array(41).fill(0).map(()=>Math.random()) },
    { label: 'Knowledge', arr: Array(41).fill(0).map(()=>Math.random()) },
    { label: 'Events', arr: Array(41).fill(0).map(()=>Math.random()) }
  ];

  const ttStyle = { background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10, color: 'var(--text)' };
  const tkStyle = { fill: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: 10 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, padding: 30 }}>
        <div style={{ width: 120, height: 120 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={10} data={[{ name: 'Score', value: hScore, fill: 'var(--accent)' }]} startAngle={90} endAngle={-270}>
              <RadialBar background={{ fill: 'var(--track)' }} clockWise dataKey="value" cornerRadius={5} />
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="statVal" fill="var(--text)">{hScore}</text>
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1 }}>
          <div className="h2" style={{ marginBottom: 5 }}>SYSTEM ONLINE. WELCOME BACK.</div>
          <div className="h2sub" style={{ marginBottom: 15 }}>Current system health is <span className="hl" style={{ color: healthLabel(hScore).color }}>{healthLabel(hScore).label}</span>.</div>
          <div className="rowFlex" style={{ gap: 10 }}>
            <div className="chip">ACTIVE STREAMS: {health.activeStreams}/{health.totalStreams}</div>
            <div className="chip">INGEST BACKLOG: {health.backlog}</div>
            <div className="chip">LAST MEMORY WRITE: {health.daysSince}d ago</div>
          </div>
        </div>
      </div>

      <div className="g4">
        <div className="statCard" onClick={() => navigate('/training')} style={{ cursor: 'pointer' }}>
          <div className="statLbl">TRAINING VOLUME</div>
          <div className="statVal">{fmtKg(data.hevy?.hevy_summary?.total_volume_kg || 0)}</div>
          <div className="statSub">LIFETIME</div>
        </div>
        <div className="statCard" onClick={() => navigate('/listening')} style={{ cursor: 'pointer' }}>
          <div className="statLbl">LISTENING TIME</div>
          <div className="statVal">{fmtInt(data.spotify?.spotify_summary?.total_min || 0)}m</div>
          <div className="statSub">LIFETIME</div>
        </div>
        <div className="statCard" onClick={() => navigate('/vault')} style={{ cursor: 'pointer' }}>
          <div className="statLbl">KNOWLEDGE VAULT</div>
          <div className="statVal">{fmtInt((data.vault?.wiki || 0) + (data.vault?.notebooks || 0))}</div>
          <div className="statSub">TOTAL ASSETS</div>
        </div>
        <div className="statCard" onClick={() => navigate('/feed')} style={{ cursor: 'pointer' }}>
          <div className="statLbl">INGEST BACKLOG</div>
          <div className="statVal">{fmtInt(data.feed?.items?.length || 0)}</div>
          <div className="statSub">PENDING ITEMS</div>
        </div>
      </div>

      <div className="card">
        <div className="h2">PERFORMANCE TIMELINE (LAST 30 DAYS)</div>
        <div className="g2" style={{ marginTop: 20 }}>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" vertical={false} />
                <XAxis dataKey="label" tick={tkStyle} axisLine={false} tickLine={false} />
                <YAxis tick={tkStyle} axisLine={false} tickLine={false} width={30} />
                <Tooltip contentStyle={ttStyle} />
                <Bar dataKey="mood" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="g3">
            {metrics.map((m, i) => (
              <div key={i} className="statCard" style={{ padding: 15 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="statLbl">{m.lbl}</div>
                  <div className={getDeltaCls(m.val, m.prev)}>{getDelta(m.val, m.prev)}</div>
                </div>
                <div className="statVal" style={{ fontSize: 24, marginTop: 10 }}>{m.fmt ? m.fmt(m.val) : m.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="g2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="brief">
            <div className="h2" style={{ color: 'var(--accent)' }}>AI DAILY BRIEF</div>
            <p style={{ color: 'var(--text2)', margin: '15px 0', fontSize: 14 }}>
              {health.activeStreams} of {health.totalStreams} streams active. ACWR sits at {fstats.acwr?.toFixed(2) ?? 'N/A'}{fstats.acwr > 1.3 ? ' — above the 1.3 safe ceiling' : ''}.
              Vault last captured {vaultStats.daysSince ?? '?'} days ago, {health.backlog} items still waiting in the ingest backlog.
            </p>
            <div className="rowFlex" style={{ gap: 10 }}>
              <div className="aiTag" style={{ background: fstats.acwr > 1.3 ? 'var(--badBg)' : 'var(--goodBg)', color: fstats.acwr > 1.3 ? 'var(--bad)' : 'var(--good)', border: `1px solid ${fstats.acwr > 1.3 ? 'var(--badBd)' : 'var(--goodBd)'}` }}>ACWR: {fstats.acwr?.toFixed(2) ?? 'N/A'}{fstats.acwr > 1.3 ? ' (HIGH)' : ''}</div>
              <div className="aiTag" style={{ background: vaultStats.daysSince > 14 ? 'var(--warnBg)' : 'var(--goodBg)', color: vaultStats.daysSince > 14 ? 'var(--warn)' : 'var(--good)', border: `1px solid ${vaultStats.daysSince > 14 ? 'var(--warnBd)' : 'var(--goodBd)'}` }}>VAULT: {vaultStats.daysSince ?? '?'}d SINCE CAPTURE</div>
              <div className="aiTag" style={{ background: 'var(--infoBg)', color: 'var(--info)', border: '1px solid var(--infoBd)' }}>BACKLOG: {health.backlog}</div>
            </div>
          </div>

          <div className="card">
            <div className="h2">SIGNALS</div>
            <div className="rowFlex" style={{ justifyContent: 'space-between', marginTop: 15 }}>
              <div style={{ flex: 1, paddingRight: 15, borderRight: '1px solid var(--border)' }}>
                <div className="statLbl" style={{ marginBottom: 10, color: 'var(--good)' }}>ACTIVE STREAMS</div>
                {metrics.filter(m => m.prev && m.val >= m.prev).map(m => (
                  <div key={m.lbl} className="chip" style={{ marginBottom: 5 }}>{m.lbl} ({getDelta(m.val, m.prev)})</div>
                ))}
                {!metrics.some(m => m.prev && m.val >= m.prev) && <div className="statSub">None this month.</div>}
              </div>
              <div style={{ flex: 1, paddingLeft: 15 }}>
                <div className="statLbl" style={{ marginBottom: 10, color: 'var(--bad)' }}>STALLED STREAMS</div>
                {metrics.filter(m => m.prev && m.val < m.prev).map(m => (
                  <div key={m.lbl} className="chip" style={{ marginBottom: 5 }}>{m.lbl} ({getDelta(m.val, m.prev)})</div>
                ))}
                {!metrics.some(m => m.prev && m.val < m.prev) && <div className="statSub">None this month.</div>}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="h2">SYSTEM PULSE (41 WEEKS)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 15 }}>
              {heatStreams.map((s, i) => {
                const label = s.label || s.name;
                const arr = s.arr || s.dates || [];
                const max = Math.max(1, ...arr);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="mono" style={{ width: 80, fontSize: 10, color: 'var(--text2)' }}>{label}</div>
                    <div style={{ display: 'flex', gap: 2, flex: 1 }}>
                      {arr.map((val, j) => (
                        <div key={j} style={{ flex: 1, aspectRatio: '1/1', background: 'var(--accent)', opacity: Math.max(0.1, val / max), borderRadius: 2 }} title={`${label} Week ${j+1}`} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="h2">TRAINING WEEKLY FREQUENCY</div>
            <div style={{ height: 200, marginTop: 15 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" vertical={false} />
                  <XAxis dataKey="label" tick={tkStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={tkStyle} axisLine={false} tickLine={false} width={30} />
                  <Tooltip contentStyle={ttStyle} />
                  <Bar dataKey="workouts" fill="var(--good)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div className="h2" style={{ marginBottom: 15 }}>TODAY'S TASKS</div>
            {openTasks.length > 0 ? openTasks.map(t => (
              <div key={t.id} className="taskRow">
                <input type="checkbox" className="chk" checked={t.done} onChange={() => toggleTask(t.id)} />
                <span className="mono" style={{ fontSize: 12, flex: 1, color: t.done ? 'var(--mut)' : 'var(--text)' }}>{t.text}</span>
              </div>
            )) : <div className="mono" style={{ fontSize: 12, color: 'var(--mut)' }}>No pending tasks.</div>}
          </div>

          <div className="card">
            <div className="h2">THIS MONTH'S MIX</div>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[
                    { n: 'Training', v: latestMonth.workouts || 0 },
                    { n: 'Listening', v: Math.round((latestMonth.music_min || 0) / 60) },
                    { n: 'Knowledge', v: latestMonth.knowledge || 0 },
                    { n: 'Events', v: latestMonth.events || 0 },
                  ]} dataKey="v" nameKey="n" innerRadius="60%" outerRadius="80%" paddingAngle={2}>
                    <Cell fill={DOMAIN_COLORS?.fitness || 'var(--accent)'} />
                    <Cell fill={DOMAIN_COLORS?.music || 'var(--good)'} />
                    <Cell fill={DOMAIN_COLORS?.knowledge || 'var(--warn)'} />
                    <Cell fill={DOMAIN_COLORS?.intel || 'var(--mut)'} />
                  </Pie>
                  <Tooltip contentStyle={ttStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="rowFlex" style={{ justifyContent: 'center', gap: 15 }}>
              {['Training', 'Listening', 'Knowledge', 'Events'].map((l, i) => (
                <div key={l} className="rowFlex" style={{ gap: 5, fontSize: 10, color: 'var(--text2)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: [DOMAIN_COLORS?.fitness || 'var(--accent)', DOMAIN_COLORS?.music || 'var(--good)', DOMAIN_COLORS?.knowledge || 'var(--warn)', DOMAIN_COLORS?.intel || 'var(--mut)'][i] }} />
                  {l}
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="h2">INTELLIGENCE</div>
            {data.feed?.news_feed?.items?.slice(0, 2).map((item, i) => (
              <div key={i} style={{ marginTop: 15, paddingBottom: 15, borderBottom: i === 0 ? '1px solid var(--border)' : 'none' }}>
                <div className="statLbl">{item.title?.length > 40 ? item.title.slice(0, 40) + '…' : item.title}</div>
                <div className="statSub" style={{ marginTop: 5 }}>{item.source} • {item.date}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="h2">COMPOUND SCORE TREND</div>
            <div style={{ height: 200, marginTop: 15 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" vertical={false} />
                  <XAxis dataKey="label" tick={tkStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={tkStyle} axisLine={false} tickLine={false} domain={['auto', 'auto']} width={30} />
                  <Tooltip contentStyle={ttStyle} />
                  <Line type="monotone" dataKey="mood" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--card)', stroke: 'var(--accent)', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="h2">MONTHLY CROSS-STREAM</div>
            <div style={{ height: 250, marginTop: 15 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" vertical={false} />
                  <XAxis dataKey="label" tick={tkStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={tkStyle} axisLine={false} tickLine={false} width={30} />
                  <Tooltip contentStyle={ttStyle} />
                  <Area type="monotone" dataKey="workouts" stackId="1" stroke={DOMAIN_COLORS?.training || 'var(--accent)'} fill={DOMAIN_COLORS?.training || 'var(--accent)'} />
                  <Area type="monotone" dataKey="music_min" stackId="1" stroke={DOMAIN_COLORS?.spotify || 'var(--good)'} fill={DOMAIN_COLORS?.spotify || 'var(--good)'} />
                  <Area type="monotone" dataKey="knowledge" stackId="1" stroke={DOMAIN_COLORS?.vault || 'var(--warn)'} fill={DOMAIN_COLORS?.vault || 'var(--warn)'} />
                  <Area type="monotone" dataKey="events" stackId="1" stroke={CHART_COLORS?.[3] || 'var(--pink)'} fill={CHART_COLORS?.[3] || 'var(--pink)'} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
