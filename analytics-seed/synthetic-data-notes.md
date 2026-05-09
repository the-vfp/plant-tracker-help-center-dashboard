# Synthetic data notes

This is the canonical reference for what the synthetic data contains, what was modeled deliberately, and what the resulting numbers actually look like. The methodology writeup cites this doc directly. Read it alongside [`signal-design.md`](./signal-design.md), which captured the editorial intent before generation; this doc captures the documented reality after.

## Reproducibility

- **PRNG:** Mulberry32, seed `42`
- **Generator:** `seed.ts` in this folder. Run `npm install && npm run seed` to regenerate. Same seed → same output, byte-for-byte.
- **Window:** 2025-08-09 → 2026-05-09 (274 days, ~9 months ending today)

## What's real, what's modeled

| Element | Source |
|---|---|
| 14 article titles, slugs, categories | Real — pulled from the published Plant Tracker Help Center |
| Article last-updated dates | Modeled — synthesized to reflect the real authoring story (3 OG articles dated autumn 2025; 11 newer drafts dated spring 2026) |
| Article body word counts | Modeled — estimated from each article's actual length |
| Article view counts | Modeled — power-law distribution, weighted by category, hand-tuned for the entry-point articles |
| Tickets | Modeled |
| Searches | Modeled |
| The two articles flagged `is_weak: true` | Real editorial assessment — *Notes Overview* and *Watering Cadence Chart Overview* were honestly assessed as weakest in their current form, and the seed encodes that |

The synthetic-data caveat is a feature. It lets the writeup talk about what assumptions were baked in — itself an analytical demonstration.

## Volume summary

| | Generated | Target |
|---|---|---|
| Articles | 14 | 14 |
| Searches | 2,400 | ~2,400 |
| Tickets | 240 | ~240 |
| Searches that led to a ticket | 147 | ~120–160 |
| Tickets escalated to engineering | 34 (14.2%) | ~15% |

## The four deliberate signals — actual counts

### Signal 1: Zero-result feature searches

Plausible features that don't exist. All four queries return `result_count: 0` and `clicked_article_id: null`. A small percentage of users (~12%) escalated to a ticket; most abandoned.

| Query family | Total searches | Led to ticket |
|---|---|---|
| `pin notes` family (3 phrasings) | ~25 | ~3 |
| `fertilizer reminder` family (3 phrasings) | ~25 | ~3 |
| `plant id from photo` family (3 phrasings) | ~21 | ~2 |
| `humidity tracking` family (3 phrasings) | ~16 | ~3 |

Spring queries (`fertilizer reminder`) cluster Mar–May. Winter queries (`humidity tracking`) cluster Dec–Feb.

### Signal 2: Vocabulary mismatch cluster

Six emotional/diagnostic queries, all `result_count: 0`. ~12% escalated to ticket; most abandoned.

| Query | Total searches | Led to ticket |
|---|---|---|
| `is my plant dying` (+ "plant dying help") | ~74 | ~9 |
| `yellowing leaves` | ~38 | ~5 |
| `overwatering` (+ "overwatered plant") | ~48 | ~6 |
| `save my plant` | ~28 | ~3 |
| `drooping leaves` | ~26 | ~3 |
| `leaves falling off` (+ "leaves dropping") | ~36 | ~4 |

Heavily seasonally weighted toward winter (Dec–Feb), the panic season.

The interpretive payload of this cluster is **not** that the articles are mistitled. It's that the KB doesn't cover diagnostics by deliberate scope. The dashboard surfaces a positioning question, not an authoring task — see the headline finding below.

### Signal 3: Weak-article low-deflection patterns

Two articles assessed as weakest in their current form (both OG articles predating the style guide).

| Article | Click-throughs | Tickets touching the article | Deflection rate |
|---|---|---|---|
| Notes Overview | 195 | 24 | 90.8% |
| Watering Cadence Chart Overview | 112 | 18 | 87.5% |
| Strong-article baseline | varies | varies | 94–98% |

