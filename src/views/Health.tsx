import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Stat } from '../components/Stat';
import { Insight } from '../components/Insight';
import { totals, monthlyVolume, articlePerformance } from '../data';

const fmtNumber = (n: number) => n.toLocaleString();
const fmtPercent = (n: number) => `${(n * 100).toFixed(1)}%`;

export function HealthView() {
  const t = totals();
  const monthly = monthlyVolume();
  const performance = articlePerformance()
    .slice()
    .sort((a, b) => b.article.view_count - a.article.view_count)
    .slice(0, 5);

  return (
    <section>
      <header className="view-header">
        <h2>Health snapshot</h2>
        <p>
          Establishes context. How big is the KB, how busy is support, and what
          fraction of search traffic finds what it's looking for.
        </p>
      </header>

      <div className="grid grid--stats">
        <Stat label="Articles published" value={fmtNumber(t.articles)} />
        <Stat
          label="Tickets (9 mo.)"
          value={fmtNumber(t.tickets)}
          hint={`${fmtPercent(t.escalation_rate)} escalated to engineering`}
        />
        <Stat
          label="Searches (9 mo.)"
          value={fmtNumber(t.searches)}
          hint={`${fmtPercent(t.zero_result_rate)} return zero results`}
        />
        <Stat
          label="Modeled deflection"
          value={fmtPercent(t.deflection_rate)}
          hint="of click-throughs did not file a ticket"
        />
      </div>

      <div className="card definitions-card">
        <h3>How to read these numbers</h3>
        <p className="card__lead">
          Three terms recur across every view. The definitions matter because
          the same data answers different questions depending on which subset
          you're counting.
        </p>
        <dl className="definitions">
          <dt>Click-through</dt>
          <dd>
            A search where the user clicked one of the article results.
            Clicking is the first signal that a user found something they
            thought might help — distinct from searches that returned results
            and were abandoned, and from searches that returned nothing at all.
          </dd>

          <dt>Deflection rate</dt>
          <dd>
            Of click-throughs to a given article (or across the KB), the
            fraction where the user did <em>not</em> file a ticket in the
            following 72-hour window. Higher is better: they read the article
            and didn't need support. Computed as{' '}
            <code>1 − (click-throughs that led to a ticket ÷ total
            click-throughs)</code>.
          </dd>

          <dt>Led to ticket</dt>
          <dd>
            A search the seed marks as the trigger for a follow-on ticket —
            i.e., a ticket was filed within 72 hours of the search from the
            same session. The inverse of a deflected click-through, and the
            mechanism that lets the dashboard model deflection at all without
            faking it.
          </dd>
        </dl>
        <p className="definitions__note">
          Zero-result searches are excluded from deflection — by definition
          they have nothing to read, so there's no article to credit or
          blame. Their signal lives in <em>Content gaps</em> instead.
        </p>
      </div>

      <div className="card" style={{ marginTop: '1.2rem' }}>
        <h3>Ticket and search volume by month</h3>
        <p className="card__lead">
          Two peaks: winter panic (Dec–Feb) and spring active-care
          (Mar–Apr). Late summer is the trough.
        </p>
        <div className="chart-wrap">
          <ResponsiveContainer>
            <LineChart
              data={monthly}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid stroke="#e5dcc5" strokeDasharray="3 4" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: '#d2c5a3' }} />
              <YAxis
                yAxisId="tickets"
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <YAxis
                yAxisId="searches"
                orientation="right"
                tickLine={false}
                axisLine={false}
                width={50}
              />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="tickets"
                type="monotone"
                dataKey="tickets"
                name="Tickets"
                stroke="#c5793a"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              <Line
                yAxisId="searches"
                type="monotone"
                dataKey="searches"
                name="Searches"
                stroke="#6e8e5a"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid--two" style={{ marginTop: '1.2rem' }}>
        <div className="card">
          <h3>Top-viewed articles</h3>
          <p className="card__lead">
            Where the KB's traffic concentrates. Two of the top five are flagged
            as plausibly weak — see Article performance.
          </p>
          <table className="data">
            <thead>
              <tr>
                <th>Article</th>
                <th className="num">Views</th>
                <th className="num">Deflection</th>
              </tr>
            </thead>
            <tbody>
              {performance.map((p) => (
                <tr key={p.article.id} className={p.article.is_weak ? 'weak' : ''}>
                  <td>
                    {p.article.title}
                    {p.article.is_weak && <span className="flag flag--weak">Weak</span>}
                  </td>
                  <td className="num">{fmtNumber(p.article.view_count)}</td>
                  <td className="num">
                    {p.click_throughs > 0 ? fmtPercent(p.deflection_rate) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>Resolution mix</h3>
          <p className="card__lead">
            How tickets close. Escalation cluster around the four zero-result
            feature requests and the two weak articles.
          </p>
          <div style={{ marginTop: '0.5rem' }}>
            <ResolutionBar
              label="Agent resolved"
              count={t.tickets - t.escalated}
              total={t.tickets}
              color="var(--sage)"
            />
            <ResolutionBar
              label="Escalated to engineering"
              count={t.escalated}
              total={t.tickets}
              color="var(--terracotta)"
            />
          </div>
          <p
            style={{
              marginTop: '1.1rem',
              color: 'var(--text-muted)',
              fontSize: '0.88rem',
            }}
          >
            Total: {fmtNumber(t.tickets)} tickets across the {monthly.length}-month window.
          </p>
        </div>
      </div>

      <Insight>
        <p>
          The KB is small (14 articles), the support load is modest (low
          hundreds of tickets over nine months), and clickthrough deflection is
          healthy in aggregate. The interesting story isn't the headline rate —
          it's which queries never find an article (Content gaps), which
          articles fail their click-throughs (Article performance), and what
          users actually type when they search (Vocabulary &amp; findability).
        </p>
      </Insight>
    </section>
  );
}

function ResolutionBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ marginBottom: '0.85rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.88rem',
          marginBottom: '0.3rem',
        }}
      >
        <span>{label}</span>
        <span style={{ color: 'var(--text-muted)' }}>
          {fmtNumber(count)} ({pct.toFixed(1)}%)
        </span>
      </div>
      <div
        style={{
          height: 8,
          background: 'var(--surface-2)',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: color,
            borderRadius: 4,
          }}
        />
      </div>
    </div>
  );
}
