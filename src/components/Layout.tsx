import type { ReactNode } from 'react';
import type { ViewKey } from '../types';
import { dataWindow } from '../data';

const TABS: { key: ViewKey; label: string }[] = [
  { key: 'health', label: 'Health snapshot' },
  { key: 'gaps', label: 'Content gaps' },
  { key: 'performance', label: 'Article performance' },
  { key: 'vocabulary', label: 'Vocabulary & findability' },
];

interface Props {
  activeView: ViewKey;
  onSelect: (key: ViewKey) => void;
  children: ReactNode;
}

function formatWindow(): string {
  const fmt = (iso: string) =>
    new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });
  return `${fmt(dataWindow.start)} – ${fmt(dataWindow.end)}`;
}

export function Layout({ activeView, onSelect, children }: Props) {
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__inner">
          <div className="app-header__brand">
            <h1 className="app-header__title">
              Plant Tracker — <span className="accent">Support Analytics</span>
            </h1>
            <p className="app-header__sub">
              KB performance lens against modeled support data &middot;{' '}
              <strong>{formatWindow()}</strong>
            </p>
          </div>
          <nav className="tabs" aria-label="Dashboard views">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`tab${activeView === t.key ? ' tab--active' : ''}`}
                onClick={() => onSelect(t.key)}
                aria-current={activeView === t.key ? 'page' : undefined}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="app-main">
        <Disclosure />
        {children}
      </main>

      <footer className="app-footer">
        <div className="app-footer__inner">
          <span>
            Plant Tracker Support Analytics &middot; portfolio piece by Ellene
          </span>
          <span>
            <a href="https://github.com/the-vfp/plant-tracker-help-center-dashboard">
              Source &amp; methodology &rarr;
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}

function Disclosure() {
  return (
    <aside className="disclosure" aria-label="About this dashboard">
      <p className="disclosure__label">About this dashboard</p>
      <p className="disclosure__body">
        <strong>
          The Plant Tracker app and its 14 Help Center articles are real.
        </strong>{' '}
        The tickets and search logs in this dashboard are{' '}
        <em>modeled</em> — the product has no real support org. The modeling
        choices are documented openly in{' '}
        <a href="https://github.com/the-vfp/plant-tracker-help-center-dashboard/blob/main/methodology.md">
          methodology.md
        </a>
        . The synthetic-data caveat is treated as a feature: this writeup
        talks about which assumptions were baked in, which is itself an
        analytical demonstration.
      </p>
    </aside>
  );
}
