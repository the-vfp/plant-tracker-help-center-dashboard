/**
 * Plant Tracker Support Analytics — synthetic data seed
 *
 * Reproducible: same PRNG seed → same output. Run with `npm run seed`.
 *
 * Encodes the analytical signals defined in `signal-design.md`:
 *   1. Zero-result feature searches (4 plausible-but-nonexistent features)
 *   2. Vocabulary mismatch cluster (6 emotional/diagnostic queries)
 *   3. Weak-article low-deflection patterns (Notes Overview + Watering Cadence Chart)
 *   4. Seasonal pattern (winter panic + spring active-care peaks)
 *
 * Outputs three JSON files in this folder:
 *   - articles.json
 *   - searches.json
 *   - tickets.json
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// =====================================================================
// PRNG — Mulberry32 for reproducibility
// =====================================================================

function mulberry32(seed: number): () => number {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEED = 42;
const rand = mulberry32(SEED);

const randInt = (min: number, max: number): number =>
  Math.floor(rand() * (max - min + 1)) + min;

const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]!;

const chance = (probability: number): boolean => rand() < probability;

// =====================================================================
// Date utilities
// =====================================================================

const START_DATE = new Date('2025-08-09T00:00:00Z');
const END_DATE = new Date('2026-05-09T23:59:59Z');
const TOTAL_DAYS =
  Math.floor((END_DATE.getTime() - START_DATE.getTime()) / 86400000) + 1;

function dateAtDayOffset(daysFromStart: number): Date {
  const d = new Date(START_DATE.getTime() + daysFromStart * 86400000);
  d.setUTCHours(randInt(8, 22), randInt(0, 59), randInt(0, 59));
  return d;
}

/** Seasonal weight per month — drives volume distribution across the window. */
function seasonalMultiplier(date: Date): number {
  const month = date.getUTCMonth(); // 0 = Jan, 11 = Dec
  switch (month) {
    case 7: return 0.6;  // Aug — late summer trough
    case 8: return 0.7;  // Sep
    case 9: return 0.9;  // Oct — fall ramp
    case 10: return 1.0; // Nov
    case 11: return 1.4; // Dec — winter panic
    case 0: return 1.5;  // Jan — winter peak
    case 1: return 1.3;  // Feb — winter declining
    case 2: return 1.4;  // Mar — spring ramp
    case 3: return 1.5;  // Apr — spring peak
    case 4: return 0.7;  // May — partial month
    default: return 1.0;
  }
}

/** Topic-specific seasonal boost — separate from volume. */
const TOPIC_SEASON_BOOST = {
  /** "is my plant dying" cluster — winter panic peak */
  winterPanic: (m: number) => (m === 11 || m === 0 ? 2.5 : m === 1 ? 2.0 : 1.0),
  /** Fertilizer/spring-growth — spring peak */
  springGrowth: (m: number) => (m === 2 || m === 3 || m === 4 ? 2.0 : 1.0),
  /** Humidity — winter peak (heating dries air) */
  humidity: (m: number) => (m === 11 || m === 0 || m === 1 ? 2.0 : 1.0),
  /** Vacation watering — late-summer */
  vacation: (m: number) => (m === 7 || m === 8 ? 2.5 : 1.0),
  /** Repotting — spring + early fall */
  repot: (m: number) => (m === 2 || m === 3 || m === 9 || m === 10 ? 1.8 : 1.0),
} as const;

/** Weighted-random day offset, biased by seasonal multiplier. */
function pickDayOffset(topicBoost?: (month: number) => number): number {
  // Build cumulative weights across days
  const weights: number[] = new Array(TOTAL_DAYS);
  let totalWeight = 0;
  for (let i = 0; i < TOTAL_DAYS; i++) {
    const d = new Date(START_DATE.getTime() + i * 86400000);
    const month = d.getUTCMonth();
    const w = seasonalMultiplier(d) * (topicBoost ? topicBoost(month) : 1);
    weights[i] = w;
    totalWeight += w;
  }
  let r = rand() * totalWeight;
  for (let i = 0; i < TOTAL_DAYS; i++) {
    r -= weights[i]!;
    if (r <= 0) return i;
  }
  return TOTAL_DAYS - 1;
}

// =====================================================================
// Article corpus
// =====================================================================

interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  category_label: string;
  last_updated: string; // ISO date (YYYY-MM-DD)
  body_word_count: number;
  view_count: number;
  is_weak: boolean; // honest editorial assessment
}

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[''""".,?!:]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const ARTICLE_SOURCE = [
  // Getting started
  { title: 'Setting up your collection',                category: 'getting-started',        category_label: 'Getting started',        words: 350, last_updated: '2026-04-15', is_weak: false },
  { title: 'Installing Plant Tracker on your phone',    category: 'getting-started',        category_label: 'Getting started',        words: 250, last_updated: '2026-04-20', is_weak: false },
  { title: 'Home dashboard overview',                   category: 'getting-started',        category_label: 'Getting started',        words: 480, last_updated: '2026-04-22', is_weak: false },
  // Managing plants
  { title: 'Adding a plant',                            category: 'managing-plants',        category_label: 'Managing plants',        words: 230, last_updated: '2026-04-25', is_weak: false },
  { title: 'Editing a plant',                           category: 'managing-plants',        category_label: 'Managing plants',        words: 200, last_updated: '2026-04-26', is_weak: false },
  { title: 'Deleting a plant',                          category: 'managing-plants',        category_label: 'Managing plants',        words: 180, last_updated: '2026-04-27', is_weak: false },
  // Daily care
  { title: 'Logging a watering',                        category: 'daily-care',             category_label: 'Daily care',             words: 320, last_updated: '2026-04-28', is_weak: false },
  { title: 'Adding photos',                             category: 'daily-care',             category_label: 'Daily care',             words: 290, last_updated: '2026-04-29', is_weak: false },
  { title: 'Notes Overview',                            category: 'daily-care',             category_label: 'Daily care',             words: 280, last_updated: '2025-10-15', is_weak: true },
  // Tracking & insights
  { title: "Changing a plant's watering schedule",      category: 'tracking-and-insights',  category_label: 'Tracking & insights',    words: 240, last_updated: '2025-10-20', is_weak: false },
  { title: 'Watering Cadence Chart Overview',           category: 'tracking-and-insights',  category_label: 'Tracking & insights',    words: 180, last_updated: '2025-10-22', is_weak: true },
  // Reference
  { title: 'Exporting and importing data',              category: 'reference',              category_label: 'Reference',              words: 410, last_updated: '2026-05-01', is_weak: false },
  { title: 'Troubleshooting',                           category: 'reference',              category_label: 'Reference',              words: 360, last_updated: '2026-05-02', is_weak: false },
  { title: 'Frequently asked questions',                category: 'reference',              category_label: 'Reference',              words: 380, last_updated: '2026-05-03', is_weak: false },
] as const;

const ARTICLES: Article[] = ARTICLE_SOURCE.map((a) => {
  const slug = slugify(a.title);
  return {
    id: slug,
    title: a.title,
    slug,
    category: a.category,
    category_label: a.category_label,
    last_updated: a.last_updated,
    body_word_count: a.words,
    view_count: 0,
    is_weak: a.is_weak,
  };
});

// View count distribution: power-law-ish, weighted by category.
// Getting Started attracts the most search traffic; Managing Plants articles
// are short/reference-y and reached via direct link from Setting up your collection.
const CATEGORY_VIEW_BASELINE: Record<string, number> = {
  'getting-started': 1400,
  'daily-care': 1000,
  'tracking-and-insights': 800,
  'reference': 700,
  'managing-plants': 500,
};

ARTICLES.forEach((a) => {
  const base = CATEGORY_VIEW_BASELINE[a.category] ?? 700;
  const noise = 0.7 + rand() * 0.6; // 0.7–1.3
  a.view_count = Math.round(base * noise);
});

// Manual tunes so the dashboard's "top articles" view tells a coherent story
const setView = (slug: string, count: number) => {
  const a = ARTICLES.find((x) => x.slug === slug);
  if (a) a.view_count = count;
};
setView('setting-up-your-collection', 1850); // entry point
setView('home-dashboard-overview', 1620);    // foundational
setView('logging-a-watering', 1340);          // the core daily action
setView('notes-overview', 1180);              // weak but heavily-trafficked
setView('watering-cadence-chart-overview', 920); // weak but interesting

// =====================================================================
// Query pools
// =====================================================================

interface ZeroResultQuery {
  query: string;
  count: number;
  topicBoost?: (m: number) => number;
}

const ZERO_RESULT_QUERIES: ZeroResultQuery[] = [
  // Pin notes (friend ask)
  { query: 'pin notes', count: 14 },
  { query: 'pin a note', count: 7 },
  { query: 'pinned notes', count: 4 },
  // Fertilizer reminder (friend ask + KB ambiguity)
  { query: 'fertilizer reminder', count: 12, topicBoost: TOPIC_SEASON_BOOST.springGrowth },
  { query: 'fertilizer schedule', count: 8, topicBoost: TOPIC_SEASON_BOOST.springGrowth },
  { query: 'how often to fertilize', count: 5, topicBoost: TOPIC_SEASON_BOOST.springGrowth },
  // Plant ID from photo (category convention)
  { query: 'plant id from photo', count: 9 },
  { query: 'identify plant', count: 7 },
  { query: 'what plant is this', count: 5 },
  // Humidity tracking (winter peak)
  { query: 'humidity tracking', count: 9, topicBoost: TOPIC_SEASON_BOOST.humidity },
  { query: 'humidity sensor', count: 4, topicBoost: TOPIC_SEASON_BOOST.humidity },
  { query: 'log humidity', count: 3, topicBoost: TOPIC_SEASON_BOOST.humidity },
];

interface VocabMismatchQuery {
  query: string;
  count: number;
  topicBoost?: (m: number) => number;
}

const VOCAB_MISMATCH_QUERIES: VocabMismatchQuery[] = [
  // "is my plant dying" cluster
  { query: 'is my plant dying', count: 52, topicBoost: TOPIC_SEASON_BOOST.winterPanic },
  { query: 'plant dying help', count: 22, topicBoost: TOPIC_SEASON_BOOST.winterPanic },
  // "yellowing leaves"
  { query: 'yellowing leaves', count: 38, topicBoost: TOPIC_SEASON_BOOST.winterPanic },
  // "overwatering"
  { query: 'overwatering', count: 32, topicBoost: TOPIC_SEASON_BOOST.winterPanic },
  { query: 'overwatered plant', count: 16, topicBoost: TOPIC_SEASON_BOOST.winterPanic },
  // "save my plant"
  { query: 'save my plant', count: 28, topicBoost: TOPIC_SEASON_BOOST.winterPanic },
  // "drooping leaves"
  { query: 'drooping leaves', count: 26, topicBoost: TOPIC_SEASON_BOOST.winterPanic },
  // "leaves falling off"
  { query: 'leaves falling off', count: 22, topicBoost: TOPIC_SEASON_BOOST.winterPanic },
  { query: 'leaves dropping', count: 14, topicBoost: TOPIC_SEASON_BOOST.winterPanic },
];

interface NormalQuery {
  query: string;
  article_slug: string;
  weight: number;
  topicBoost?: (m: number) => number;
}

const NORMAL_QUERIES: NormalQuery[] = [
  // Setting up your collection
  { query: 'getting started', article_slug: 'setting-up-your-collection', weight: 1.5 },
  { query: 'how to use plant tracker', article_slug: 'setting-up-your-collection', weight: 1.2 },
  { query: 'first steps', article_slug: 'setting-up-your-collection', weight: 0.8 },
  { query: 'quick start', article_slug: 'setting-up-your-collection', weight: 0.6 },
  { query: 'new user guide', article_slug: 'setting-up-your-collection', weight: 0.5 },
  // Installing
  { query: 'install on iphone', article_slug: 'installing-plant-tracker-on-your-phone', weight: 1.0 },
  { query: 'install on android', article_slug: 'installing-plant-tracker-on-your-phone', weight: 0.9 },
  { query: 'add to home screen', article_slug: 'installing-plant-tracker-on-your-phone', weight: 0.8 },
  { query: 'pwa install', article_slug: 'installing-plant-tracker-on-your-phone', weight: 0.4 },
  { query: 'install app', article_slug: 'installing-plant-tracker-on-your-phone', weight: 0.7 },
  // Home dashboard
  { query: 'dashboard', article_slug: 'home-dashboard-overview', weight: 1.2 },
  { query: 'home screen', article_slug: 'home-dashboard-overview', weight: 0.8 },
  { query: 'thirsty tab', article_slug: 'home-dashboard-overview', weight: 0.7 },
  { query: 'care log tab', article_slug: 'home-dashboard-overview', weight: 0.5 },
  { query: 'all plants tab', article_slug: 'home-dashboard-overview', weight: 0.5 },
  { query: 'week ahead', article_slug: 'home-dashboard-overview', weight: 0.4 },
  // Adding a plant
  { query: 'add plant', article_slug: 'adding-a-plant', weight: 1.5 },
  { query: 'new plant', article_slug: 'adding-a-plant', weight: 1.0 },
  { query: 'create plant', article_slug: 'adding-a-plant', weight: 0.6 },
  // Editing
  { query: 'edit plant', article_slug: 'editing-a-plant', weight: 0.9 },
  { query: 'change plant name', article_slug: 'editing-a-plant', weight: 0.6 },
  { query: 'change icon', article_slug: 'editing-a-plant', weight: 0.5 },
  // Deleting
  { query: 'delete plant', article_slug: 'deleting-a-plant', weight: 0.9 },
  { query: 'remove plant', article_slug: 'deleting-a-plant', weight: 0.7 },
  // Logging a watering
  { query: 'log watering', article_slug: 'logging-a-watering', weight: 1.4 },
  { query: 'log a watering', article_slug: 'logging-a-watering', weight: 1.0 },
  { query: 'water plant', article_slug: 'logging-a-watering', weight: 1.2 },
  { query: 'mark as watered', article_slug: 'logging-a-watering', weight: 0.7 },
  { query: 'undo watering', article_slug: 'logging-a-watering', weight: 0.5 },
  // Adding photos
  { query: 'add photo', article_slug: 'adding-photos', weight: 1.0 },
  { query: 'plant photo', article_slug: 'adding-photos', weight: 0.7 },
  { query: 'upload photo', article_slug: 'adding-photos', weight: 0.5 },
  { query: 'photo gallery', article_slug: 'adding-photos', weight: 0.4 },
  // Notes (weak)
  { query: 'add note', article_slug: 'notes-overview', weight: 1.3 },
  { query: 'plant notes', article_slug: 'notes-overview', weight: 1.0 },
  { query: 'edit note', article_slug: 'notes-overview', weight: 0.7 },
  { query: 'delete note', article_slug: 'notes-overview', weight: 0.5 },
  { query: 'note emoji', article_slug: 'notes-overview', weight: 0.6 },
  { query: 'how to use notes', article_slug: 'notes-overview', weight: 0.6 },
  // Watering schedule
  { query: 'watering schedule', article_slug: 'changing-a-plants-watering-schedule', weight: 1.2 },
  { query: 'change schedule', article_slug: 'changing-a-plants-watering-schedule', weight: 0.8 },
  { query: 'water every', article_slug: 'changing-a-plants-watering-schedule', weight: 0.6 },
  // Cadence chart (weak)
  { query: 'cadence chart', article_slug: 'watering-cadence-chart-overview', weight: 0.8 },
  { query: 'watering chart', article_slug: 'watering-cadence-chart-overview', weight: 1.0 },
  { query: 'cadence graph', article_slug: 'watering-cadence-chart-overview', weight: 0.6 },
  { query: 'how often watered', article_slug: 'watering-cadence-chart-overview', weight: 0.7 },
  // Exporting
  { query: 'backup data', article_slug: 'exporting-and-importing-data', weight: 1.0 },
  { query: 'export plants', article_slug: 'exporting-and-importing-data', weight: 0.9 },
  { query: 'import backup', article_slug: 'exporting-and-importing-data', weight: 0.7 },
  { query: 'transfer to new phone', article_slug: 'exporting-and-importing-data', weight: 0.8 },
  { query: 'where is my data', article_slug: 'exporting-and-importing-data', weight: 0.6 },
  // Troubleshooting
  { query: 'troubleshooting', article_slug: 'troubleshooting', weight: 0.7 },
  { query: 'app not working', article_slug: 'troubleshooting', weight: 0.6 },
  { query: 'lost my plants', article_slug: 'troubleshooting', weight: 0.8 },
  // FAQ
  { query: 'faq', article_slug: 'frequently-asked-questions', weight: 0.6 },
  { query: 'is plant tracker free', article_slug: 'frequently-asked-questions', weight: 0.4 },
  { query: 'desktop version', article_slug: 'frequently-asked-questions', weight: 0.4 },
];

// =====================================================================
// Ticket subject pools
// =====================================================================

const WEAK_ARTICLE_GAP_SUBJECTS: Record<string, string[]> = {
  'notes-overview': [
    'What should I put in a note?',
    "Why doesn't my note save?",
    'Can I attach a note to a specific watering?',
    'How can I attach a note to a photo?',
  ],
  'watering-cadence-chart-overview': [
    'What does the average days number mean?',
    'Why is my chart empty?',
    'How do I export the chart?',
    "What's the difference between cadence and schedule?",
  ],
};

const VOCAB_TICKET_SUBJECTS = [
  "My plant looks like it's dying — what do I do?",
  'How do I know if my plant is overwatered?',
  "Why are my plant's leaves yellowing?",
  'My plant is drooping, please help',
  "Leaves are falling off and I don't know why",
  'Is my plant going to make it?',
  'Plant looks sad — how do I save it?',
  "Why isn't the app telling me what's wrong with my plant?",
  'Where can I get plant care advice in this app?',
  'Does Plant Tracker diagnose plant problems?',
  'I think I overwatered my plant — what now?',
  'My plant has yellow leaves, is the app showing me why?',
];

const FEATURE_REQUEST_TICKET_SUBJECTS = [
  "Feature request: ability to pin notes to the top of a plant's care log",
  'Can you add a fertilizer reminder feature?',
  'Plant ID from photo would be amazing',
  'Humidity tracking — is this on the roadmap?',
  'Multi-user / household sharing — possible?',
  'Suggestion: notification when a plant is overdue',
  'Would love a fertilizer schedule, separate from watering',
  'Any plans for a humidity log?',
];

const SEASONAL_TICKET_SUBJECTS = {
  vacation: [
    'Going on vacation — how do I track waterings while traveling?',
    'I came back from a trip and my plants look bad',
    'How can I see what watering I missed while I was away?',
    'Best practice for catch-up logging after a trip?',
  ],
  fall_repot: [
    'Best practice for logging a repotting in the app?',
    'Should I reset the watering schedule after repotting?',
    'How to log a repot — does it create a new plant?',
  ],
  spring_repot: [
    'Logging a fresh repot — does it affect the cadence chart?',
    'I just repotted Agnes — should her schedule change?',
    'Spring repot — best way to track in the app?',
  ],
  spring_growth: [
    'My plants are putting out new leaves — anything I should log?',
    'New growth season — should I water more frequently?',
  ],
} as const;

const NOISE_TICKET_SUBJECTS = [
  'How do I change the watering frequency?',
  'My plant disappeared from the list — where did it go?',
  "Can't install the app on my phone",
  'The thirsty tab is empty but I know plants need water',
  'How do I see my full care history?',
  'Lost all my data after clearing browser',
  'Question about the watering chart',
  'How does the schedule reset work?',
  'Editing a note — am I missing something?',
  'Adding multiple plants of the same type',
  'How do I rearrange plants on the dashboard?',
  'Sort plants by watering due date?',
  'Photo upload failed — what should I try?',
  'Where is the export button?',
  'Imported a backup but photos are missing',
  'Is there a Mac app?',
  'Can I use this on my computer?',
  'How do I rename a plant?',
  'Is there a way to undo a delete?',
  'Why does my schedule say a plant is thirsty when I just watered it?',
  'How do I share my collection with my partner?',
  'Are there any keyboard shortcuts?',
  'How do I report a bug?',
  'Question about icon options',
  'Care log shows wrong date',
  'Plant Tracker icon disappeared from my home screen',
  'Browser cache cleared and I lost everything',
  'How do I export only one plant?',
  'Can I add custom emojis?',
  'Watering today vs watered today — confusing',
  'Photos take a long time to upload',
  'Why is the app dark mode not working?',
  'Question about the iOS install steps',
  'Trouble with the Android Chrome install',
  'How do I change my plant\'s type after adding it?',
];

// =====================================================================
// Helpers for ticket bodies
// =====================================================================

const TICKET_BODY_OPENERS = [
  'Hi, ',
  'Hey there — ',
  'Hello! ',
  'Hi team, ',
  '',
  'Quick question: ',
];

const TICKET_BODY_PADDING = [
  ' Could you let me know what to do?',
  ' Thanks in advance!',
  ' Any help appreciated.',
  ' Hopefully this is something simple.',
  ' Thanks for the great app, by the way.',
  '',
];

function makeTicketBody(subject: string): string {
  const opener = pick(TICKET_BODY_OPENERS);
  const padding = pick(TICKET_BODY_PADDING);
  // Lowercase the first letter of the subject if we have an opener
  const body = opener
    ? opener + subject.charAt(0).toLowerCase() + subject.slice(1) + padding
    : subject + padding;
  return body.trim();
}

// =====================================================================
// Search generation
// =====================================================================

interface Search {
  id: string;
  query: string;
  timestamp: string;
  result_count: number;
  clicked_article_id: string | null;
  led_to_ticket: boolean;
}

const searches: Search[] = [];
let searchIdCounter = 1;

function makeSearch(
  query: string,
  result_count: number,
  clicked_article_id: string | null,
  led_to_ticket: boolean,
  topicBoost?: (m: number) => number
): Search {
  const dayOffset = pickDayOffset(topicBoost);
  return {
    id: `S-${String(searchIdCounter++).padStart(5, '0')}`,
    query,
    timestamp: dateAtDayOffset(dayOffset).toISOString(),
    result_count,
    clicked_article_id,
    led_to_ticket,
  };
}

// --- Signal 1: Zero-result feature searches ---
for (const zr of ZERO_RESULT_QUERIES) {
  for (let i = 0; i < zr.count; i++) {
    const led = chance(0.12); // ~12% escalate to ticket
    searches.push(makeSearch(zr.query, 0, null, led, zr.topicBoost));
  }
}

// --- Signal 2: Vocabulary mismatch searches ---
for (const vm of VOCAB_MISMATCH_QUERIES) {
  for (let i = 0; i < vm.count; i++) {
    const led = chance(0.12);
    searches.push(makeSearch(vm.query, 0, null, led, vm.topicBoost));
  }
}

// --- Signal 3 + noise: Normal queries that find articles ---
// Fill the remaining search budget with normal queries, weighted by per-query weight
// AND by article view count (popular articles get more search traffic).
const TOTAL_NORMAL_TARGET = 2400 - searches.length;

const articlesById = new Map(ARTICLES.map((a) => [a.id, a]));
const normalWeights = NORMAL_QUERIES.map((q) => {
  const article = articlesById.get(q.article_slug);
  if (!article) throw new Error(`Unknown article slug: ${q.article_slug}`);
  return q.weight * (article.view_count / 1000);
});
const normalWeightTotal = normalWeights.reduce((a, b) => a + b, 0);

for (let i = 0; i < TOTAL_NORMAL_TARGET; i++) {
  // Weighted-pick a query
  let r = rand() * normalWeightTotal;
  let pickedIdx = 0;
  for (let j = 0; j < NORMAL_QUERIES.length; j++) {
    r -= normalWeights[j]!;
    if (r <= 0) {
      pickedIdx = j;
      break;
    }
  }
  const nq = NORMAL_QUERIES[pickedIdx]!;
  const article = articlesById.get(nq.article_slug)!;

  // Result count: 1-5, with the matched article showing first
  const resultCount = randInt(1, 5);

  // Did they click? Most do (they got results).
  const clicked = chance(0.92);
  const clickedId = clicked ? article.id : null;

  // led_to_ticket rate depends on whether the article is weak
  let ticketRate = 0.05; // baseline: strong articles deflect well
  if (article.is_weak && clicked) {
    ticketRate = 0.10; // weak articles: ~10% still ticket after reading
  }
  if (!clicked) {
    ticketRate = 0.03; // didn't click — rarely ticket
  }
  const led = chance(ticketRate);

  searches.push(makeSearch(nq.query, resultCount, clickedId, led, nq.topicBoost));
}

// Sort searches by timestamp
searches.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
// Re-issue IDs sequentially so they're chronological-ish
searches.forEach((s, i) => {
  s.id = `S-${String(i + 1).padStart(5, '0')}`;
});

// =====================================================================
// Ticket generation
// =====================================================================

interface Ticket {
  id: string;
  subject: string;
  body_excerpt: string;
  category: string;
  created_at: string;
  resolved_at: string;
  linked_article_ids: string[];
  resolution: 'agent_resolved' | 'escalated_to_eng';
}

const tickets: Ticket[] = [];
let ticketIdCounter = 1;

function makeTicket(args: {
  subject: string;
  category: string;
  created_at: string;
  linked_article_ids: string[];
  escalation_chance?: number;
}): Ticket {
  const created = new Date(args.created_at);
  const resolveDays = randInt(0, 4) + rand() * 3;
  const resolved = new Date(created.getTime() + resolveDays * 86400000);
  const escalation = args.escalation_chance ?? 0.12;
  return {
    id: `T-${String(ticketIdCounter++).padStart(5, '0')}`,
    subject: args.subject,
    body_excerpt: makeTicketBody(args.subject),
    category: args.category,
    created_at: created.toISOString(),
    resolved_at: resolved.toISOString(),
    linked_article_ids: args.linked_article_ids,
    resolution: chance(escalation) ? 'escalated_to_eng' : 'agent_resolved',
  };
}

// --- Tickets driven by led_to_ticket searches ---
// For each search with led_to_ticket=true, create a ticket
// some hours/days after the search.
for (const s of searches) {
  if (!s.led_to_ticket) continue;

  const searchTime = new Date(s.timestamp);
  // Ticket created 1-72 hours after the search
  const hoursLater = 1 + rand() * 71;
  const ticketTime = new Date(
    searchTime.getTime() + hoursLater * 3600000
  );

  let subject: string;
  let category: string;
  let linked: string[];
  let escalation = 0.12;

  if (s.clicked_article_id) {
    // Search found an article and was clicked — ticket is about that article
    const article = articlesById.get(s.clicked_article_id)!;
    if (article.is_weak) {
      // Weak article ticket — pick a gap subject
      const gapSubjects = WEAK_ARTICLE_GAP_SUBJECTS[article.id] ?? [];
      subject = pick(gapSubjects);
      escalation = 0.20; // weak article tickets escalate more — agent has nothing to refer
    } else {
      // Strong article but ticketed anyway — generic noise about the topic
      subject = pick(NOISE_TICKET_SUBJECTS);
    }
    category = article.category;
    linked = [article.id];
  } else {
    // Search returned nothing (zero-result or vocab mismatch)
    if (
      ZERO_RESULT_QUERIES.some((q) => q.query === s.query)
    ) {
      subject = pick(FEATURE_REQUEST_TICKET_SUBJECTS);
      category = 'reference'; // feature requests routed to general queue
      linked = [];
      escalation = 0.45; // feature requests heavily escalated to eng
    } else {
      subject = pick(VOCAB_TICKET_SUBJECTS);
      category = 'reference'; // diagnostic questions routed to general queue
      linked = []; // no article matched
      escalation = 0.08; // not eng territory — agent handles with care advice / referral
    }
  }

  tickets.push(
    makeTicket({
      subject,
      category,
      created_at: ticketTime.toISOString(),
      linked_article_ids: linked,
      escalation_chance: escalation,
    })
  );
}

// --- Standalone tickets (no preceding search) ---
const TICKET_TARGET = 240;
const standaloneCount = TICKET_TARGET - tickets.length;

for (let i = 0; i < standaloneCount; i++) {
  // Decide what kind of standalone ticket
  const r = rand();
  let subject: string;
  let category: string;
  let linked: string[] = [];
  let topicBoost: ((m: number) => number) | undefined;
  let escalation = 0.12;

  if (r < 0.18) {
    // Seasonal cluster
    const seasonal = pick([
      ['vacation', SEASONAL_TICKET_SUBJECTS.vacation, TOPIC_SEASON_BOOST.vacation],
      ['fall_repot', SEASONAL_TICKET_SUBJECTS.fall_repot, TOPIC_SEASON_BOOST.repot],
      ['spring_repot', SEASONAL_TICKET_SUBJECTS.spring_repot, TOPIC_SEASON_BOOST.repot],
      ['spring_growth', SEASONAL_TICKET_SUBJECTS.spring_growth, TOPIC_SEASON_BOOST.springGrowth],
    ] as const);
    subject = pick(seasonal[1]);
    topicBoost = seasonal[2];
    category = 'daily-care';
  } else if (r < 0.25) {
    // Vocab/diagnostic standalone
    subject = pick(VOCAB_TICKET_SUBJECTS);
    category = 'reference';
    topicBoost = TOPIC_SEASON_BOOST.winterPanic;
    escalation = 0.08;
  } else if (r < 0.30) {
    // Feature request standalone
    subject = pick(FEATURE_REQUEST_TICKET_SUBJECTS);
    category = 'reference';
    escalation = 0.45;
  } else {
    // Generic noise — pick a random article to link, sometimes
    subject = pick(NOISE_TICKET_SUBJECTS);
    if (chance(0.6)) {
      // Weight by view count
      const totalViews = ARTICLES.reduce((sum, a) => sum + a.view_count, 0);
      let r2 = rand() * totalViews;
      let chosen = ARTICLES[0]!;
      for (const a of ARTICLES) {
        r2 -= a.view_count;
        if (r2 <= 0) {
          chosen = a;
          break;
        }
      }
      linked = [chosen.id];
      category = chosen.category;
    } else {
      category = pick([
        'getting-started',
        'managing-plants',
        'daily-care',
        'tracking-and-insights',
        'reference',
      ]);
    }
  }

  const dayOffset = pickDayOffset(topicBoost);
  const created = dateAtDayOffset(dayOffset);

  tickets.push(
    makeTicket({
      subject,
      category,
      created_at: created.toISOString(),
      linked_article_ids: linked,
      escalation_chance: escalation,
    })
  );
}

// Sort tickets by created_at; re-issue IDs chronologically
tickets.sort((a, b) => a.created_at.localeCompare(b.created_at));
ticketIdCounter = 1;
tickets.forEach((t, i) => {
  t.id = `T-${String(i + 1).padStart(5, '0')}`;
});

// =====================================================================
// Write output
// =====================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function writeJson(filename: string, data: unknown) {
  const filePath = path.join(__dirname, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${filename} (${(JSON.stringify(data).length / 1024).toFixed(1)} KB)`);
}

writeJson('articles.json', ARTICLES);
writeJson('searches.json', searches);
writeJson('tickets.json', tickets);

// =====================================================================
// Summary printout
// =====================================================================

console.log('\n=== Generation summary ===');
console.log(`Seed: ${SEED}`);
console.log(`Window: ${START_DATE.toISOString().slice(0, 10)} → ${END_DATE.toISOString().slice(0, 10)} (${TOTAL_DAYS} days)`);
console.log(`Articles: ${ARTICLES.length}`);
console.log(`Searches: ${searches.length}`);
console.log(`Tickets: ${tickets.length}`);

const zeroResultSearches = searches.filter((s) => s.result_count === 0);
const weakArticleSearches = searches.filter(
  (s) => s.clicked_article_id && articlesById.get(s.clicked_article_id)?.is_weak
);
const ledToTicket = searches.filter((s) => s.led_to_ticket);
console.log(`  Zero-result searches: ${zeroResultSearches.length}`);
console.log(`  Weak-article searches: ${weakArticleSearches.length}`);
console.log(`  Searches that led to ticket: ${ledToTicket.length}`);

const escalated = tickets.filter((t) => t.resolution === 'escalated_to_eng');
console.log(`  Tickets escalated to eng: ${escalated.length} (${((escalated.length / tickets.length) * 100).toFixed(1)}%)`);

// Per-article: views and tickets touching the article
console.log('\n=== Per-article performance ===');
for (const a of ARTICLES) {
  const ticketsForArticle = tickets.filter((t) =>
    t.linked_article_ids.includes(a.id)
  );
  const searchesClickedThrough = searches.filter(
    (s) => s.clicked_article_id === a.id
  );
  const deflected = searchesClickedThrough.filter((s) => !s.led_to_ticket);
  const deflectionRate =
    searchesClickedThrough.length > 0
      ? (deflected.length / searchesClickedThrough.length) * 100
      : 0;
  const flag = a.is_weak ? ' [weak]' : '';
  console.log(
    `  ${a.title}${flag}: views=${a.view_count}, click-throughs=${searchesClickedThrough.length}, tickets=${ticketsForArticle.length}, deflection=${deflectionRate.toFixed(1)}%`
  );
}