The 5–10 percentage-point gap is the low-deflection signal. Tickets for these articles use gap subjects representing what the articles fail to answer:

**Notes Overview gaps:** "What should I put in a note?" / "Why doesn't my note save?" / "Can I attach a note to a specific watering?" / "How can I attach a note to a photo?"

**Cadence Chart gaps:** "What does the average days number mean?" / "Why is my chart empty?" / "How do I export the chart?" / "What's the difference between cadence and schedule?"

The last gap subject is the most analytically interesting: the schedule-vs-cadence distinction is taught in *Changing a plant's watering schedule*'s TIP callout but not absorbed by the chart article. The data surfaces a content-merge opportunity.

### Signal 4: Seasonal pattern

Tickets per month:

| Month | Tickets |
|---|---|
| 2025-08 | 8 |
| 2025-09 | 17 |
| 2025-10 | 16 |
| 2025-11 | 26 |
| 2025-12 | 25 |
| **2026-01** | **38** *(winter panic peak)* |
| 2026-02 | 28 |
| **2026-03** | **38** *(spring active-care peak)* |
| **2026-04** | **35** *(spring active-care)* |
| 2026-05 | 9 *(partial month)* |

Two peaks (winter, spring), trough in late summer — realistic for a houseplant audience. Search volume tracks the same pattern.

## Per-article performance (from this run)

| Article | Views | Click-throughs from search | Tickets | Deflection |
|---|---|---|---|---|
| Setting up your collection | 1,850 | 323 | 17 | 96.3% |
| Installing Plant Tracker on your phone | 1,357 | 175 | 6 | 97.1% |
| Home dashboard overview | 1,620 | 255 | 22 | 93.7% |
| Adding a plant | 551 | 56 | 1 | 98.2% |
| Editing a plant | 402 | 28 | 2 | 96.4% |
| Deleting a plant | 508 | 39 | 1 | 100.0% |
| Logging a watering | 1,340 | 266 | 16 | 95.9% |
| Adding photos | 1,075 | 118 | 13 | 92.4% |
| **Notes Overview** *(weak)* | 1,180 | 195 | 24 | **90.8%** |
| Changing a plant's watering schedule | 787 | 86 | 10 | 94.2% |
| **Watering Cadence Chart Overview** *(weak)* | 920 | 112 | 18 | **87.5%** |
| Exporting and importing data | 860 | 137 | 10 | 94.9% |
| Troubleshooting | 803 | 74 | 6 | 94.6% |
| Frequently asked questions | 619 | 40 | 5 | 92.5% |

## Headline finding

The largest content gap in the Plant Tracker KB is **structural, not phrasing**. Plant Tracker is a logging-and-practice tool; ~10% of total search queries assume it's a care-and-diagnosis tool. This isn't a gap that more articles can close — it's a positioning question for the product itself.

The dashboard surfaces this; the writeup recommends what to do (reposition the product framing, add a boundary-setting "what this is and isn't" article, or deliberately scope the KB to redirect diagnostic queries elsewhere).

## Honest caveats and known imperfections

- **Cross-contamination:** the standalone-ticket generation pass occasionally links a "noise" ticket to a weak article (because the article-link weighting is by view count, and the weak articles are heavily-trafficked). This means a small number of generic tickets like "How do I rename a plant?" appear with `linked_article_ids: ["watering-cadence-chart-overview"]`. Doesn't break the deflection signal, but slightly dilutes it.
- **`led_to_ticket` is the only causal link** between searches and tickets — there's no `triggered_by_search_id` field. If the dashboard wants to show the search-to-ticket pipeline at session granularity, that field would need to be added in a future seed iteration.
- **Article view counts are static, not time-series.** A real analytics layer would have per-day view counts; this seed only has totals. If the dashboard wants a "views over time" chart, the seed will need to attribute each view to a day. Trivial extension.
- **Resolution time is uniform random 0–7 days.** A real support org would show category-dependent resolution times. Trivial extension if needed.

These are all surface-level extensions; nothing here invalidates the analytical signal the seed is designed to surface.
