export const fmtInt = (n) => Math.round(n).toLocaleString('en-IN');
export const fmtKg = (n) => fmtInt(n) + ' kg';
export const pct = (n, d) => d ? Math.round(n / d * 100) : 0;
export const daysBetween = (a, b) => Math.round((b - a) / 86400000);

export const short = (d) => {
  const dt = new Date(d);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const DOMAIN_COLORS = {
  fitness: '#34d399',
  intel: '#38bdf8',
  memory: '#5b63f0',
  knowledge: '#e879b9',
  music: '#fbbf24',
};

export const SPLIT_COLORS = {
  Legs: '#38bdf8',
  Baaaack: '#5b63f0',
  Arms: '#e879b9',
  'Shoulder baby': '#fbbf24',
  Chestom: '#f87181',
  'Pull A': '#34d399',
  'Push A': '#8b5cf6',
};

export const CHART_COLORS = ['#5b63f0', '#34d399', '#e879b9', '#38bdf8', '#fbbf24', '#f87181', '#8b5cf6', '#9aa1b5', '#c2410c'];

export const TODAY = new Date();

export function computeHealth(data) {
  if (!data) return { score: 0, activeStreams: 0, totalStreams: 4, streamActivity: 0, taskThroughput: 0, backlogRatio: 0, recency: 0, backlog: 0, daysSince: 999 };
  const streams = data.activity.streams;
  const streamScores = streams.map(s => {
    const last4 = s.dates.slice(-4);
    return last4.filter(v => v > 0).length / 4;
  });
  const streamActivity = streamScores.reduce((a, b) => a + b, 0) / streamScores.length;
  const backlog = Object.values(data.feed.news_feed?.ingest_backlog || {}).reduce((a, b) => a + b, 0);
  const backlogRatio = Math.max(0, 1 - Math.min(1, backlog / 150));
  const memEvents = data.feed.items.filter(i => i.domain === 'memory').sort((a, b) => new Date(b.date) - new Date(a.date));
  const daysSince = memEvents.length ? daysBetween(new Date(memEvents[0].date), TODAY) : 999;
  const recency = Math.max(0, 1 - Math.min(1, daysSince / 14));
  const score = Math.round(streamActivity * 40 + 0 * 30 + backlogRatio * 20 + recency * 10);
  const activeStreams = streamScores.filter(s => s > 0).length;
  return { score, activeStreams, totalStreams: streams.length, streamActivity, backlogRatio, recency, backlog, daysSince };
}

export function healthLabel(score) {
  if (score < 40) return { label: 'stalled', color: 'var(--bad)' };
  if (score <= 65) return { label: 'capture-rich, execution-poor', color: 'var(--warn)' };
  return { label: 'compounding', color: 'var(--good)' };
}
