# Plant Tracker Support Analytics — Signal Design

This doc captures the deliberate analytical signals that the synthetic data is designed to surface. The seed script encodes every case below; the dashboard renders them; the methodology writeup interprets them.

## Headline finding

The largest content gap in the Plant Tracker KB is **structural, not phrasing**. Plant Tracker is a logging-and-practice tool; a meaningful percentage of search queries assume it's a care-and-diagnosis tool. This isn't a gap that more articles can close — it's a positioning question for the product itself.

The dashboard's job is to surface this; the writeup's job is to recommend what to do about it (reposition the product framing, add a boundary-setting article, or deliberately scope the KB to redirect diagnostic queries elsewhere).

Every other signal below is in service of making this headline finding legible.

## Operational settings

- **Window:** 2025-08-09 → 2026-05-09 (9 months, anchored to today)
- **Volume:** ~240 tickets, ~2,400 searches
- **Stack:** TypeScript, run via `tsx`
- **Reproducibility:** seedable PRNG (Mulberry32), constant seed `42`
- **Output:** `articles.json`, `tickets.json`, `searches.json`, plus this doc reframed as `synthetic-data-notes.md` after generation

## Article corpus

The 14 published Help Center articles. Real titles, real categories, real slugs. The dashboard layer adds two synthetic fields:

- `view_count` — power-law distributed; Getting Started attracts the most views, Reference the fewest. Managing-plants articles are short and reference-y; users find them via direct link from *Setting up your collection* rather than via search.
- `deflection_signal` — derived at runtime from search behavior; specifically lower for the two weak articles below.

Last-updated dates are synthesized to reflect the real authoring story: the three OG articles (*Notes Overview*, *Changing a plant's watering schedule*, *Watering Cadence Chart Overview*) date from autumn 2025; the eleven drafts published in spring 2026.

## Signal 1: Zero-result feature searches (4)

Plausible features that don't exist. Each shows up as a distinct query with `result_count: 0` and `clicked_article_id: null`.

| Query | Why plausible | Source |
|---|---|---|
| `pin notes` | Real friend ask — Ellene's friend wished she could pin important notes to the top of a plant's care log | Authentic anecdote |
| `fertilizer reminder` | Real friend ask, AND the app already has a 🧪 fertilizer note glyph, so users naturally search "fertilizer" expecting more — find note-glyph documentation only, not a scheduled reminder | Authentic anecdote + KB ambiguity |
| `plant id from photo` | Every other plant app has this (PictureThis, PlantSnap); users assume Plant Tracker does too | Category-convention mismatch |
| `humidity tracking` | Common houseplant care concern, especially in winter; users assume a "tracker" app would track it | Plausible misread of the product's scope |

**Search distribution:** ~80 total searches across these four queries (~3% of all searches), with humidity tracking spiking in winter (Dec–Feb) and fertilizer reminder spiking in spring (Mar–May).

## Signal 2: Vocabulary mismatch cluster (6) — emotional/diagnostic theme

The pattern: users use **emotional or symptom-based** language; the KB uses **functional** language. All six map to "no good article."

| Query | What user wants | What KB has |
|---|---|---|
| `is my plant dying` | diagnostic help | nothing |
| `yellowing leaves` | symptom diagnosis | nothing |
| `overwatering` | recovery advice | KB only teaches "thirsty," not "drowning" |
| `save my plant` | rescue advice | nothing |
| `drooping leaves` | symptom diagnosis | nothing |
| `leaves falling off` | symptom diagnosis | nothing |

**Search distribution:** ~250 total searches across these six queries (~10% of all searches), heavily weighted in winter (the panic season).

**Connection to the headline finding:** these aren't queries that need new articles. They're queries that need a category-level answer ("the KB doesn't cover this — here's where to go for plant diagnostics"). The data surfaces a positioning question, not an authoring task.

## Signal 3: Weak-article low-deflection patterns (8 ticket topics)

Two articles are honestly assessed as weakest in their current form. Both are the OG overviews — predating the style-guide refinement that the newer drafts were modeled against.

### Notes Overview

Issues: doesn't explain *why* notes matter before showing *how*; assumes context about what a "note" should contain; the emoji glyph-key callout works as a lookup but doesn't teach intent.

Tickets representing what the article fails to answer:

- "What should I put in a note?"
- "Why doesn't my note save?"
- "Can I attach a note to a specific watering?"
- "How can I attach a note to a photo?"

### Watering Cadence Chart Overview

Issues: short, terminology-heavy, uses the word "cadence" before defining it (article 2's TIP callout teaches the schedule-vs-cadence distinction; this article doesn't absorb it); the *How the chart updates* section is very brief.

Tickets representing what the article fails to answer:

- "What does the average days number mean?"
- "Why is my chart empty?"
- "How do I export the chart?"
- "What's the difference between cadence and schedule?"

**Distribution:** Each weak article gets ~3-4 tickets per gap topic, totaling ~28-32 tickets between the two. Searches preceding these tickets find the weak article (`clicked_article_id` is set) but `led_to_ticket: true`. That's the low-deflection signal.

## Signal 4: Seasonal pattern (9-month window)

| Period | Volume | Theme |
|---|---|---|
| Aug–Sep 2025 | low | vacation watering questions; "I came back and my plant is dying" emotional cluster |
| Oct–Nov 2025 | moderate | fall repotting questions |
| Dec 2025–Feb 2026 | **peak (panic)** | "is my plant dying" cluster spikes; humidity searches spike; overwatering cluster (heating-induced confusion) |
| Mar–May 2026 | **peak (active care)** | spring repotting; fertilizer-reminder zero-result searches spike; new-growth questions |

Two peaks (winter panic, spring active-care), trough in late summer. Realistic for a houseplant audience.

## Distribution summary

| Signal type | Search count | Ticket count | Notes |
|---|---|---|---|
| Zero-result feature queries | ~80 | ~10 | Most users abandon; ~12% ticket |
| Vocabulary mismatch | ~250 | ~30 | Most users abandon; ~12% ticket |
| Weak-article low-deflection | ~120 (preceding searches) | ~30 | Search → click → still ticket |
| Seasonal noise tickets | (mixed below) | ~50 | Winter panic + spring repotting + summer vacation |
| Regular noise searches | ~1,950 | (n/a) | Find articles, deflect at ~85% rate |
| Regular noise tickets | (n/a) | ~120 | Tickets unrelated to the deliberate signals |
| **Totals** | **~2,400** | **~240** | |

## Resolution distribution

- ~85% `agent_resolved`
- ~15% `escalated_to_eng`
- Escalations cluster around: app bug reports surfacing via support, feature requests for the four zero-result features, and the two weak articles' tickets

## What this doc becomes

After the seed runs, this file gets reframed as `synthetic-data-notes.md` with the actual generated counts, the PRNG seed value, and any deviations from the targets above. The methodology writeup cites it directly.
