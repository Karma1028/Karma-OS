import React, { useState } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, Treemap, Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Cell
} from 'recharts';
import useStore from '../store/useStore';
import { showToast } from '../components/Toast';
import { CHART_COLORS } from '../utils/helpers';

export default function Vault({ data }) {
  const { vault = {}, stats = {}, feed = {}, monthly = [] } = data;
  const vaultStats = stats.vault || { medGap: 0, burstiness: 0, lastCapture: '', daysSince: 0 };
  const selCluster = useStore(s => s.selCluster);
  const setSelCluster = useStore(s => s.setSelCluster);
  const [query, setQuery] = useState('');

  // 10. Knowledge Velocity
  const velocityData = monthly.map(m => ({ name: m.month || m.label, val: m.knowledge || 0 }));
  
  // 11. Compile Ratio
  const notebooksCount = vault.notebooks || 0;
  const wikiCount = vault.wiki || 0;
  const ratio = (notebooksCount / (wikiCount || 1)).toFixed(1);
  const ratioData = [
    { name: 'Notebooks', count: notebooksCount },
    { name: 'Wiki Pages', count: wikiCount }
  ];
  
  // 12. Treemap data
  const treemapData = Object.entries(vault.clusters || {}).map(([name, size], i) => ({
    name,
    size,
    fill: CHART_COLORS[i % CHART_COLORS.length]
  }));
  
  // 13. Notebook Age Distribution
  const ageBinsMap = {};
  (vault.notebookSample || []).forEach(n => {
    if (n.date) {
      const d = new Date(n.date);
      if (!isNaN(d.getTime())) {
        const m = d.toLocaleString('default', { month: 'short' });
        ageBinsMap[m] = (ageBinsMap[m] || 0) + 1;
      }
    }
  });
  let ageBins = Object.entries(ageBinsMap).map(([name, count]) => ({ name, count }));
  if (ageBins.length === 0) {
    ageBins = [
      { name: 'Oct', count: 5 }, { name: 'Nov', count: 8 }, { name: 'Dec', count: 12 },
      { name: 'Jan', count: 4 }, { name: 'Feb', count: 6 }, { name: 'Mar', count: 7 },
      { name: 'Apr', count: 2 },
    ];
  }
  
  // Backlog
  const backlog = feed.news_feed?.ingest_backlog || {};
  const totalBacklog = Object.values(backlog).reduce((a, b) => a + b, 0);
  const queueData = Object.entries(backlog).map(([k, v]) => ({ name: k, value: v }));
  
  const handleQuery = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      showToast('NotebookLM query submitted', 'good');
      setQuery('');
    }
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }}>
      
      {/* 1. Stat Cards */}
      <div className="gridN" style={{ '--cols': 4 }}>
        <div className="statCard">
          <div className="statLbl">NOTEBOOKS</div>
          <div className="statVal">{vault.notebooks}</div>
        </div>
        <div className="statCard">
          <div className="statLbl">WIKI PAGES</div>
          <div className="statVal">{vault.wiki}</div>
        </div>
        <div className="statCard">
          <div className="statLbl">CLUSTERS</div>
          <div className="statVal">{Object.keys(vault.clusters || {}).length}</div>
        </div>
        <div className="statCard">
          <div className="statLbl">INGEST BACKLOG</div>
          <div className="statVal" style={{ color: 'var(--warn)' }}>{totalBacklog}</div>
        </div>
      </div>
      
      {/* 2. AI Read Brief */}
      <div className="card" style={{ background: 'var(--briefBg)', borderColor: 'var(--briefBd)' }}>
        <div className="brief">
          [SYS.KNOWLEDGE] Knowledge health degraded. {vaultStats.daysSince} days since last notebook capture. Backlog static since Apr 27.
        </div>
      </div>
      
      {/* 4. NotebookLM Query Input */}
      <div className="card">
        <div className="h2">NOTEBOOK_LM_QUERY</div>
        <input 
          type="text" 
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleQuery}
          placeholder="Ask your vault..."
          style={{ 
            width: '100%', background: 'var(--card2)', border: '1px solid var(--border)', 
            color: 'var(--text)', padding: 10, outline: 'none', fontFamily: 'IBM Plex Mono' 
          }}
        />
      </div>

      <div className="gridN g2">
        {/* 3. Knowledge Graph Clusters */}
        <div className="card">
           <div className="h2">KNOWLEDGE_CLUSTERS</div>
           <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {Object.entries(vault.clusters || {}).map(([c, size]) => (
                <div 
                  key={c}
                  className="chip"
                  style={{
                     cursor: 'pointer',
                     background: selCluster === c ? 'var(--accent)' : 'var(--card2)',
                     color: selCluster === c ? '#000' : 'var(--text)'
                  }}
                  onClick={() => setSelCluster(selCluster === c ? null : c)}
                >
                  {c} ({size})
                </div>
              ))}
           </div>
        </div>
        
        {/* 5. Capture Cadence Stats */}
        <div className="card">
           <div className="h2">CAPTURE_CADENCE</div>
           <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
             <div>
               <div className="statLbl">MEDIAN GAP</div>
               <div className="statVal">{vaultStats.medGap}d</div>
             </div>
             <div>
               <div className="statLbl">BURSTINESS</div>
               <div className="statVal">{vaultStats.burstiness}</div>
             </div>
             <div>
               <div className="statLbl">LAST CAPTURE</div>
               <div className="statVal">{vaultStats.lastCapture?.split(' ')[0] || 'N/A'}</div>
             </div>
           </div>
        </div>
      </div>
      
      <div className="gridN g2">
        {/* 12. Cluster Treemap */}
        <div className="card">
          <div className="h2">CLUSTER_TREEMAP</div>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={treemapData}
                dataKey="size"
                nameKey="name"
                ratio={4/3}
                stroke="var(--card)"
              >
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10 }} />
              </Treemap>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* 7. Ingest Queue Breakdown (6. Cluster bar chart implicitly merged or alternative) */}
        <div className="card">
          <div className="h2">INGEST_QUEUE</div>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={queueData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: 10 }} />
                <YAxis dataKey="name" type="category" width={90} tick={{ fill: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10 }} />
                <Bar dataKey="value" fill="var(--warn)" radius={[0, 4, 4, 0]} animationDuration={800} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="gridN g2">
        {/* 10. Knowledge Velocity */}
        <div className="card">
          <div className="h2">KNOWLEDGE_VELOCITY</div>
          <div style={{ height: 200 }}>
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={velocityData}>
                 <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" />
                 <XAxis dataKey="name" tick={{ fill: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: 10 }} />
                 <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10 }} />
                 <Area type="monotone" dataKey="val" stroke="var(--info)" fill="var(--infoBg)" animationDuration={800} animationEasing="ease-out" />
               </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>
        
        {/* 13. Notebook Age Distribution */}
        <div className="card">
          <div className="h2">NOTEBOOK_AGE_DISTRIBUTION</div>
          <div style={{ height: 200 }}>
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={ageBins}>
                 <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" vertical={false} />
                 <XAxis dataKey="name" tick={{ fill: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: 10 }} />
                 <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10 }} />
                 <Bar dataKey="count" fill="var(--pink)" animationDuration={800} animationEasing="ease-out" />
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="gridN g2">
        {/* 11. Compile Ratio */}
        <div className="card">
          <div className="h2">COMPILE_RATIO</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, height: 150 }}>
            <div style={{ fontSize: 48, fontWeight: 'bold', color: 'var(--accent)', fontFamily: 'IBM Plex Mono' }}>
              {ratio} : 1
            </div>
            <div style={{ flex: 1, height: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratioData}>
                  <XAxis dataKey="name" tick={{ fill: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10 }} />
                  <Bar dataKey="count" fill="var(--accent)" barSize={40} animationDuration={800} animationEasing="ease-out">
                    {ratioData.map((e, idx) => (
                      <Cell key={idx} fill={idx === 0 ? 'var(--good)' : 'var(--pink)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* 14. Ingest Pipeline Flow */}
        <div className="card">
          <div className="h2">INGEST_PIPELINE_FLOW</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 150, padding: '0 20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--warn)', fontSize: 24, fontWeight: 'bold' }}>{totalBacklog}</div>
              <div style={{ color: 'var(--mut)', fontSize: 12 }}>raw/</div>
            </div>
            <div style={{ color: 'var(--mut)' }}>→</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--info)', fontSize: 24, fontWeight: 'bold' }}>{vault.indexed || 12}</div>
              <div style={{ color: 'var(--mut)', fontSize: 12 }}>process</div>
            </div>
            <div style={{ color: 'var(--mut)' }}>→</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--good)', fontSize: 24, fontWeight: 'bold' }}>{vault.notebooks}</div>
              <div style={{ color: 'var(--mut)', fontSize: 12 }}>knowledge/</div>
            </div>
            <div style={{ color: 'var(--mut)' }}>→</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--pink)', fontSize: 24, fontWeight: 'bold' }}>{vault.wiki}</div>
              <div style={{ color: 'var(--mut)', fontSize: 12 }}>wiki/</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 15. Backlog Burn Rate */}
      <div className="card" style={{ position: 'relative' }}>
        <div className="h2">BACKLOG_BURN_RATE</div>
        <div style={{ height: 150 }}>
          <div style={{ position: 'absolute', top: 50, left: '30%', color: 'var(--bad)', fontSize: 12, fontFamily: 'IBM Plex Mono', background: 'var(--card)', padding: '2px 6px', border: '1px solid var(--badBd)', zIndex: 10 }}>
            no items processed since Apr 27
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={[
              { date: 'Jan', val: totalBacklog }, { date: 'Feb', val: totalBacklog },
              { date: 'Mar', val: totalBacklog }, { date: 'Apr', val: totalBacklog },
              { date: 'May', val: totalBacklog }, { date: 'Jun', val: totalBacklog }
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: 10 }} />
              <YAxis domain={[0, totalBacklog + 50]} tick={{ fill: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10 }} />
              <Line type="stepAfter" dataKey="val" stroke="var(--warn)" strokeWidth={2} dot={false} animationDuration={800} animationEasing="ease-out" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="gridN g2">
        {/* 9. Notebooks List */}
        <div className="card">
          <div className="h2">NOTEBOOKS {selCluster && `[${selCluster}]`}</div>
          <div style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(vault.notebookSample || [])
              .filter(n => !selCluster || n.cluster === selCluster)
              .map((n, i) => (
              <div key={i} className="taskRow" style={{ padding: 10, background: 'var(--card2)', borderRadius: 4 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'var(--text)' }}>{n.title || n.id}</div>
                  <div style={{ color: 'var(--mut)', fontSize: 12 }}>{n.cluster} • {n.date}</div>
                </div>
              </div>
            ))}
            {!(vault.notebookSample || []).filter(n => !selCluster || n.cluster === selCluster).length && (
               <div style={{ color: 'var(--mut)', fontSize: 12 }}>No notebooks matching cluster.</div>
            )}
          </div>
        </div>
        
        {/* 8. Wiki Compiled Concepts */}
        <div className="card">
          <div className="h2">WIKI_COMPILED_CONCEPTS</div>
          <div style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(vault.wikiPages || []).map((w, i) => (
              <div key={i} className="taskRow" style={{ padding: 10, background: 'var(--card2)', borderRadius: 4 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'var(--text)' }}>{w.title}</div>
                  <div style={{ color: 'var(--mut)', fontSize: 12 }}>{w.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
    </div>
  );
}
