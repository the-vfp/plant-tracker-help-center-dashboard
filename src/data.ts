import articlesJson from '../analytics-seed/articles.json';
import ticketsJson from '../analytics-seed/tickets.json';
import searchesJson from '../analytics-seed/searches.json';
import type { Article, Ticket, Search, ArticlePerformance } from './types';

export const articles = articlesJson as Article[];
export const tickets = ticketsJson as Ticket[];
export const searches = searchesJson as Search[];

export const articlesById = new Map(articles.map((a) => [a.id, a]));

// Window covered by the seed.
export const dataWindow = {
  start: '2025-08-09',
  end: '2026-05-09',
};

// Per-article performance: deflection = clickthroughs that did NOT lead to a ticket.
// Matches the formula in seed.ts (the summary printout).
export function articlePerformance(): ArticlePerformance[] {
  return articles.map((article) => {
    const clickedSearches = searches.filter(
      (s) => s.clicked_article_id === article.id
    );
    const deflected = clickedSearches.filter((s) => !s.led_to_ticket);
    const ticketsTouching = tickets.filter((t) =>
      t.linked_article_ids.includes(article.id)
    );
    return {
      article,
      click_throughs: clickedSearches.length,
      tickets_touching: ticketsTouching.length,
      deflected: deflected.length,
      deflection_rate:
        clickedSearches.length > 0
          ? deflected.length / clickedSearches.length
          : 0,
    };
  });
}

// Overall modeled deflection rate: across all clickthrough searches,
// what fraction did NOT escalate to a ticket.
export function overallDeflectionRate(): number {
  const clicked = searches.filter((s) => s.clicked_article_id !== null);
  if (clicked.length === 0) return 0;
  const deflected = clicked.filter((s) => !s.led_to_ticket);
  return deflected.length / clicked.length;
}

// Tickets per month over the seeded window — for the seasonal chart.
export interface MonthlyVolume {
  month: string; // "2025-08"
  label: string; // "Aug 2025"
  tickets: number;
  searches: number;
}

const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
};

export function monthlyVolume(): MonthlyVolume[] {
  const buckets = new Map<string, MonthlyVolume>();
  const ensure = (month: string): MonthlyVolume => {
    let b = buckets.get(month);
    if (!b) {
      const [year, mm] = month.split('-');
      b = {
        month,
        label: `${MONTH_LABELS[mm ?? '01'] ?? mm} ${year}`,
        tickets: 0,
        searches: 0,
      };
      buckets.set(month, b);
    }
    return b;
  };
  for (const t of tickets) {
    const m = t.created_at.slice(0, 7);
    ensure(m).tickets += 1;
  }
  for (const s of searches) {
    const m = s.timestamp.slice(0, 7);
    ensure(m).searches += 1;
  }
  return [...buckets.values()].sort((a, b) => a.month.localeCompare(b.month));
}

// Zero-result searches grouped by query. Returns rows ordered by total volume desc.
export interface ZeroResultRow {
  query: string;
  searches: number;
  led_to_ticket: number;
}

export function zeroResultBreakdown(): ZeroResultRow[] {
  const map = new Map<string, ZeroResultRow>();
  for (const s of searches) {
    if (s.result_count !== 0) continue;
    let row = map.get(s.query);
    if (!row) {
      row = { query: s.query, searches: 0, led_to_ticket: 0 };
      map.set(s.query, row);
    }
    row.searches += 1;
    if (s.led_to_ticket) row.led_to_ticket += 1;
  }
  return [...map.values()].sort((a, b) => b.searches - a.searches);
}

// Tickets without any linked article — candidate "no matching article" content gaps.
export function unlinkedTicketSubjects(): { subject: string; count: number }[] {
  const map = new Map<string, number>();
  for (const t of tickets) {
    if (t.linked_article_ids.length > 0) continue;
    map.set(t.subject, (map.get(t.subject) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([subject, count]) => ({ subject, count }))
    .sort((a, b) => b.count - a.count);
}

// Top queries (any result count) with their click rate and ticket rate.
export interface QueryRow {
  query: string;
  searches: number;
  zero_result: boolean;
  click_through_rate: number;
  ticket_rate: number;
  top_clicked_article: string | null;
}

export function topQueries(limit = 25): QueryRow[] {
  const map = new Map<
    string,
    {
      searches: number;
      zero_result_count: number;
      clicks: number;
      tickets: number;
      clickedCounts: Map<string, number>;
    }
  >();
  for (const s of searches) {
    let row = map.get(s.query);
    if (!row) {
      row = {
        searches: 0,
        zero_result_count: 0,
        clicks: 0,
        tickets: 0,
        clickedCounts: new Map(),
      };
      map.set(s.query, row);
    }
    row.searches += 1;
    if (s.result_count === 0) row.zero_result_count += 1;
    if (s.clicked_article_id) {
      row.clicks += 1;
      row.clickedCounts.set(
        s.clicked_article_id,
        (row.clickedCounts.get(s.clicked_article_id) ?? 0) + 1
      );
    }
    if (s.led_to_ticket) row.tickets += 1;
  }
  return [...map.entries()]
    .map(([query, r]) => {
      let top: string | null = null;
      let topCount = 0;
      for (const [aid, c] of r.clickedCounts) {
        if (c > topCount) {
          top = aid;
          topCount = c;
        }
      }
      return {
        query,
        searches: r.searches,
        zero_result: r.zero_result_count === r.searches,
        click_through_rate: r.searches > 0 ? r.clicks / r.searches : 0,
        ticket_rate: r.searches > 0 ? r.tickets / r.searches : 0,
        top_clicked_article: top,
      };
    })
    .sort((a, b) => b.searches - a.searches)
    .slice(0, limit);
}

export function totals() {
  const escalated = tickets.filter(
    (t) => t.resolution === 'escalated_to_eng'
  ).length;
  const zeroResult = searches.filter((s) => s.result_count === 0).length;
  const ledToTicket = searches.filter((s) => s.led_to_ticket).length;
  return {
    articles: articles.length,
    tickets: tickets.length,
    searches: searches.length,
    escalated,
    escalation_rate: tickets.length > 0 ? escalated / tickets.length : 0,
    zero_result_searches: zeroResult,
    zero_result_rate: searches.length > 0 ? zeroResult / searches.length : 0,
    led_to_ticket: ledToTicket,
    deflection_rate: overallDeflectionRate(),
  };
}
