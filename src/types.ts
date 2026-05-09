export interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  category_label: string;
  last_updated: string;
  body_word_count: number;
  view_count: number;
  is_weak: boolean;
}

export interface Ticket {
  id: string;
  subject: string;
  body_excerpt: string;
  category: string;
  created_at: string;
  resolved_at: string;
  linked_article_ids: string[];
  resolution: 'agent_resolved' | 'escalated_to_eng';
}

export interface Search {
  id: string;
  query: string;
  timestamp: string;
  result_count: number;
  clicked_article_id: string | null;
  led_to_ticket: boolean;
}

export interface ArticlePerformance {
  article: Article;
  click_throughs: number;
  tickets_touching: number;
  deflected: number;
  deflection_rate: number;
}

export type ViewKey = 'health' | 'gaps' | 'performance' | 'vocabulary';
