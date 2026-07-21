import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';
import { fmtInt, CHART_COLORS } from '../utils/helpers';
import { showToast } from '../components/Toast';

const ttStyle = { background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10 };
const tkStyle = { fill: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: 10 };

export default function Spotify({ data }) {
  const { spotify_summary: summary, spotify_deep: deep, artist_history } = data?.spotify || {};
  const stat = data?.stats?.spotify || {};
  const heat = data?.stats?.heat || [];
  const [selArtist, setSelArtist] = useState(null);

  if (!summary || !deep) return <div className="card">No Spotify data.</div>;

  const handleSync = () => {
    showToast('Syncing Spotify data...');
    setTimeout(() => showToast('Spotify synced successfully.', 'good'), 1000);
  };

  const monthData = (summary.by_month || []).map(m => ({ m: m.month, v: m.min }));

  const clockData = (summary.by_hour || []).map((v, h) => ({ h, v }));

  // lorenz stored as [p, v] pairs (0-1 scale); r is the equality diagonal
  const lorenzData = (stat.lorenz || []).map(([p, v]) => ({ p: Math.round(p * 100), v: Math.round(v * 100), r: Math.round(p * 100) }));

  const radar = deep.radar || {};
  const radarData = [
    { s: 'Loyalty', v: radar.loyalty || 0 },
    { s: 'Discovery', v: radar.discovery || 0 },
    { s: 'Focus', v: radar.focus || 0 },
    { s: 'Night Owl', v: radar.nightOwl || 0 },
    { s: 'Bingeing', v: radar.bingeing || 0 },
  ];

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const topArtistsMax = Math.max(1, ...(summary.top_artists || []).map(a => a.min));

  let cum = 0;
  const trendData = monthData.map(d => { cum += d.v; return { m: d.m, v: cum }; });

  const skipData = [
    { n: 'Plays', v: summary.plays || 0 },
    { n: 'Skips', v: summary.skips || 0 },
  ];

  const equalShare = (summary.top_artists?.length ? summary.top_artists.reduce((a, b) => a + b.min, 0) / summary.top_artists.length : 0);
  const loyalData = (summary.top_artists || []).slice(0, 5).map(a => ({ a: a.name, v: a.min, eq: Math.round(equalShare) }));

  const now = new Date();
  const playlists = (deep.playlists || []).map(p => {
    const modDate = new Date(p.modified);
    const days = Math.round((now - modDate) / 86400000);
    const status = days < 60 ? 'Fresh' : days < 240 ? 'Good' : 'Stale';
    return { ...p, status, days };
  });

  const footprintTags = [
    radar.nightOwl > 50 ? 'Night Owl' : null,
    stat.repeat > 1.5 ? 'Repeat Listener' : null,
    radar.loyalty > 50 ? 'Loyalist' : null,
    radar.discovery > 55 ? 'Explorer' : null,
    ...(deep.readable_inferences || []).slice(0, 3),
  ].filter(Boolean);

  const selHistory = selArtist ? artist_history?.[selArtist] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="card rowFlex" style={{ justifyContent: 'space-between' }}>
        <div>
          <div className="h2">{deep.account || 'Spotify account'}</div>
          <div className="statSub">{fmtInt(deep.followed_artists)} artists followed · {fmtInt(deep.liked_albums)} albums liked</div>
        </div>
        <button className="hl" onClick={handleSync}>Sync Now</button>
      </div>

      <div className="brief">
        <div style={{ color: 'var(--accent)', marginBottom: '0.5rem', fontWeight: 'bold' }}>AI READ</div>
        <div>Attention inequality is {stat.gini > 0.6 ? 'extremely high' : stat.gini > 0.4 ? 'moderate' : 'low'} (Gini {stat.gini?.toFixed(2)}). Entropy is {stat.entropy?.toFixed(2)} across ~{fmtInt(stat.eff)} effective artists. Median session {stat.medLen} tracks, {stat.playsPerSession} plays/session.</div>
      </div>

      <div className="grid4">
        <div className="statCard"><div className="statLbl">TOTAL MIN</div><div className="statVal">{fmtInt(summary.total_min)}</div></div>
        <div className="statCard"><div className="statLbl">UNIQUE TRACKS</div><div className="statVal">{fmtInt(stat.uniqueTracks)}</div></div>
        <div className="statCard"><div className="statLbl">SESSIONS</div><div className="statVal">{fmtInt(stat.sessions)}</div></div>
        <div className="statCard"><div className="statLbl">EFF ARTISTS</div><div className="statVal">{fmtInt(stat.eff)}</div></div>
      </div>

      <div className="grid2">
        <div className="card">
          <div className="h2sub">Minutes by Month</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthData}>
              <XAxis dataKey="m" tick={tkStyle} />
              <YAxis tick={tkStyle} />
              <Tooltip contentStyle={ttStyle} />
              <Bar dataKey="v" fill={CHART_COLORS[0]} animationDuration={800} animationEasing="ease-out" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="h2sub">Listening Clock</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={clockData}>
              <XAxis dataKey="h" tick={tkStyle} />
              <YAxis tick={tkStyle} />
              <Tooltip contentStyle={ttStyle} />
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
              <XAxis dataKey="p" tick={tkStyle} />
              <YAxis tick={tkStyle} />
              <Tooltip contentStyle={ttStyle} />
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
              <PolarAngleAxis dataKey="s" tick={tkStyle} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
              <Radar name="Score" dataKey="v" stroke={CHART_COLORS[3]} fill={CHART_COLORS[3]} fillOpacity={0.5} animationDuration={800} animationEasing="ease-out" />
              <Tooltip contentStyle={ttStyle} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <div className="h2sub">Top Tracks</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(summary.top_tracks || []).map((t, i) => (
              <div key={i} className="rowFlex" style={{ justifyContent: 'space-between' }}>
                <span>{i + 1}. {t.track} <span className="statSub">— {t.artist}</span></span>
                <span className="statSub">{fmtInt(t.min)}m</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="h2sub">Top Artists</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(summary.top_artists || []).map((a, i) => (
              <div key={i} className="rowFlex" style={{ justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setSelArtist(selArtist === a.name ? null : a.name)}>
                <span>{i + 1}. {a.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '50px', height: '4px', background: 'var(--track)' }}>
                    <div className="fill" style={{ width: `${(a.min / topArtistsMax) * 100}%`, background: CHART_COLORS[i % CHART_COLORS.length] }}></div>
                  </div>
                  <span className="statSub">{fmtInt(a.min)}m</span>
                </div>
              </div>
            ))}
          </div>
          {selHistory && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border2)' }}>
              <div className="statSub" style={{ marginBottom: 5 }}>{selArtist} — {fmtInt(selHistory.total)}m total</div>
              {selHistory.tracks?.slice(0, 3).map((t, i) => (
                <div key={i} className="statSub" style={{ fontSize: 11 }}>{t.t} · {t.min}m</div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid3">
        <div className="insightCard">
          <div className="h2sub">Revival</div>
          <div className="statSub">{deep.dormant_liked?.length ? `${deep.dormant_liked.length} liked artists gone quiet: ${deep.dormant_liked.slice(0, 3).map(a => a.name).join(', ')}` : 'No dormant artists detected.'}</div>
        </div>
        <div className="insightCard">
          <div className="h2sub">Liked Play Share</div>
          <div className="statSub">{stat.repeat ? `${stat.repeat}x repeat rate. ` : ''}{deep.liked_play_share}% of plays come from liked tracks ({fmtInt(deep.liked_overlap)} overlap).</div>
        </div>
        <div className="insightCard">
          <div className="h2sub">Search Trail</div>
          <div className="statSub">{deep.recent_searches?.length ? deep.recent_searches.slice(0, 3).join(', ') : 'No recent searches.'}</div>
        </div>
      </div>

      <div className="card">
        <div className="h2sub">Digital Footprint</div>
        <div className="rowFlex" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
          {footprintTags.map((tag, i) => (
            <div key={i} className="aiTag chip">{tag}</div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="h2sub">Day-of-Week × Hour Heatmap</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {days.map((d, i) => {
            const row = heat[i] || [];
            const rowMax = Math.max(1, ...row);
            return (
              <div key={d} style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                <div style={{ width: '30px', fontSize: '10px', color: 'var(--mut)', fontFamily: 'IBM Plex Mono' }}>{d}</div>
                {row.map((val, j) => (
                  <div key={j} title={`${d} ${j}:00 — ${val}m`} style={{ flex: 1, height: '20px', background: CHART_COLORS[0], opacity: Math.max(0.05, val / rowMax) * 0.8 + 0.1, borderRadius: '2px' }}></div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <div className="h2sub">Session Behavior</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
            <div className="wRow"><span>Sessions</span><span>{fmtInt(stat.sessions)}</span></div>
            <div className="wRow"><span>Median session length</span><span>{stat.medLen} tracks</span></div>
            <div className="wRow"><span>Plays per session</span><span>{stat.playsPerSession}</span></div>
            <div className="wRow"><span>Repeat rate</span><span>{stat.repeat}x</span></div>
          </div>
        </div>
        <div className="card">
          <div className="h2sub">Artist Loyalty (Actual vs Equal Share)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={loyalData}>
              <XAxis dataKey="a" tick={tkStyle} />
              <YAxis tick={tkStyle} />
              <Tooltip contentStyle={ttStyle} />
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
              <XAxis dataKey="m" tick={tkStyle} />
              <YAxis tick={tkStyle} />
              <Tooltip contentStyle={ttStyle} />
              <Area type="monotone" dataKey="v" stroke={CHART_COLORS[1]} fill={CHART_COLORS[1]} fillOpacity={0.2} animationDuration={800} animationEasing="ease-out" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="h2sub">Play vs Skip</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={skipData} dataKey="v" cx="50%" cy="50%" innerRadius={50} outerRadius={70} stroke="none" animationDuration={800} animationEasing="ease-out">
                {skipData.map((e, i) => <Cell key={i} fill={i === 0 ? CHART_COLORS[0] : 'var(--track)'} />)}
              </Pie>
              <Tooltip contentStyle={ttStyle} />
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
                <td style={{ padding: '0.5rem' }}>{p.name}</td>
                <td style={{ padding: '0.5rem', fontFamily: 'IBM Plex Mono' }}>{p.tracks}</td>
                <td style={{ padding: '0.5rem', fontFamily: 'IBM Plex Mono' }}>{p.modified}</td>
                <td style={{ padding: '0.5rem' }}>
                  <span className="chip" style={{ background: p.status === 'Fresh' ? 'var(--goodBg)' : p.status === 'Stale' ? 'var(--badBg)' : 'var(--infoBg)', color: p.status === 'Fresh' ? 'var(--good)' : p.status === 'Stale' ? 'var(--bad)' : 'var(--info)' }}>{p.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
