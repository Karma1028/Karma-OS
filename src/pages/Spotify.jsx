import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';
import { fmtInt, CHART_COLORS } from '../utils/helpers';
import { showToast } from '../components/Toast';

export default function Spotify({ data }) {
  const { summary, deep, artist_history } = data?.spotify || {};
  const { spotify: stat, heat } = data?.stats || {};
  
  if (!summary || !stat) return <div className="card">No Spotify data.</div>;

  const handleSync = () => {
    showToast('Syncing Spotify data...');
    setTimeout(() => showToast('Spotify synced successfully.', 'good'), 1000);
  };

  const handleArtist = (a) => showToast(`Selected artist: ${a}`);

  const monthData = [
    { m: 'Jan', v: 4500 }, { m: 'Feb', v: 3800 }, { m: 'Mar', v: 5100 }, { m: 'Apr', v: 4900 },
    { m: 'May', v: 6200 }, { m: 'Jun', v: 5500 }, { m: 'Jul', v: 4800 }, { m: 'Aug', v: 5300 },
    { m: 'Sep', v: 4100 }, { m: 'Oct', v: 6000 }, { m: 'Nov', v: 5200 }, { m: 'Dec', v: 5800 }
  ];

  const clockData = Array.from({length: 24}, (_, i) => ({ h: i, v: Math.floor(Math.random()*100 + (i>8 && i<22 ? 50 : 10)) }));
  
  const lorenzData = stat.lorenz || [{ p:0, v:0, r:0 }, { p:20, v:5, r:20 }, { p:40, v:15, r:40 }, { p:60, v:30, r:60 }, { p:80, v:60, r:80 }, { p:100, v:100, r:100 }];
  
  const radarData = [
    { s: 'Acousticness', v: 0.3 }, { s: 'Danceability', v: 0.6 },
    { s: 'Energy', v: 0.8 }, { s: 'Instrumentalness', v: 0.1 },
    { s: 'Liveness', v: 0.2 }, { s: 'Valence', v: 0.5 }
  ];
  
  const heatmap = heat || Array(7).fill(Array(24).fill(0).map(()=>Math.random()));
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  const sessBins = [
    { n: '0-5m', v: 40 }, { n: '5-10m', v: 65 }, { n: '10-20m', v: 30 },
    { n: '20-30m', v: 20 }, { n: '30-60m', v: 15 }, { n: '60+m', v: 13 }
  ];

  const loyalData = [
    { a: 'Artist 1', v: 800, eq: 200 }, { a: 'Artist 2', v: 650, eq: 200 },
    { a: 'Artist 3', v: 500, eq: 200 }, { a: 'Artist 4', v: 400, eq: 200 },
    { a: 'Artist 5', v: 300, eq: 200 }
  ];

  let cum = 0;
  const trendData = monthData.map(d => { cum += d.v; return { m: d.m, v: cum }; });

  const skipData = [
    { n: 'Plays', v: 75 }, { n: 'Skips', v: 25 }
  ];

  const playlists = [
    { n: 'Focus', t: 45, d: '2026-07-20', a: 'Fresh' },
    { n: 'Workout', t: 120, d: '2026-06-15', a: 'Stale' },
    { n: 'Chill', t: 80, d: '2026-07-01', a: 'Good' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="card rowFlex" style={{ justifyContent: 'space-between' }}>
        <div>
          <div className="h2">{summary.email || 'user@spotify.com'}</div>
          <div className="statSub">Spotify Premium • Connected</div>
        </div>
        <button className="hl" onClick={handleSync}>Sync Now</button>
      </div>

      <div className="brief">
        <div style={{ color: 'var(--accent)', marginBottom: '0.5rem', fontWeight: 'bold' }}>AI READ</div>
        <div>Attention inequality is extremely high (Gini {stat.gini || '0.70'}). You exhibit obsessive listening behavior for a small handful of artists. Entropy is low ({stat.entropy || '2.1'}).</div>
      </div>

      <div className="grid4">
        <div className="statCard"><div className="statLbl">TOTAL MIN</div><div className="statVal">{fmtInt(stat.totalMin || 61200)}</div></div>
        <div className="statCard"><div className="statLbl">UNIQUE TRACKS</div><div className="statVal">{fmtInt(stat.uniqueTracks || 1420)}</div></div>
        <div className="statCard"><div className="statLbl">SESSIONS</div><div className="statVal">{fmtInt(stat.sessions || 183)}</div></div>
        <div className="statCard"><div className="statLbl">EFF ARTISTS</div><div className="statVal">{stat.eff?.toFixed(1) || '12.4'}</div></div>
      </div>

      <div className="grid2">
        <div className="card">
          <div className="h2sub">Minutes by Month</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthData}>
              <XAxis dataKey="m" tick={{ fill: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10 }} />
              <Bar dataKey="v" fill={CHART_COLORS[0]} animationDuration={800} animationEasing="ease-out" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="h2sub">Listening Clock</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={clockData}>
              <XAxis dataKey="h" tick={{ fill: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10 }} />
              <Bar dataKey="v" fill={CHART_COLORS[1]} animationDuration={800} animationEasing="ease-out" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <div className="h2sub">Attention Inequality (Lorenz)</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={lorenzData}>
              <XAxis dataKey="p" tick={{ fill: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10 }} />
              <Line type="monotone" dataKey="v" stroke={CHART_COLORS[2]} strokeWidth={2} dot={false} animationDuration={800} animationEasing="ease-out" />
              <Line type="monotone" dataKey="r" stroke="var(--mut)" strokeDasharray="3 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="h2sub">Listening Identity</div>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData} outerRadius={70}>
              <PolarGrid stroke="var(--border2)" />
              <PolarAngleAxis dataKey="s" tick={{ fill: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 1]} tick={false} />
              <Radar name="Score" dataKey="v" stroke={CHART_COLORS[3]} fill={CHART_COLORS[3]} fillOpacity={0.5} animationDuration={800} animationEasing="ease-out" />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <div className="h2sub">Top Tracks</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {['Track A', 'Track B', 'Track C', 'Track D', 'Track E'].map((t, i) => (
              <div key={i} className="rowFlex track" style={{ justifyContent: 'space-between' }}>
                <span>{i+1}. {t}</span>
                <span className="statSub">{Math.floor(Math.random()*100+20)} plays</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="h2sub">Top Artists</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {['Artist A', 'Artist B', 'Artist C', 'Artist D', 'Artist E'].map((a, i) => (
              <div key={i} className="rowFlex track" style={{ justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => handleArtist(a)}>
                <span>{i+1}. {a}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '50px', height: '4px', background: 'var(--track)' }}>
                    <div className="fill" style={{ width: `${100 - i*15}%`, background: CHART_COLORS[i%CHART_COLORS.length] }}></div>
                  </div>
                  <span className="statSub">{Math.floor(Math.random()*1000+200)}m</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid3">
        <div className="insightCard">
          <div className="h2sub">Revival</div>
          <div className="statSub">Listen to older tracks you've neglected.</div>
        </div>
        <div className="insightCard">
          <div className="h2sub">Focus Flow</div>
          <div className="statSub">Instrumental beats for deep work.</div>
        </div>
        <div className="insightCard">
          <div className="h2sub">Search Trail</div>
          <div className="statSub">Explore new artists similar to your top.</div>
        </div>
      </div>

      <div className="card">
        <div className="h2sub">Digital Footprint</div>
        <div className="rowFlex" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
          {['Night Owl', 'Repeat Listener', 'Genre: EDM', 'High Energy', 'Loyalist'].map((tag, i) => (
            <div key={i} className="aiTag chip">{tag}</div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="h2sub">Day-of-Week × Hour Heatmap</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {days.map((d, i) => (
            <div key={d} style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
              <div style={{ width: '30px', fontSize: '10px', color: 'var(--mut)', fontFamily: 'IBM Plex Mono' }}>{d}</div>
              {Array.from({length: 24}).map((_, j) => {
                const val = (heatmap[i] && heatmap[i][j]) || Math.random();
                return (
                  <div key={j} title={`${d} ${j}:00 - ${(val*100).toFixed(0)}`} style={{ flex: 1, height: '20px', background: CHART_COLORS[0], opacity: val*0.8+0.1, borderRadius: '2px' }}></div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <div className="h2sub">Session Length Dist</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sessBins}>
              <XAxis dataKey="n" tick={{ fill: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10 }} />
              <Bar dataKey="v" fill={CHART_COLORS[4]} animationDuration={800} animationEasing="ease-out" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="h2sub">Artist Loyalty (Actual vs Equal)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={loyalData}>
              <XAxis dataKey="a" tick={{ fill: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10 }} />
              <Bar dataKey="v" fill={CHART_COLORS[2]} name="Actual" animationDuration={800} animationEasing="ease-out" />
              <Bar dataKey="eq" fill="var(--track)" name="Equal" animationDuration={800} animationEasing="ease-out" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <div className="h2sub">Listening Trend (Cumulative)</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" vertical={false} />
              <XAxis dataKey="m" tick={{ fill: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10 }} />
              <Area type="monotone" dataKey="v" stroke={CHART_COLORS[1]} fill={CHART_COLORS[1]} fillOpacity={0.2} animationDuration={800} animationEasing="ease-out" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="h2sub">Play vs Skip</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={skipData} dataKey="v" cx="50%" cy="50%" innerRadius={50} outerRadius={70} stroke="none" animationDuration={800} animationEasing="ease-out">
                {skipData.map((e, i) => <Cell key={i} fill={i===0 ? CHART_COLORS[0] : 'var(--track)'} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="h2sub">Playlist Health</div>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border2)', color: 'var(--mut)' }}>
              <th style={{ padding: '0.5rem' }}>Playlist</th>
              <th style={{ padding: '0.5rem' }}>Tracks</th>
              <th style={{ padding: '0.5rem' }}>Modified</th>
              <th style={{ padding: '0.5rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {playlists.map((p, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border2)' }}>
                <td style={{ padding: '0.5rem' }}>{p.n}</td>
                <td style={{ padding: '0.5rem', fontFamily: 'IBM Plex Mono' }}>{p.t}</td>
                <td style={{ padding: '0.5rem', fontFamily: 'IBM Plex Mono' }}>{p.d}</td>
                <td style={{ padding: '0.5rem' }}>
                  <span className="chip" style={{ background: p.a==='Fresh' ? 'var(--goodBg)' : p.a==='Stale' ? 'var(--badBg)' : 'var(--infoBg)', color: p.a==='Fresh' ? 'var(--good)' : p.a==='Stale' ? 'var(--bad)' : 'var(--info)' }}>{p.a}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
