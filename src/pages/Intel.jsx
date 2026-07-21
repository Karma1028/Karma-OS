import React from 'react';
import { AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import useStore from '../store/useStore';
import { DOMAIN_COLORS, CHART_COLORS, short } from '../utils/helpers';

export default function Intel({ data }) {
  const { feedFilter, setFeedFilter } = useStore();

  const items = data?.feed?.items || [];
  const backlog = data?.feed?.news_feed?.ingest_backlog || {};

  const byMonth = items.reduce((acc, item) => {
    const ym = item.date.substring(0, 7);
    if (!acc[ym]) acc[ym] = [];
    acc[ym].push(item);
    return acc;
  }, {});

  const months = Object.keys(byMonth).sort((a,b) => b.localeCompare(a));
  
  const densityData = months.map(m => ({ name: m, count: byMonth[m].length })).reverse();
  
  const domainCounts = items.reduce((acc, item) => {
    acc[item.domain] = (acc[item.domain] || 0) + 1;
    return acc;
  }, {});
  const domainData = Object.entries(domainCounts).map(([name, value]) => ({ name, value })).sort((a,b)=>b.value-a.value);

  const kindCounts = items.reduce((acc, item) => {
    acc[item.kind] = (acc[item.kind] || 0) + 1;
    return acc;
  }, {});
  const kindData = Object.entries(kindCounts).map(([name, value]) => ({ name, value })).sort((a,b)=>b.value-a.value);

  return (
    <div className="g4">
      <div className="brief card">
        <span className="aiTag">AI READ</span>
        signal health — 2% uptime, 0% persistence. ingestion pipeline mostly manual.
      </div>
      
      <div className="gridN" style={{ '--n': 3 }}>
        <div className="statCard">
          <div className="statLbl">Engine Uptime</div>
          <div className="statVal" style={{ color: 'var(--bad)' }}>2%</div>
          <div className="statSub">manual mode</div>
        </div>
        <div className="statCard">
          <div className="statLbl">Persistence Rate</div>
          <div className="statVal" style={{ color: 'var(--bad)' }}>0%</div>
          <div className="statSub">volatility high</div>
        </div>
        <div className="statCard">
          <div className="statLbl">Total Signals</div>
          <div className="statVal">{items.length}</div>
          <div className="statSub">lifetime</div>
        </div>
      </div>

      <div className="gridN" style={{ '--n': Math.max(5, Object.keys(domainCounts).length) }}>
        {Object.entries(domainCounts).map(([d, c]) => (
          <div key={d} className="statCard" style={{ borderColor: DOMAIN_COLORS[d] }}>
            <div className="statLbl">{d}</div>
            <div className="statVal">{c}</div>
          </div>
        ))}
      </div>

      <div className="card g2">
        <div className="h2">Pipeline Status</div>
        <div className="rowFlex" style={{ gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
           {['Source Capture', 'Strip/Clean', 'Ingest Queue', 'Knowledge Base', 'Wiki'].map((step, i, arr) => (
             <React.Fragment key={step}>
               <div style={{ padding: '8px 12px', background: 'var(--card2)', border: '1px solid var(--border2)', borderRadius: 6, fontSize: 12 }}>
                 {step}
               </div>
               {i < arr.length - 1 && <span style={{ color: 'var(--mut)' }}>→</span>}
             </React.Fragment>
           ))}
        </div>
      </div>

      <div className="gridN" style={{ '--n': 2 }}>
        <div className="card g2">
          <div className="h2">Event Density</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={densityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10 }} />
                <Area type="monotone" dataKey="count" stroke="var(--accent)" fill="var(--accentT)" animationDuration={800} animationEasing="ease-out" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card g2">
          <div className="h2">Domain Distribution</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={domainData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} animationDuration={800} animationEasing="ease-out">
                  {domainData.map((e, i) => <Cell key={i} fill={DOMAIN_COLORS[e.name] || CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="gridN" style={{ '--n': 2 }}>
        <div className="card g2">
          <div className="h2">Source Diversity</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kindData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10 }} cursor={{ fill: 'var(--card2)' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={800} animationEasing="ease-out">
                  {kindData.map((e, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card g2">
          <div className="h2">Ingest Backlog</div>
          <div className="g2">
            {Object.keys(backlog).length > 0 ? Object.entries(backlog).map(([k, v]) => (
              <div key={k} className="wRow">
                <span className="mono" style={{ textTransform: 'capitalize' }}>{k}</span>
                <span className="statVal">{v}</span>
              </div>
            )) : <div className="mut">No backlog.</div>}
          </div>
        </div>
      </div>

      <div className="card g2">
         <div className="h2">Recent vs Stale</div>
         <div style={{ width: '100%', height: 20, background: 'var(--card2)', borderRadius: 10, display: 'flex', overflow: 'hidden' }}>
            <div style={{ width: '30%', background: 'var(--bad)', opacity: 0.8 }} title="Stale period" />
            <div style={{ width: '15%', background: 'var(--good)', opacity: 0.8 }} title="Active period" />
            <div style={{ width: '40%', background: 'var(--bad)', opacity: 0.8 }} title="Stale period" />
            <div style={{ width: '15%', background: 'var(--good)', opacity: 0.8 }} title="Active period" />
         </div>
      </div>

      <div className="g3">
        <div className="rowFlex" style={{ gap: 8, flexWrap: 'wrap' }}>
          {['all', 'fitness', 'intel', 'memory', 'knowledge', 'music'].map(f => (
            <div
              key={f}
              className="chip"
              style={{
                borderColor: feedFilter === f ? (DOMAIN_COLORS[f] || 'var(--text)') : 'var(--border)',
                color: feedFilter === f ? (DOMAIN_COLORS[f] || 'var(--text)') : 'var(--mut)',
                cursor: 'pointer'
              }}
              onClick={() => setFeedFilter(f)}
            >
              {f.toUpperCase()}
            </div>
          ))}
        </div>

        <div className="g4">
          {months.map(m => {
            const mItems = byMonth[m].filter(i => feedFilter === 'all' || i.domain === feedFilter);
            if (mItems.length === 0) return null;
            return (
              <div key={m} className="g2">
                <div className="h2" style={{ color: 'var(--mut)' }}>{m}</div>
                <div className="g3" style={{ paddingLeft: 10, borderLeft: '1px solid var(--border)' }}>
                  {mItems.map((item, idx) => (
                    <div key={idx} className="g2">
                      <div className="rowFlex" style={{ gap: 10, alignItems: 'center' }}>
                        <span className="mono" style={{ fontSize: 12, color: 'var(--mut)' }}>{short(item.date)}</span>
                        <div className="chip" style={{ background: DOMAIN_COLORS[item.domain] || 'var(--card2)', color: '#000', border: 'none' }}>
                          {item.domain}
                        </div>
                        <div className="chip">{item.kind}</div>
                        <span style={{ fontWeight: 600 }}>{item.title}</span>
                      </div>
                      {item.detail && <div style={{ fontSize: 13, color: 'var(--mut)', paddingLeft: 85 }}>{item.detail}</div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
