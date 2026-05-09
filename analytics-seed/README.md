# Plant Tracker Support Analytics — synthetic data seed

Reproducible synthetic data generator for the Plant Tracker Support Analytics dashboard. Generates a 9-month window of fictional ticket and search data against the real 14-article Help Center corpus.

## What's in this folder

| File | Purpose |
|---|---|
| `seed.ts` | The generator. Reads no external data; outputs three JSON files. |
| `package.json`, `tsconfig.json` | Minimal Node + TS setup so this folder is self-contained. |
| `articles.json` | The 14 Help Center articles with synthetic view counts and weak-article flags. |
| `searches.json` | ~2,400 synthetic searches over 9 months. |
| `tickets.json` | ~240 synthetic tickets over 9 months. |
| [`signal-design.md`](./signal-design.md) | Editorial intent — what analytical signals the data is designed to surface, written before generation. |
| [`synthetic-data-notes.md`](./synthetic-data-notes.md) | Documented reality after generation — actual numbers, headline finding, honest caveats. The methodology writeup cites this directly. |

## Regenerating the data

```bash
npm install
npm run seed
```

PRNG seed is fixed at `42` in `seed.ts`. Same seed → byte-for-byte identical output, so the dashboard's regression suite (when it exists) can pin the data.

To produce a different sample, change `SEED` near the top of `seed.ts` and re-run.

## Reading order

1. [`signal-design.md`](./signal-design.md) — why this data exists, what stories it tells
2. [`synthetic-data-notes.md`](./synthetic-data-notes.md) — what the actual generated numbers are
3. `seed.ts` — the implementation
4. The three JSONs — the output the dashboard consumes
