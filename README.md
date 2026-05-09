# Plant Tracker — Support Analytics Dashboard

> **What you're looking at.** The Plant Tracker app and its 14 Help Center articles are real. The tickets and search logs in this dashboard are **modeled** — Plant Tracker has no real support org. The modeling choices are documented openly in [`methodology.md`](./methodology.md) and [`analytics-seed/synthetic-data-notes.md`](./analytics-seed/synthetic-data-notes.md). The synthetic-data caveat is treated as a feature: the writeup talks about which assumptions were baked into the model, which is itself an analytical demonstration.

This is the third artifact in a three-part portfolio piece exploring the full content lifecycle a knowledge-management specialist owns:

1. **[Plant Tracker](https://github.com/the-vfp/plant-tracker)** — the real app, in sustained personal use
2. **[Plant Tracker Help Center](https://github.com/the-vfp/plant-tracker-help-center)** — 14 published Quartz articles, the real article corpus
3. **Plant Tracker Support Analytics** *(this repo)* — a deployable dashboard that visualizes a fictional support org's behavior against the real KB, plus a methodology writeup explaining what a KM specialist asks of this kind of data and what actions follow

The dashboard demonstrates the tool. The writeup demonstrates the thinking.

## What it shows

Four analytical views, each answering a specific KM question:

- **Health snapshot** — overall context. KB size, ticket volume, modeled deflection rate, seasonal pattern, top-viewed articles.
- **Content gaps** — zero-result searches, ticket topics with no matching article, the headline diagnostic-vocabulary cluster.
- **Article performance** — view-to-deflection ratio per article. The crucial signal: high views but low deflection means people are reading the article and still filing tickets.
- **Vocabulary & findability** — what users actually type, where the KB's vocabulary diverges from theirs.

Each view ends with a *what this means for the KB* callout — the reading of the chart, not just the chart.

## The data

The dashboard reads from `analytics-seed/`, a self-contained TypeScript project that generates three JSON files via a seeded PRNG:

- `articles.json` — the 14 real articles with synthetic view counts and weak-article flags
- `searches.json` — ~2,400 modeled searches over a 9-month window
- `tickets.json` — ~240 modeled tickets over the same window

Same seed → byte-for-byte identical output. To regenerate:

```bash
cd analytics-seed
npm install
npm run seed
```

See [`analytics-seed/signal-design.md`](./analytics-seed/signal-design.md) for the editorial intent (written *before* generation) and [`analytics-seed/synthetic-data-notes.md`](./analytics-seed/synthetic-data-notes.md) for the documented reality after.

## Run it locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). The dashboard imports the JSON files in `analytics-seed/` directly — no build step is required between the seed and the dashboard.

## Deploy

Vite + static JSON. Vercel auto-detects: connect the repo and it ships. `npm run build` produces a `dist/` directory that any static host will serve.

## Methodology writeup

[`methodology.md`](./methodology.md) is the standalone writeup. It covers what KM analytics should answer, why these four views, what the data shows, what actions would follow, and what's real vs. modeled. Read it on its own to evaluate the thinking; read the dashboard to see the thinking applied.

## Stack

- Vite + React + TypeScript (matches the Plant Tracker app stack so the portfolio reads as a coherent body of work)
- Recharts for charts
- No database, no auth, no backend — JSON committed to the repo
- Cream and sage visual language, treated as a sibling of the Help Center

## Repo cross-links

- App: [`the-vfp/plant-tracker`](https://github.com/the-vfp/plant-tracker)
- Help Center (Quartz): [`the-vfp/plant-tracker-help-center`](https://github.com/the-vfp/plant-tracker-help-center)
- Analytics dashboard: this repo

---

Built by [Ellene](https://github.com/the-vfp) as a portfolio exercise. Feedback welcome via issues.
