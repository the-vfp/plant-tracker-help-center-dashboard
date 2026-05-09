import { useMemo } from 'react';
import { Insight } from '../components/Insight';
import { topQueries, articlesById } from '../data';

const fmtNumber = (n: number) => n.toLocaleString();
const fmtPercent = (n: number) => `${(n * 100).toFixed(0)}%`;

export function VocabularyView() {
  const queries = useMemo(() => topQueries(30), []);

  // Vocabulary mismatch examples to highlight: query the user typed vs
  // the article that *would* have answered it (that they didn't find).
  const mismatchExamples: { query: string; article: string; why: string }[] = [
    {
      query: 'plant died',
      article: 'Deleting a plant',
      why: "Users describe the situation; the KB is named for the action.",
    },
    {
      query: 'water reminder',
      article: "Changing a plant's watering schedule",
      why: 'Users want a reminder feature; the KB describes a schedule.',
    },
    {
      query: 'rename plant',
      article: 'Editing a plant',
      why: 'Users name the specific edit; the KB names the surface.',
    },
    {
      query: 'transfer to new phone',
      article: 'Exporting and importing data',
      why: 'Users name the goal; the KB names the mechanism.',
    },
  ];

  return (
    <section>
      <header className="view-header">
        <h2>Vocabulary &amp; findability</h2>
        <p>
          What users actually type, and where the KB's vocabulary diverges from
          theirs. Findability isn't about more articles — it's about the
          smallest set of search terms that map a user's words to the article
          that exists.
        </p>
      </header>

      <div className="card">
        <h3>Top queries</h3>
        <p className="card__lead">
          Volume, click-through rate, and ticket rate. Zero-result queries are
          flagged. The pattern to read: high searches + high ticket rate is a
          findability problem; high searches + low click-through is a
          vocabulary problem.
        </p>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Query</th>
                <th>Top article clicked</th>
                <th className="num">Searches</th>
                <th className="num">Click-through</th>
                <th className="num">Ticket rate</th>
              </tr>
            </thead>
            <tbody>
              {queries.map((q) => {
                const top = q.top_clicked_article
                  ? articlesById.get(q.top_clicked_article)?.title
                  : null;
                return (
                  <tr key={q.query}>
                    <td>
                      <code>{q.query}</code>
                      {q.zero_result && (
                        <span className="flag flag--zero">No results</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {top ?? '—'}
                    </td>
                    <td className="num">{fmtNumber(q.searches)}</td>
                    <td className="num">
                      {q.zero_result ? '—' : fmtPercent(q.click_through_rate)}
                    </td>
                    <td className="num">
                      {q.ticket_rate > 0.1 ? (
                        <strong style={{ color: 'var(--terracotta-dark)' }}>
                          {fmtPercent(q.ticket_rate)}
                        </strong>
                      ) : (
                        fmtPercent(q.ticket_rate)
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Insight>
          <p>
            Click-through is high (&gt;90%) for almost every non-zero-result
            query — when an article exists, users find it. The volume problem
            is concentrated in the no-results rows; the quality problem is
            concentrated in the high-ticket-rate rows. Two different actions
            for two different signals.
          </p>
        </Insight>
      </div>

      <div className="card" style={{ marginTop: '1.2rem' }}>
        <h3>Vocabulary mismatch examples</h3>
        <p className="card__lead">
          Users describe the <em>situation</em>; the KB names the
          <em> action</em>. The fix is search synonyms, not new articles —
          a small alias map that catches user-language and routes it to the
          functional-language article.
        </p>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>What users type</th>
                <th>Article that would answer it</th>
                <th>Why it misses</th>
              </tr>
            </thead>
            <tbody>
              {mismatchExamples.map((m) => (
                <tr key={m.query}>
                  <td>
                    <code>{m.query}</code>
                  </td>
                  <td>{m.article}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{m.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Insight>
          <p>
            These are illustrative examples drawn from the seed's normal-query
            pool — the synthetic data deliberately uses
            user-vocabulary-to-functional-article mappings ("water plant" →
            <em> Logging a watering</em>, "transfer to new phone" →
            <em> Exporting and importing data</em>) so this view has something
            to surface. In a real KB, these would come from the search logs
            themselves; the takeaway is the analytical move, not the
            specific rows.
          </p>
        </Insight>
      </div>
    </section>
  );
}
