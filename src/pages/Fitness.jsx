import React from 'react';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid, ScatterChart, Scatter, Treemap 
} from 'recharts';
import useStore from '../store/useStore';
import { showToast } from '../components/Toast';
import BodyMap from '../components/BodyMap';
import { 
  fmtInt, fmtKg, short, SPLIT_COLORS, CHART_COLORS 
} from '../utils/helpers';

export default function Fitness({ data }) {
  const splitFilter = useStore(s => s.splitFilter || 'All');
  const setSplitFilter = useStore(s => s.setSplitFilter || (() => {}));

  const { hevy = {}, stats = {} } = data || {};
  const { hevy_summary: summary = {}, hevy_analytics: analytics = {}, hevy_audit: audit = {} } = hevy;
  const fstats = stats.fitness || {};

  const sessions = (summary.recent || []).map(s => ({ ...s, name: s.title, split: s.title }));
  const prs = summary.prs || [];
  const muscleGroups = analytics.muscle_groups || [];
  const weeklyVol = analytics.weekly_volume || [];
  const progression = analytics.progression || [];
  const regWatch = analytics.regression_watch || [];
  const junkVol = audit.junk_volume || [];
  
  const filteredSessions = splitFilter === 'All' ? sessions : sessions.filter(s => s.split === splitFilter);
  
  const radarData = muscleGroups.map(m => ({ subject: m.name, A: m.sets, fullMark: 150 }));

  const pieData = Object.entries(summary.split_counts || {}).map(([k, v]) => ({ name: k, value: v }));

  const weeklyBarData = weeklyVol.map(w => ({ name: w.week, vol: w.vol }));

  const volByMuscle = muscleGroups.slice().sort((a,b) => b.vol - a.vol);

  const rampRateData = weeklyVol.map((w, i) => {
    if(i === 0) return { name: w.week, change: 0 };
    const prev = weeklyVol[i-1].vol;
    const curr = w.vol;
    return { name: w.week, change: prev ? ((curr - prev) / prev) * 100 : 0 };
  });

  const lastWeek = weeklyVol[weeklyVol.length - 1];
  const prevWeek = weeklyVol[weeklyVol.length - 2];
  const weekDeltaPct = lastWeek && prevWeek && prevWeek.vol
    ? Math.round(((lastWeek.vol - prevWeek.vol) / prevWeek.vol) * 100) : null;
  const topGainer = progression.filter(p => p.pct > 0).sort((a, b) => b.pct - a.pct)[0];
  const understaffedMuscle = volByMuscle.length ? volByMuscle[volByMuscle.length - 1] : null;

  const periodizationData = weeklyVol.map(w => {
     const wSess = sessions.filter(s => s.date?.startsWith(w.week?.slice(0, 7)));
     const bySplit = {};
     wSess.forEach(s => { bySplit[s.split] = (bySplit[s.split] || 0) + (s.vol || 0); });
     return { name: w.week, ...bySplit };
  });

  const efficiencyData = sessions.map(s => ({
    name: s.name,
    sets: s.sets || 0,
    vol: s.vol || 0,
    split: s.split
  }));

  const calDays = Array.from({length: 28}, (_, i) => {
     const d = new Date();
     d.setDate(d.getDate() - (27 - i));
     const ds = d.toISOString().split('T')[0];
     const sess = sessions.find(s => s.date === ds);
     return { date: ds, sess };
  });

  const treeMapData = muscleGroups.map(m => ({ name: m.name, size: m.vol }));

  return (
    <div style={{ paddingBottom: '40px' }}>
       <div className="grid4" style={{ marginBottom: 20 }}>
         <div className="statCard">
            <div className="statLbl">TOTAL VOLUME</div>
            <div className="statVal">{fmtKg(summary.total_volume_kg)}</div>
         </div>
         <div className="statCard">
            <div className="statLbl">WORKING SETS</div>
            <div className="statVal">{fmtInt(summary.total_sets)}</div>
         </div>
         <div className="statCard">
            <div className="statLbl">DATE RANGE</div>
            <div className="statVal" style={{fontSize:14}}>{summary.first_date ? `${short(summary.first_date)} - ${short(summary.last_date)}` : 'N/A'}</div>
         </div>
         <div className="statCard">
            <div className="statLbl">PRs LOGGED</div>
            <div className="statVal">{prs.length}</div>
         </div>
       </div>

       <div className="brief" style={{ marginBottom: 20 }}>
         <div className="h2" style={{color:'var(--accent)'}}>COACH'S READ</div>
         <div className="grid3">
           <div>
             <div className="h2sub" style={{color: weekDeltaPct > 20 ? 'var(--bad)' : 'var(--warn)'}}>VOLUME VS LAST WEEK</div>
             <div style={{color:'var(--text2)', fontSize:12}}>
               {weekDeltaPct === null ? 'Not enough weekly data yet.' :
                 `${weekDeltaPct > 0 ? '+' : ''}${weekDeltaPct}% vs prior week (${fmtKg(prevWeek?.vol || 0)} → ${fmtKg(lastWeek?.vol || 0)}).${weekDeltaPct > 20 ? ' Sharp jump — watch recovery.' : ''}`}
             </div>
           </div>
           <div>
             <div className="h2sub" style={{color:'var(--bad)'}}>WEAKEST MUSCLE COVERAGE</div>
             <div style={{color:'var(--text2)', fontSize:12}}>
               {understaffedMuscle ? `${understaffedMuscle.name}: only ${fmtKg(understaffedMuscle.vol)} across ${understaffedMuscle.sets} sets — lowest of all tracked groups.` : 'No muscle-group data yet.'}
             </div>
           </div>
           <div>
             <div className="h2sub" style={{color:'var(--good)'}}>BIGGEST GAINER</div>
             <div style={{color:'var(--text2)', fontSize:12}}>
               {topGainer ? `${topGainer.name}: ${topGainer.first}kg → ${topGainer.last}kg (+${topGainer.pct}%) over ${topGainer.sessions} sessions.` : 'No exercise trending up yet.'}
             </div>
           </div>
         </div>
       </div>

       <div className="card" style={{ marginBottom: 20 }}>
         <div className="h2">PROGRAMMING AUDIT</div>
         <div className="grid2">
           <div>
             <div className="h2sub" style={{color:'var(--bad)'}}>JUNK VOLUME DETECTED</div>
             {junkVol.map((j, i) => (
                <div key={`${j.name}-${j.date}-${i}`} className="wRow">
                   <span>{j.name}</span>
                   <span style={{color:'var(--text2)'}}>{j.sets} sets excess ({j.session})</span>
                </div>
             ))}
           </div>
           <div>
             <div className="h2sub" style={{color:'var(--warn)'}}>REGRESSION WATCH</div>
             {regWatch.map(r => (
                <div key={r.name} className="wRow">
                   <span>{r.name}</span>
                   <span style={{color:'var(--bad)'}}>{r.pct}% drop</span>
                </div>
             ))}
           </div>
         </div>
       </div>

       <div className="grid2" style={{ marginBottom: 20 }}>
         <div className="card">
           <div className="h2">CONSISTENCY & STREAKS</div>
           <div style={{display:'flex', gap:10, flexWrap:'wrap', marginBottom: 20}}>
             <div className="chip">PRs: {prs.length}</div>
             <div className="chip">Active Weeks: {fstats.activeWeeks}/{fstats.totalWeeks}</div>
             <div className="chip">Max Streak: {fstats.maxStreak} days</div>
             <div className="chip">Med Gap: {fstats.medGap} days</div>
             <div className="chip">Consistency CV: {fstats.cv?.toFixed(2)}</div>
           </div>
         </div>
         <div className="card">
           <div className="h2">TRAINING SCIENCE</div>
           <div className="wRow"><span>ACWR:</span> <span style={{color: fstats.acwr > 1.3 ? 'var(--bad)' : 'var(--good)'}}>{fstats.acwr?.toFixed(2)}</span></div>
           <div className="wRow"><span>Acute Load:</span> <span>{fstats.acute}</span></div>
           <div className="wRow"><span>Chronic Load:</span> <span>{fstats.chronic}</span></div>
         </div>
       </div>

       <div className="card" style={{ marginBottom: 20 }}>
         <div className="h2">REP-RANGE DISTRIBUTION</div>
         <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
           <div style={{ height: 200, flex: 1 }}>
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={[
                     { name: 'Strength (1-5)', value: fstats.rep?.strength || 0 },
                     { name: 'Hypertrophy (6-12)', value: fstats.rep?.hyper || 0 },
                     { name: 'Endurance (13+)', value: fstats.rep?.endu || 0 },
                   ]}
                   dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={2}
                 >
                   <Cell fill="var(--bad)" />
                   <Cell fill="var(--accent)" />
                   <Cell fill="var(--info)" />
                 </Pie>
                 <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10 }} />
               </PieChart>
             </ResponsiveContainer>
           </div>
           <div style={{ flex: 1, fontSize: 12, color: 'var(--text2)' }}>
             <div className="wRow"><span style={{color:'var(--bad)'}}>Strength (1-5)</span><span>{fstats.rep?.strength || 0} sets</span></div>
             <div className="wRow"><span style={{color:'var(--accent)'}}>Hypertrophy (6-12)</span><span>{fstats.rep?.hyper || 0} sets</span></div>
             <div className="wRow"><span style={{color:'var(--info)'}}>Endurance (13+)</span><span>{fstats.rep?.endu || 0} sets</span></div>
             <div style={{marginTop: 10, color: 'var(--mut)'}}>{fstats.rep?.total || 0} total working sets classified by rep range.</div>
           </div>
         </div>
       </div>

       <div className="card" style={{ marginBottom: 20 }}>
         <div className="h2">BODY MAP — VOLUME HEATMAP</div>
         <div style={{ marginTop: 15 }}>
           <BodyMap muscleGroups={muscleGroups} />
         </div>
       </div>

       <div className="grid2" style={{ marginBottom: 20 }}>
         <div className="card">
           <div className="h2">MUSCLE BALANCE</div>
           <div style={{ height: 250 }}>
             <ResponsiveContainer width="100%" height="100%">
               <RadarChart data={radarData}>
                 <PolarGrid stroke="var(--border2)" />
                 <PolarAngleAxis dataKey="subject" tick={{fill:'var(--mut)', fontSize:10, fontFamily:'IBM Plex Mono'}} />
                 <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} />
                 <Radar name="Sets" dataKey="A" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.4} />
                 <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10 }} />
               </RadarChart>
             </ResponsiveContainer>
           </div>
         </div>

         <div className="card">
           <div className="h2">SPLIT DISTRIBUTION</div>
           <div style={{ height: 250 }}>
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                   {pieData.map((e, i) => (
                     <Cell key={`cell-${i}`} fill={SPLIT_COLORS[e.name] || CHART_COLORS[i % CHART_COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10 }} />
               </PieChart>
             </ResponsiveContainer>
           </div>
         </div>
       </div>

       <div className="card" style={{ marginBottom: 20 }}>
         <div className="h2">VOLUME BY MUSCLE</div>
         <div style={{ height: 300 }}>
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={volByMuscle} layout="vertical" margin={{ left: 40 }}>
                 <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" horizontal={false} />
                 <XAxis type="number" tick={{fill:'var(--mut)', fontSize:10}} />
                 <YAxis dataKey="name" type="category" tick={{fill:'var(--mut)', fontSize:10}} />
                 <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10 }} />
                 <Bar dataKey="vol" fill="var(--pink)" radius={[0,4,4,0]} />
               </BarChart>
             </ResponsiveContainer>
         </div>
       </div>

       <div className="card" style={{ marginBottom: 20 }}>
         <div className="h2">WEEKLY TONNAGE</div>
         <div style={{ height: 200 }}>
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={weeklyBarData}>
                 <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" vertical={false} />
                 <XAxis dataKey="name" tick={{fill:'var(--mut)', fontSize:10}} />
                 <YAxis tick={{fill:'var(--mut)', fontSize:10}} />
                 <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10 }} />
                 <Bar dataKey="vol" fill="var(--info)" radius={[4,4,0,0]} />
               </BarChart>
             </ResponsiveContainer>
         </div>
       </div>

       <div className="card" style={{ marginBottom: 20 }}>
         <div className="h2">LOAD RAMP RATE (% ∆)</div>
         <div style={{ height: 200 }}>
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={rampRateData}>
                 <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" vertical={false} />
                 <XAxis dataKey="name" tick={{fill:'var(--mut)', fontSize:10}} />
                 <YAxis tick={{fill:'var(--mut)', fontSize:10}} />
                 <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10 }} />
                 <Area type="monotone" dataKey="change" stroke="var(--warn)" fill="var(--warnBg)" />
               </AreaChart>
             </ResponsiveContainer>
         </div>
       </div>

       <div className="card" style={{ marginBottom: 20 }}>
         <div className="h2">VOLUME PERIODIZATION</div>
         <div style={{ height: 300 }}>
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={periodizationData}>
                 <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" vertical={false} />
                 <XAxis dataKey="name" tick={{fill:'var(--mut)', fontSize:10}} />
                 <YAxis tick={{fill:'var(--mut)', fontSize:10}} />
                 <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10 }} />
                 {Object.keys(periodizationData[0] || {}).filter(k => k !== 'name').map((k, i) => (
                    <Bar key={k} dataKey={k} stackId="a" fill={CHART_COLORS[i % CHART_COLORS.length]} />
                 ))}
               </BarChart>
             </ResponsiveContainer>
         </div>
       </div>

       <div className="card" style={{ marginBottom: 20 }}>
         <div className="h2">SET EFFICIENCY (Sets vs Volume)</div>
         <div style={{ height: 250 }}>
             <ResponsiveContainer width="100%" height="100%">
               <ScatterChart>
                 <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" />
                 <XAxis type="number" dataKey="sets" name="Sets" tick={{fill:'var(--mut)', fontSize:10}} />
                 <YAxis type="number" dataKey="vol" name="Volume (kg)" tick={{fill:'var(--mut)', fontSize:10}} />
                 <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10 }} />
                 <Scatter name="Sessions" data={efficiencyData} fill="var(--accent)" />
               </ScatterChart>
             </ResponsiveContainer>
         </div>
       </div>

       <div className="card" style={{ marginBottom: 20 }}>
         <div className="h2">MUSCLE GROUP BREAKDOWN (TREEMAP)</div>
         <div style={{ height: 300 }}>
             <ResponsiveContainer width="100%" height="100%">
               <Treemap
                 data={treeMapData}
                 dataKey="size"
                 aspectRatio={4 / 3}
                 stroke="#fff"
                 fill="var(--accent)"
               >
                 <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10 }} />
               </Treemap>
             </ResponsiveContainer>
         </div>
       </div>

       <div className="card" style={{ marginBottom: 20 }}>
         <div className="h2">TRAINING CALENDAR (LAST 28 DAYS)</div>
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <div key={d} style={{fontSize:10, color:'var(--mut)', textAlign:'center'}}>{d}</div>)}
            {calDays.map((c, i) => (
              <div key={i} style={{
                height: 40,
                backgroundColor: c.sess ? (SPLIT_COLORS[c.sess.split] || 'var(--accent)') : 'var(--card2)',
                borderRadius: 4,
                opacity: c.sess ? 0.8 : 0.3,
                border: '1px solid var(--border2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10
              }}>
                {c.sess ? c.sess.split?.substring(0,1) : ''}
              </div>
            ))}
         </div>
       </div>

       <div className="grid2" style={{ marginBottom: 20 }}>
         <div className="card">
           <div className="h2">STRENGTH CURVES (TOP 3)</div>
           <div style={{ height: 200 }}>
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={progression.slice(0, 3)}>
                 <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" vertical={false} />
                 <XAxis dataKey="name" tick={{fill:'var(--mut)', fontSize:10}} />
                 <YAxis tick={{fill:'var(--mut)', fontSize:10}} />
                 <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10 }} />
                 <Line type="monotone" dataKey="best" stroke="var(--good)" strokeWidth={2} dot={{r:3}} />
               </LineChart>
             </ResponsiveContainer>
           </div>
         </div>

         <div className="card">
           <div className="h2">REGRESSION WATCHLIST</div>
           <div style={{ height: 200 }}>
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={regWatch}>
                 <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" vertical={false} />
                 <XAxis dataKey="name" tick={{fill:'var(--mut)', fontSize:10}} />
                 <YAxis tick={{fill:'var(--mut)', fontSize:10}} />
                 <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10 }} />
                 <Line type="monotone" dataKey="pct" stroke="var(--bad)" strokeWidth={2} dot={{r:3}} />
               </LineChart>
             </ResponsiveContainer>
           </div>
         </div>
       </div>

       <div className="card" style={{ marginBottom: 20 }}>
         <div className="h2">STRENGTH PROGRESSION</div>
         <div style={{overflowX: 'auto'}}>
            <table style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse'}}>
               <thead>
                  <tr style={{borderBottom: '1px solid var(--border2)'}}>
                     <th style={{padding: '8px 0', fontSize: 12, color:'var(--mut)'}}>Exercise</th>
                     <th style={{padding: '8px 0', fontSize: 12, color:'var(--mut)'}}>Best</th>
                     <th style={{padding: '8px 0', fontSize: 12, color:'var(--mut)'}}>Sessions</th>
                     <th style={{padding: '8px 0', fontSize: 12, color:'var(--mut)'}}>Δ (change)</th>
                  </tr>
               </thead>
               <tbody>
                  {progression.map(p => (
                     <tr key={p.name} style={{borderBottom: '1px solid var(--border2)'}}>
                        <td style={{padding: '8px 0', fontSize: 13}}>{p.name}</td>
                        <td style={{padding: '8px 0', fontSize: 13}}>{fmtKg(p.best)}</td>
                        <td style={{padding: '8px 0', fontSize: 13}}>{p.sessions}</td>
                        <td style={{padding: '8px 0', fontSize: 13, color: p.delta >= 0 ? 'var(--good)' : 'var(--bad)'}}>{p.delta > 0 ? '+' : ''}{p.delta} ({p.pct}%)</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
       </div>

       <div className="card" style={{ marginBottom: 20 }}>
         <div className="h2">PERSONAL RECORDS</div>
         <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {prs.map((p, i) => (
               <div key={i} className="chip" style={{backgroundColor: 'var(--infoBg)', color: 'var(--info)', border: '1px solid var(--infoBd)'}}>
                  {p.name} - {p.weight}kg x {p.reps}
               </div>
            ))}
         </div>
       </div>

       <div className="brief" style={{ marginBottom: 20 }}>
         <div className="h2" style={{color:'var(--accent)'}}>COMEBACK PRESCRIPTION</div>
         <div style={{color:'var(--text2)', fontSize:13}}>
            Based on recent regressions and skipped muscle groups, prioritize:
            <ul style={{marginTop: 5, paddingLeft: 20}}>
               {regWatch.slice(0, 2).map(r => <li key={r.name}>{r.name} (Recovery Focus)</li>)}
               {junkVol.slice(0, 1).map(j => <li key={j.name}>Reduce volume on {j.name}</li>)}
            </ul>
         </div>
       </div>

       <div className="card">
         <div className="h2" style={{display:'flex', justifyContent:'space-between'}}>
            <span>SESSIONS</span>
            <div style={{display:'flex', gap: 5}}>
               {['All', 'Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body'].map(s => (
                  <button 
                     key={s} 
                     style={{
                        background: splitFilter === s ? 'var(--accentT)' : 'var(--card2)',
                        border: '1px solid var(--border2)',
                        color: splitFilter === s ? 'var(--accent)' : 'var(--mut)',
                        padding: '2px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 10
                     }}
                     onClick={() => { setSplitFilter(s); showToast('Filtered splits'); }}
                  >
                     {s}
                  </button>
               ))}
            </div>
         </div>
         <div>
            {filteredSessions.map(s => (
               <div key={s.date + s.name} className="sessCard" style={{ marginBottom: 10, padding: 10, border: '1px solid var(--border2)', borderRadius: 8, background: 'var(--card2)' }}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom: 5}}>
                     <strong style={{color: SPLIT_COLORS[s.split] || 'var(--accent)'}}>{s.name}</strong>
                     <span style={{fontSize: 12, color: 'var(--mut)'}}>{short(s.date)}</span>
                  </div>
                  <div className="wRow" style={{fontSize: 12, color: 'var(--text2)'}}>
                     <span>Vol: {fmtKg(s.vol)}</span>
                     <span>Sets: {s.sets}</span>
                     <span>Dur: {s.mins}m</span>
                  </div>
               </div>
            ))}
         </div>
       </div>
    </div>
  );
}
