import { useMemo } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';
import { Insight } from '../components/Insight';
import { articlePerformance } from '../data';

const fmtNumber = (n: number) => n.toLocaleString();
const fmtPercent = (n: number) => `${(n * 100).toFixed(1)}%`;

export function PerformanceView() {
  const performance = useMemo(() => articlePerformance(), []);

  // Average deflection rate (across articles with click-throughs) — for the reference line
  const avgDeflection = useMemo(() => {
    const eligible = performance.filter((p) => p.click_throughs > 0);
    return (
      eligible.reduce((s, p) => s + p.deflection_rate, 0) / eligible.length
    );
  }, [performance]);

  const scatterData = performance
    .filter((p) => p.click_throughs > 0)
    .map((p) => ({
      title: p.article.title,
      click_throughs: p.click_throughs,
      deflection: p.deflection_rate * 100,
      tickets: p.tickets_touching,
      is_weak: p.article.is_weak,
    }));

  const sortedByDeflection = [...performance]
    .filter((p) => p.click_throughs > 0)
    .sort((a, b) => a.deflection_rate - b.deflection_rate);

  return (
    <section>
      <header className="view-header">
        <h2>Article performance</h2>
        <p>
          The crucial signal: high views but low deflection means people are
          reading the article and still filing tickets. Two articles
          (<em>Notes Overview</em>, <em>Watering Cadence Chart Overview</em>)
          were assessed as plausibly weak before generation; the data should
          surface that.
        </p>
      </header>

      <div className="card">
        <h3>Click-throughs vs deflection rate</h3>
        <p className="card__lead">
          Each dot is one article. Articles below the dotted line deflect less
          than the average — those are the ones to scrutinize.
        </p>
        <div className="chart-wrap chart-wrap--tall">
          <ResponsiveContainer>
            <ScatterChart margin={{ top: 16, right: 24, left: 8, bottom: 16 }}>
              <CartesianGrid stroke="#e5dcc5" strokeDasharray="3 4" />
              <XAxis
                type="number"
                dataKey="click_throughs"
                name="Click-throughs"
                tickLine={false}
                axisLine={{ stroke: '#d2c5a3' }}
                label={{
                  value: 'Click-throughs from search',
                  position: 'insideBottom',
                  offset: -8,
                  style: { fill: '#6b6359', fontSize: 12 },
                }}
              />
              <YAxis
                type="number"
                dataKey="deflection"
                name="Deflection %"
                domain={[80, 100]}
                tickLine={false}
                axisLine={{ stroke: '#d2c5a3' }}
                tickFormatter={(v) => `${v.toFixed(0)}%`}
                label={{
                  value: 'Deflection rate',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: '#6b6359', fontSize: 12 },
                }}
              />
              <ZAxis range={[120, 120]} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const d = payload[0]?.payload as
                    | (typeof scatterData)[number]
                    | undefined;
                  if (!d) return null;
                  return (
                    <div
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border-strong)',
                        borderRadius: 6,
                        padding: '0.55rem 0.75rem',
                        fontSize: '0.85rem',
                        boxShadow: 'var(--shadow)',
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>
                        {d.title}
                        {d.is_weak && (
                          <span className="flag flag--weak">Weak</span>
                        )}
                      </div>
                      <div>Click-throughs: {fmtNumber(d.click_throughs)}</div>
                      <div>Deflection: {d.deflection.toFixed(1)}%</div>
                      <div>Tickets touching: {fmtNumber(d.tickets)}</div>
                    </div>
                  );
                }}
              />
              <ReferenceLine
                y={avgDeflection * 100}
                stroke="#948974"
                strokeDasharray="4 4"
                label={{
                  value: `avg ${(avgDeflection * 100).toFixed(1)}%`,
                  position: 'right',
                  style: { fill: '#6b6359', fontSize: 11 },
                }}
              />
              <Scatter data={scatterData}>
                {scatterData.map((d) => (
                  <Cell
                    key={d.title}
                    fill={d.is_weak ? '#c5793a' : '#6e8e5a'}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <Insight variant="warn">
          <p>
            Both pre-flagged weak articles fall below the average deflection
            line. The 5–10 percentage-point gap is the low-deflection signal —
            heavily-trafficked articles where the reader still files a ticket
            after reading. The actionable response is targeted: rewrite the two
            articles against the gap subjects in the table below, not a
            wholesale KB overhaul.
          </p>
        </Insight>
      </div>

      <div className="card" style={{ marginTop: '1.2rem' }}>
        <h3>Per-article performance</h3>
        <p className="card__lead">
          Sorted by deflection rate, lowest first. Numbers come from the seeded
          window.
        </p>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Article</th>
                <th>Category</th>
                <th className="num">Views</th>
                <th className="num">Click-throughs</th>
                <th className="num">Tickets</th>
                <th className="num">Deflection</th>
              </tr>
            </thead>
            <tbody>
              {sortedByDeflection.map((p) => (
                <tr key={p.article.id} className={p.article.is_weak ? 'weak' : ''}>
                  <td>
                    {p.article.title}
                    {p.article.is_weak && (
                      <span className="flag flag--weak">Weak</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {p.article.category_label}
                  </td>
                  <td className="num">{fmtNumber(p.article.view_count)}</td>
                  <td className="num">{fmtNumber(p.click_throughs)}</td>
                  <td className="num">{fmtNumber(p.tickets_touching)}</td>
                  <td className="num">
                    <strong>{fmtPercent(p.deflection_rate)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.2rem' }}>
        <h3>What the weak articles fail to answer</h3>
        <p className="card__lead">
          Gap subjects baked into the seed for the two flagged articles. These
          come from honest assessment of where each article assumes too much
          context.
        </p>
        <div className="grid grid--two">
          <GapList
            title="Notes Overview"
            issues={[
              "Doesn't explain why notes matter before showing how",
              'Assumes context about what a note should contain',
              'Emoji glyph-key works as lookup, doesn\'t teach intent',
            ]}
            gaps={[
              'What should I put in a note?',
              "Why doesn't my note save?",
              'Can I attach a note to a specific watering?',
              'How can I attach a note to a photo?',
            ]}
          />
          <GapList
            title="Watering Cadence Chart Overview"
            issues={[
              'Short, terminology-heavy',
              'Uses "cadence" before defining it',
              "Doesn't absorb the schedule-vs-cadence distinction taught elsewhere",
            ]}
            gaps={[
              'What does the average days number mean?',
              'Why is my chart empty?',
              'How do I export the chart?',
              "What's the difference between cadence and schedule?",
            ]}
          />
        </div>
        <Insight>
          <p>
            Two of the gap subjects under <em>Cadence Chart</em> point to a
            content-merge opportunity rather than a rewrite — the
            schedule-vs-cadence distinction is taught in <em>Changing a
            plant's watering schedule</em> but the chart article doesn't absorb
            it. That's the kind of cross-article structural fix only an analytics
            loop will surface.
          </p>
        </Insight>
      </div>
    </section>
  );
}

function GapList({
  title,
  issues,
  gaps,
}: {
  title: string;
  issues: string[];
  gaps: string[];
}) {
  return (
    <div>
      <h4 style={{ color: 'var(--terracotta-dark)', marginBottom: '0.6rem' }}>
        {title}
      </h4>
      <p
        style={{
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          marginBottom: '0.4rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontWeight: 600,
        }}
      >
        Where the article falls short
      </p>
      <ul style={{ paddingLeft: '1.1rem', margin: '0 0 0.9rem' }}>
        {issues.map((i) => (
          <li
            key={i}
            style={{ fontSize: '0.92rem', marginBottom: '0.2rem' }}
          >
            {i}
          </li>
        ))}
      </ul>
      <p
        style={{
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          marginBottom: '0.4rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontWeight: 600,
        }}
      >
        Tickets representing the gap
      </p>
      <ul style={{ paddingLeft: '1.1rem', margin: 0 }}>
        {gaps.map((g) => (
          <li
            key={g}
            style={{ fontSize: '0.92rem', marginBottom: '0.2rem' }}
          >
            <em>{g}</em>
          </li>
        ))}
      </ul>
    </div>
  );
}
