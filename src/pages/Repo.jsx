import React from 'react';
import { BarChart, Bar, Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';

const ttStyle = { background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10, color: 'var(--text)' };
const tkStyle = { fill: 'var(--mut)', fontFamily: 'IBM Plex Mono', fontSize: 10 };

export default function Repo({ data }) {
  const repo = data.repo_activity || {};
  const heatmap = repo.commit_heatmap || { days: [], total_commits: 0, commits_by_repo: {}, active_days: 0 };
  const recentFiles = repo.recent_files || [];
  const folderActivity = repo.folder_activity || [];
  const folderSizes = repo.folder_sizes || [];

  const commitsByRepo = Object.entries(heatmap.commits_by_repo || {}).map(([name, count]) => ({ name, count }));
  const last14 = heatmap.days.slice(-14);
  const maxDaily = Math.max(1, ...heatmap.days.map(d => d.commits));

  const timeAgo = (iso) => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.round(diffMs / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.round(hours / 24)}d ago`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="g4">
        <div className="statCard">
          <div className="statLbl">COMMITS (90D)</div>
          <div className="statVal">{heatmap.total_commits}</div>
          <div className="statSub">across {commitsByRepo.length} repos</div>
        </div>
        <div className="statCard">
          <div className="statLbl">ACTIVE DAYS</div>
          <div className="statVal">{heatmap.active_days}</div>
          <div className="statSub">of last 90</div>
        </div>
        <div className="statCard">
          <div className="statLbl">FILES CHANGED</div>
          <div className="statVal">{recentFiles.length}</div>
          <div className="statSub">last 14 days</div>
        </div>
        <div className="statCard">
          <div className="statLbl">GENERATED</div>
          <div className="statVal" style={{ fontSize: 14 }}>{repo.generated_at ? timeAgo(repo.generated_at) : 'N/A'}</div>
          <div className="statSub">local snapshot</div>
        </div>
      </div>

      <div className="card">
        <div className="h2">COMMIT ACTIVITY — LAST 14 DAYS</div>
        <div style={{ display: 'flex', gap: 4, marginTop: 15, alignItems: 'flex-end', height: 80 }}>
          {last14.map((d, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }} title={`${d.date}: ${d.commits} commits`}>
              <div style={{
                height: Math.max(4, (d.commits / maxDaily) * 60),
                background: d.commits ? 'var(--accent)' : 'var(--card2)',
                borderRadius: 2,
                marginBottom: 6,
              }} />
              <div className="mono" style={{ fontSize: 9, color: 'var(--mut)' }}>{d.date.slice(5)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <div className="h2">COMMITS BY REPO (90D)</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={commitsByRepo} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" horizontal={false} />
                <XAxis type="number" tick={tkStyle} />
                <YAxis dataKey="name" type="category" width={110} tick={tkStyle} />
                <Tooltip contentStyle={ttStyle} />
                <Bar dataKey="count" fill="var(--accent)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="h2">WHERE THE ACTIVITY IS (14D)</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={folderActivity} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" horizontal={false} />
                <XAxis type="number" tick={tkStyle} />
                <YAxis dataKey="name" type="category" width={110} tick={tkStyle} />
                <Tooltip contentStyle={ttStyle} />
                <Bar dataKey="count" fill="var(--good)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="h2">RECENTLY CHANGED FILES</div>
        <div style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
          {recentFiles.map((f, i) => (
            <div key={i} className="taskRow" style={{ padding: 8, background: 'var(--card2)', borderRadius: 4 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="mono" style={{ fontSize: 12, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.path}</div>
              </div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--mut)', flexShrink: 0 }}>{timeAgo(f.mtime)}</div>
            </div>
          ))}
          {!recentFiles.length && <div style={{ color: 'var(--mut)', fontSize: 12 }}>No recent file changes tracked.</div>}
        </div>
      </div>

      <div className="card">
        <div className="h2">PROJECT FOOTPRINT</div>
        <div style={{ maxHeight: 300, overflowY: 'auto', marginTop: 10 }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border2)' }}>
                <th style={{ padding: '8px 0', fontSize: 12, color: 'var(--mut)' }}>Folder</th>
                <th style={{ padding: '8px 0', fontSize: 12, color: 'var(--mut)' }}>Files</th>
                <th style={{ padding: '8px 0', fontSize: 12, color: 'var(--mut)' }}>Size (MB)</th>
              </tr>
            </thead>
            <tbody>
              {folderSizes.map((f, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border2)' }}>
                  <td style={{ padding: '8px 0', fontSize: 13 }}>{f.name}</td>
                  <td style={{ padding: '8px 0', fontSize: 13 }}>{f.files.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '8px 0', fontSize: 13 }}>{f.mb}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
