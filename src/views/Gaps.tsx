import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Insight } from '../components/Insight';
import { Stat } from '../components/Stat';
import {
  zeroResultBreakdown,
  unlinkedTicketSubjects,
  totals,
} from '../data';

const fmtNumber = (n: number) => n.toLocaleString();
const fmtPercent = (n: number) => `${(n * 100).toFixed(1)}%`;

// Cluster names for the zero-result rows. Order matters: vocabulary mismatches
// first, feature requests second.
const VOCAB_QUERIES = new Set([
  'is my plant dying',
  'plant dying help',
  'yellowing leaves',
  'overwatering',
  'overwatered plant',
  'save my plant',
  'drooping leaves',
  'leaves falling off',
  'leaves dropping',
]);

export function GapsView() {
  const t = totals();
  const zeroResults = zeroResultBreakdown();

  const vocab = zeroResults.filter((r) => VOCAB_QUERIES.has(r.query));
  const features = zeroResults.filter((r) => !VOCAB_QUERIES.has(r.query));

  const vocabTotal = vocab.reduce((s, r) => s + r.searches, 0);
  const featuresTotal = features.reduce((s, r) => s + r.searches, 0);
  const vocabPctOfAll = vocabTotal / t.searches;

  const unlinked = unlinkedTicketSubjects().slice(0, 12);

  return (
    <section>
      <header className="view-header">
        <h2>Content gaps</h2>
        <p>
          What users searched for and didn't find. Two distinct gap types —
          a deliberate-scope question (diagnostic queries) and a feature-vs-doc
          question (plausible features that don't exist).
        </p>
      </header>

      <div className="grid grid--stats">
        <Stat
          label="Zero-result searches"
          value={fmtNumber(t.zero_result_searches)}
          hint={`${fmtPercent(t.zero_result_rate)} of all searches`}
        />
        <Stat
          label="Diagnostic queries"
          value={fmtNumber(vocabTotal)}
          hint={`${fmtPercent(vocabPctOfAll)} of all searches — vocab mismatch cluster`}
        />
        <Stat
          label="Feature requests via search"
          value={fmtNumber(featuresTotal)}
          hint="Plausible features users assumed existed"
        />
      </div>

      <div className="card">
        <h3>Diagnostic queries — the headline gap</h3>
        <p className="card__lead">
          Emotional and symptom-based language ("is my plant dying", "yellowing
          leaves"). The KB doesn't cover plant diagnostics by deliberate scope,
          and these queries spike in winter.
        </p>
        <div className="chart-wrap chart-wrap--tall">
          <ResponsiveContainer>
            <BarChart
              data={vocab}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 30, bottom: 0 }}
            >
              <CartesianGrid stroke="#e5dcc5" horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="query"
                tickLine={false}
                axisLine={false}
                width={150}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  fmtNumber(value),
                  name === 'searches' ? 'Searches' : 'Led to ticket',
                ]}
              />
              <Bar dataKey="searches" fill="#c5793a" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <Insight variant="warn">
          <p>
            <strong>This isn't a writing problem — it's a positioning
            problem.</strong> Plant Tracker is a logging-and-practice tool;
            roughly {fmtPercent(vocabPctOfAll)} of search traffic assumes it's a
            care-and-diagnosis tool. More articles won't close this gap. The
            actionable response is a category-level answer: a boundary-setting
            "what this app is and isn't" article that names the question and
            redirects users to plant diagnostics elsewhere.
          </p>
        </Insight>
      </div>

      <div className="card" style={{ marginTop: '1.2rem' }}>
        <h3>Plausible features that don't exist</h3>
        <p className="card__lead">
          Users searched for features they assumed Plant Tracker had — and
          ~12% escalated to a ticket. Volumes are seasonal: humidity peaks in
          winter, fertilizer in spring.
        </p>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Query</th>
                <th className="num">Searches</th>
                <th className="num">Led to ticket</th>
                <th>Volume</th>
              </tr>
            </thead>
            <tbody>
              {features.map((r) => {
                const max = Math.max(...features.map((f) => f.searches));
                const pct = (r.searches / max) * 100;
                return (
                  <tr key={r.query}>
                    <td>
                      <code>{r.query}</code>
                      <span className="flag flag--zero">No results</span>
                    </td>
                    <td className="num">{fmtNumber(r.searches)}</td>
                    <td className="num">{fmtNumber(r.led_to_ticket)}</td>
                    <td>
                      <span
                        className="bar bar--warn"
                        style={{ width: `${pct}%` }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Insight>
          <p>
            Each cluster is a product-vs-doc decision waiting to be made. Pin
            notes and fertilizer reminders are real friend asks; humidity and
            plant ID surface category-convention pressure from competitors. A
            KM owner shouldn't write articles for these — a KM owner should
            route the signal to product to decide build / out-of-scope, and
            then add scope-clarifying coverage to match the decision.
          </p>
        </Insight>
      </div>

      <div className="card" style={{ marginTop: '1.2rem' }}>
        <h3>Tickets with no matching article</h3>
        <p className="card__lead">
          Subjects that arrived in support without a linked article. Diagnostic
          and feature-request subjects dominate — consistent with the
          search-side gaps above.
        </p>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Ticket subject</th>
                <th className="num">Count</th>
                <th>Volume</th>
              </tr>
            </thead>
            <tbody>
              {unlinked.map((r) => {
                const max = Math.max(...unlinked.map((x) => x.count));
                const pct = (r.count / max) * 100;
                return (
                  <tr key={r.subject}>
                    <td>{r.subject}</td>
                    <td className="num">{fmtNumber(r.count)}</td>
                    <td>
                      <span className="bar" style={{ width: `${pct}%` }} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
