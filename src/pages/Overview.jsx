import React from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, RadialBarChart, RadialBar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { fmtInt, fmtKg, pct, daysBetween, short, DOMAIN_COLORS, SPLIT_COLORS, CHART_COLORS, TODAY, computeHealth, healthLabel } from '../utils/helpers';

export default function Overview({ data }) {
  const navigate = useNavigate();
  const { tasks, toggleTask } = useStore();

  const hScore = computeHealth(data);
  const openTasks = tasks.filter(t => !t.completed).slice(0, 4);

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

  const insightData = [
    { time: '1', val: 20 }, { time: '2', val: 40 }, { time: '3', val: 35 }, { time: '4', val: 50 }, { time: '5', val: 80 }
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
          <div className="h2sub" style={{ marginBottom: 15 }}>Current system health is <span className="hl">{healthLabel(hScore)}</span>.</div>
          <div className="rowFlex" style={{ gap: 10 }}>
            <div className="chip">ACTIVE STREAMS: 4</div>
            <div className="chip">SYNC STATUS: NORMAL</div>
            <div className="chip">UPTIME: 99.9%</div>
          </div>
        </div>
      </div>

      <div className="g4">
        <div className="statCard" onClick={() => navigate('/training')} style={{ cursor: 'pointer' }}>
          <div className="statLbl">TRAINING VOLUME</div>
          <div className="statVal">{fmtKg(data.hevy?.summary?.total_volume || 0)}</div>
          <div className="statSub">LIFETIME</div>
        </div>
        <div className="statCard" onClick={() => navigate('/listening')} style={{ cursor: 'pointer' }}>
          <div className="statLbl">LISTENING TIME</div>
          <div className="statVal">{fmtInt(data.spotify?.summary?.total_ms ? data.spotify.summary.total_ms / 60000 : 0)}m</div>
          <div className="statSub">LIFETIME</div>
        </div>
        <div className="statCard" onClick={() => navigate('/vault')} style={{ cursor: 'pointer' }}>
          <div className="statLbl">KNOWLEDGE VAULT</div>
          <div className="statVal">{fmtInt((data.vault?.wiki?.pages || 0) + (data.vault?.notebooks?.length || 0))}</div>
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
            <p style={{ color: 'var(--text2)', margin: '15px 0', fontSize: 14 }}>System operating optimally. Detected minor anomalies in training load. Knowledge base expansion tracking normally.</p>
            <div className="rowFlex" style={{ gap: 10 }}>
              <div className="aiTag" style={{ background: 'var(--warnBg)', color: 'var(--warn)', border: '1px solid var(--warnBd)' }}>ACWR: 1.3 (HIGH)</div>
              <div className="aiTag" style={{ background: 'var(--goodBg)', color: 'var(--good)', border: '1px solid var(--goodBd)' }}>VAULT SYNCED</div>
              <div className="aiTag" style={{ background: 'var(--infoBg)', color: 'var(--info)', border: '1px solid var(--infoBd)' }}>MEMORY STABLE</div>
            </div>
          </div>

          <div className="h2" style={{ marginTop: 10 }}>INSIGHT ENGINE</div>
          <div className="g2">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="insightCard card">
                <div className="rowFlex" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
                  <div className="chip">DOMAIN {i}</div>
                  <div className="deltaChip good">+{(Math.random()*10).toFixed(1)}%</div>
                </div>
                <div className="statVal" style={{ fontSize: 20 }}>{fmtInt(Math.random()*1000)}</div>
                <div style={{ height: 40, margin: '10px 0' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={insightData}>
                      <Area type="monotone" dataKey="val" stroke={CHART_COLORS[i%CHART_COLORS.length]} fill={CHART_COLORS[i%CHART_COLORS.length]} fillOpacity={0.2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="statSub" style={{ fontSize: 11 }}>Insight generated based on recent rolling activity window.</div>
                <button className="chip" style={{ marginTop: 10, cursor: 'pointer', background: 'var(--card2)', color: 'var(--text)' }}>ACTION</button>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="h2">SIGNALS</div>
            <div className="rowFlex" style={{ justifyContent: 'space-between', marginTop: 15 }}>
              <div style={{ flex: 1, paddingRight: 15, borderRight: '1px solid var(--border)' }}>
                <div className="statLbl" style={{ marginBottom: 10, color: 'var(--good)' }}>ACTIVE STREAMS</div>
                <div className="chip" style={{ marginBottom: 5 }}>TRAINING (High)</div>
                <div className="chip">LISTENING (Stable)</div>
              </div>
              <div style={{ flex: 1, paddingLeft: 15 }}>
                <div className="statLbl" style={{ marginBottom: 10, color: 'var(--bad)' }}>STALLED STREAMS</div>
                <div className="chip">EVENTS (Needs Review)</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="h2">SYSTEM PULSE (41 WEEKS)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 15 }}>
              {heatStreams.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="mono" style={{ width: 80, fontSize: 10, color: 'var(--text2)' }}>{s.label}</div>
                  <div style={{ display: 'flex', gap: 2, flex: 1 }}>
                    {s.arr.map((val, j) => (
                      <div key={j} style={{ flex: 1, aspectRatio: '1/1', background: 'var(--accent)', opacity: Math.max(0.1, val), borderRadius: 2 }} title={`${s.label} Week ${j+1}`} />
                    ))}
                  </div>
                </div>
              ))}
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
                <input type="checkbox" className="chk" checked={t.completed} onChange={() => toggleTask(t.id)} />
                <span className="mono" style={{ fontSize: 12, flex: 1, color: t.completed ? 'var(--mut)' : 'var(--text)' }}>{t.text}</span>
              </div>
            )) : <div className="mono" style={{ fontSize: 12, color: 'var(--mut)' }}>No pending tasks.</div>}
          </div>

          <div className="card">
            <div className="h2">ATTENTION ALLOCATION</div>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{n:'Train', v:30}, {n:'Listen', v:40}, {n:'Learn', v:20}, {n:'Rest', v:10}]} dataKey="v" nameKey="n" innerRadius="60%" outerRadius="80%" paddingAngle={2}>
                    <Cell fill={DOMAIN_COLORS?.training || 'var(--accent)'} />
                    <Cell fill={DOMAIN_COLORS?.spotify || 'var(--good)'} />
                    <Cell fill={DOMAIN_COLORS?.vault || 'var(--warn)'} />
                    <Cell fill="var(--mut)" />
                  </Pie>
                  <Tooltip contentStyle={ttStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="rowFlex" style={{ justifyContent: 'center', gap: 15 }}>
              {['Train', 'Listen', 'Learn', 'Rest'].map((l, i) => (
                <div key={l} className="rowFlex" style={{ gap: 5, fontSize: 10, color: 'var(--text2)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: [DOMAIN_COLORS?.training || 'var(--accent)', DOMAIN_COLORS?.spotify || 'var(--good)', DOMAIN_COLORS?.vault || 'var(--warn)', 'var(--mut)'][i] }} />
                  {l}
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="h2">PLACEMENT PLAN</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15, marginTop: 15 }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i}>
                  <div className="rowFlex" style={{ justifyContent: 'space-between', marginBottom: 5, fontSize: 10, color: 'var(--text2)' }}>
                    <span>MONTH {i}</span>
                    <span>{i*25}%</span>
                  </div>
                  <div className="track">
                    <div className="fill" style={{ width: `${i*25}%`, background: 'var(--accent)' }} />
                  </div>
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
