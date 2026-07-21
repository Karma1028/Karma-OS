const fs = require('fs');
const path = require('path');

const htmlPath = 'D:\\antigravity project\\karma - zeroclaw\\obsidian-vault\\projects\\life\\dashboard\\karma-os-web-standalone.html';
const outDir = 'D:\\antigravity project\\karma - zeroclaw\\karma-os-dashboard\\public\\data';

const html = fs.readFileSync(htmlPath, 'utf8');

// Find start of const DATA = {
const startIndex = html.indexOf('const DATA = {');
if (startIndex === -1) {
  console.error('Could not find const DATA = {');
  process.exit(1);
}

// Find end of DATA object (ends with "};" before "/* ============================== STATE")
const endIndex = html.indexOf('\n};\n\n/* ============================== STATE', startIndex);
if (endIndex === -1) {
  console.error('Could not find end of DATA object');
  process.exit(1);
}

const dataCode = html.slice(startIndex, endIndex + 2); // includes const DATA = { ... };
const fnCode = dataCode + '\nreturn DATA;';

const DATA = new Function(fnCode)();

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. hevy.json — hevy_summary + hevy_analytics + hevy_audit + exercise_history
const hevy = {
  hevy_summary: DATA.hevy_summary,
  hevy_analytics: DATA.hevy_analytics,
  hevy_audit: DATA.hevy_audit,
  exercise_history: DATA.exercise_history
};
fs.writeFileSync(path.join(outDir, 'hevy.json'), JSON.stringify(hevy, null, 2));

// 2. spotify.json — spotify_summary + spotify_deep + artist_history
const spotify = {
  spotify_summary: DATA.spotify_summary,
  spotify_deep: DATA.spotify_deep,
  artist_history: DATA.artist_history
};
fs.writeFileSync(path.join(outDir, 'spotify.json'), JSON.stringify(spotify, null, 2));

// 3. vault.json — vault data
fs.writeFileSync(path.join(outDir, 'vault.json'), JSON.stringify(DATA.vault, null, 2));

// 4. stats.json — stats object (fitness, spotify, heat, vault, corr)
fs.writeFileSync(path.join(outDir, 'stats.json'), JSON.stringify(DATA.stats, null, 2));

// 5. feed.json — feed items + news_feed
const feed = {
  items: DATA.feed.items,
  news_feed: DATA.news_feed,
  feed: DATA.feed
};
fs.writeFileSync(path.join(outDir, 'feed.json'), JSON.stringify(feed, null, 2));

// 6. monthly.json — monthly array
fs.writeFileSync(path.join(outDir, 'monthly.json'), JSON.stringify(DATA.monthly, null, 2));

// 7. activity.json — activity streams data
fs.writeFileSync(path.join(outDir, 'activity.json'), JSON.stringify(DATA.activity, null, 2));

// 8. agents.json — agents array
fs.writeFileSync(path.join(outDir, 'agents.json'), JSON.stringify(DATA.agents, null, 2));

// 9. memory.json — memory object
fs.writeFileSync(path.join(outDir, 'memory.json'), JSON.stringify(DATA.memory, null, 2));

console.log('Successfully extracted 9 JSON files to:', outDir);
