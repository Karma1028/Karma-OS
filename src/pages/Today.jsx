import React, { useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';
import useStore from '../store/useStore';
import { DOMAIN_COLORS, TODAY } from '../utils/helpers';
import { showToast } from '../components/Toast';

export default function Today({ data }) {
  const { tasks, addTask } = useStore();
  const openTasks = tasks.filter(t => !t.done).length;

  const activeStreams = data.activity?.streams?.filter(s => s.active)?.length || 0;
  const totalStreams = data.activity?.streams?.length || 4;
  const dayScore = totalStreams ? Math.round((activeStreams / totalStreams) * 100) : 75;

  const todayEvents = useMemo(() => {
    const todayStr = TODAY.toISOString();
    const todayDateOnly = todayStr.slice(0, 10);
    let evs = [];
    if (data.feed?.items) {
      evs = data.feed.items.filter(i => i.date === todayDateOnly || i.date.startsWith(todayDateOnly));
    }
    evs.push({ date: todayStr, type: 'system', title: 'Dashboard generated', detail: 'KARMA-OS v2 init', domain: 'intel' });
    evs.push({ date: '2026-07-19', type: 'system', title: 'Odysseus MCP wired (2d ago)', detail: 'Agent connected', domain: 'intel' });
    return evs.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [data.feed]);

  const compData = [
    { metric: 'Vol', today: 0, d7: 12000, d30: 15000 },
    { metric: 'Music', today: 0, d7: 45, d30: 60 },
    { metric: 'Knowledge', today: 0, d7: 2, d30: 5 },
    { metric: 'Tasks', today: tasks.filter(t => t.done).length, d7: 3, d30: 4 }
  ];

  const hourlyData = useMemo(() => {
    if (!data.spotify?.summary?.by_hour) return [];
    return data.spotify.summary.by_hour.map(h => ({
      hour: h.hour,
      intensity: h.count || 0
    }));
  }, [data.spotify]);

  const handleQueue = (taskText) => {
    addTask({ text: taskText, done: false, date: TODAY });
    showToast(`Queued: ${taskText}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
      
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '30px' }}>
        <div style={{ width: 100, height: 100 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={[{ value: dayScore }, { value: 100 - dayScore }]} innerRadius={35} outerRadius={45} dataKey="value" startAngle={90} endAngle={-270} stroke="none">
                <Cell fill="var(--accent)" />
                <Cell fill="var(--track)" />
              </Pie>
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="var(--text)" style={{ fontFamily: 'IBM Plex Mono', fontSize: 24, fontWeight: 'bold' }}>{dayScore}</text>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '2em', color: 'var(--text)' }}>Monday · July 21, 2026</h1>
          <p style={{ margin: '5px 0 0', color: 'var(--mut)', fontSize: '1.1em' }}>All systems nominal. Training backlog is growing; consider a comeback session tonight.</p>
        </div>
      </div>

      <div className="g4">
        <div className="statCard">
          <div className="statLbl">Today's Training</div>
          <div className="statVal">0 <span className="statSub">sessions</span></div>
          <div className="statSub" style={{ color: 'var(--warn)' }}>Last: May 23</div>
        </div>
        <div className="statCard">
          <div className="statLbl">Today's Listening</div>
          <div className="statVal">0 <span className="statSub">min</span></div>
          <div className="statSub" style={{ color: 'var(--bad)' }}>Sync stale</div>
        </div>
        <div className="statCard">
          <div className="statLbl">Today's Captures</div>
          <div className="statVal">0 <span className="statSub">items</span></div>
          <div className="statSub">Vault indexed</div>
        </div>
        <div className="statCard">
          <div className="statLbl">Open Tasks</div>
          <div className="statVal">{openTasks} <span className="statSub">pending</span></div>
          <div className="statSub" style={{ color: 'var(--accent)' }}>System queued</div>
        </div>
      </div>

      <div className="g2">
        <div className="card" style={{ padding: '20px' }}>
          <h2 className="h2" style={{ marginBottom: '20px' }}>Live Feed</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {todayEvents.map((ev, i) => (
              <div key={i} className="timeline-item">
                <div className="timeline-time" style={{ width: '50px', flexShrink: 0, color: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: '0.9em' }}>
                  {ev.date.split('T')[1]?.substring(0,5) || '00:00'}
                </div>
                <div className="timeline-dot" style={{ backgroundColor: DOMAIN_COLORS[ev.domain] || 'var(--accent)' }}></div>
                <div className="timeline-content">
                  <div className="timeline-title">{ev.title}</div>
                  <div className="timeline-detail">{ev.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '20px', height: '250px' }}>
            <h2 className="h2" style={{ marginBottom: '10px' }}>Pacing (Today vs 7d vs 30d)</h2>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compData} margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" vertical={false} />
                <XAxis dataKey="metric" tick={{ fill: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10 }} />
                <Bar dataKey="today" fill="var(--accent)" animationDuration={800} animationEasing="ease-out" />
                <Bar dataKey="d7" fill="var(--track)" animationDuration={800} animationEasing="ease-out" />
                <Bar dataKey="d30" fill="var(--border)" animationDuration={800} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="g2">
            <div className="brief" style={{ backgroundColor: 'var(--briefBg)', border: '1px solid var(--briefBd)', padding: '15px', borderRadius: '8px' }}>
              <div className="statLbl" style={{ color: DOMAIN_COLORS.fitness }}>Training Stream</div>
              <div className="statVal" style={{ fontSize: '1.2em' }}>59d <span className="statSub">since last</span></div>
              <div className="statSub">ACWR: 0.0</div>
            </div>
            <div className="brief" style={{ backgroundColor: 'var(--briefBg)', border: '1px solid var(--briefBd)', padding: '15px', borderRadius: '8px' }}>
              <div className="statLbl" style={{ color: DOMAIN_COLORS.vault }}>Knowledge Stream</div>
              <div className="statVal" style={{ fontSize: '1.2em' }}>1d <span className="statSub">since last</span></div>
              <div className="statSub">Backlog: {data.vault?.notebooks?.length || 0}</div>
            </div>
            <div className="brief" style={{ backgroundColor: 'var(--briefBg)', border: '1px solid var(--briefBd)', padding: '15px', borderRadius: '8px' }}>
              <div className="statLbl" style={{ color: DOMAIN_COLORS.memory }}>Memory Stream</div>
              <div className="statVal" style={{ fontSize: '1.2em' }}>3d <span className="statSub">since last</span></div>
              <div className="statSub">Palace: Syncing</div>
            </div>
            <div className="brief" style={{ backgroundColor: 'var(--briefBg)', border: '1px solid var(--briefBd)', padding: '15px', borderRadius: '8px' }}>
              <div className="statLbl" style={{ color: DOMAIN_COLORS.intel }}>Intel Stream</div>
              <div className="statVal" style={{ fontSize: '1.2em' }}>99% <span className="statSub">uptime</span></div>
              <div className="statSub">Last run: Today</div>
            </div>
          </div>
        </div>
      </div>

      <div className="g2">
        <div className="card" style={{ padding: '20px' }}>
          <h2 className="h2" style={{ marginBottom: '15px' }}>Prescribed Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[{ text: 'Comeback session — Push A @70%', reason: 'No workout today' },
              { text: 'Clear ingest backlog', reason: '>50 items pending' },
              { text: 'Write to history.jsonl', reason: 'Memory stale' }].map((act, i) => (
              <div key={i} className="taskRow" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: 'var(--card2)', borderRadius: '6px' }}>
                <div>
                  <div style={{ color: 'var(--text)' }}>{act.text}</div>
                  <div style={{ color: 'var(--mut)', fontSize: '0.85em' }}>{act.reason}</div>
                </div>
                <button 
                  onClick={() => handleQueue(act.text)}
                  style={{ background: 'var(--accent)', border: 'none', color: 'var(--card)', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'IBM Plex Mono', fontSize: '0.9em', fontWeight: 'bold' }}>
                  Queue task
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: '20px', height: '250px' }}>
          <h2 className="h2" style={{ marginBottom: '10px' }}>Hourly Intensity</h2>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData} margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
              <defs>
                <linearGradient id="colorInt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10 }} />
              <Area type="monotone" dataKey="intensity" stroke="var(--accent)" fillOpacity={1} fill="url(#colorInt)" animationDuration={800} animationEasing="ease-out" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
