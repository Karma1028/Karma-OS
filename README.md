# KARMA-OS Dashboard v2

> Tuhin Bhattacharya's personal AI operating system — web dashboard.

## Stack
- **Vite + React 18** — fast builds, tree-shaking
- **Recharts + D3** — industry-standard charts
- **Zustand** — lightweight state management with localStorage persistence
- **React Router v6** — real URL routing (`/fitness`, `/vault`, `/today`)
- **CSS custom properties** — exact design system from v1

## Pages
| Route | View | New in v2? |
|-------|------|-----------|
| `/` | Today | ✅ — live timeline, day score |
| `/overview` | Overview | Enhanced: compound score, cross-stream area |
| `/fitness` | Fitness | Enhanced: load ramp, periodization, muscle treemap |
| `/vault` | Vault | Enhanced: knowledge velocity, compile ratio, treemap |
| `/spotify` | Spotify | Enhanced: day×hour heatmap, session histogram |
| `/memory` | Memory | Enhanced: write heatmap, layer gauges, palace diagram |
| `/agents` | Agents | Enhanced: delegation graph, capability matrix |
| `/intel` | Intel | Enhanced: pipeline flow, domain distribution |
| `/tasks` | Tasks | Enhanced: burndown, priority matrix |
| `/analytics` | Analytics | ✅ — correlation matrix, scatter plots |

## Placeholders (TODO)
- [ ] **GitHub repo**: not yet created — push manually or create via `gh repo create`
- [ ] **Netlify site**: not yet wired — deploy via `netlify deploy` or Netlify UI
- [ ] **Google Drive sync**: planned, not yet implemented
- [ ] **Claude artifact sync**: planned, not yet implemented
- [ ] **Live Hevy API**: requires API key, proxy via Netlify Function
- [ ] **Live Spotify API**: requires OAuth, Extended Streaming History endpoint
- [ ] **today.json pipeline**: hourly composite from all sources, built by Hermes

## Running locally
```bash
cd karma-os-dashboard
npm install
npm run dev
```

## Deploying to Netlify
```bash
npm run build
npx netlify-cli deploy --prod --dir=dist
```

---
Built by Antigravity (Claude Code) · 2026-07-21
