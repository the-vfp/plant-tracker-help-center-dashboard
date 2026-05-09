import { useEffect, useState } from 'react';
import type { ViewKey } from './types';
import { Layout } from './components/Layout';
import { HealthView } from './views/Health';
import { GapsView } from './views/Gaps';
import { PerformanceView } from './views/Performance';
import { VocabularyView } from './views/Vocabulary';

const VALID_VIEWS: readonly ViewKey[] = [
  'health',
  'gaps',
  'performance',
  'vocabulary',
];

function viewFromHash(): ViewKey {
  const hash = window.location.hash.replace('#', '') as ViewKey;
  return VALID_VIEWS.includes(hash) ? hash : 'health';
}

export function App() {
  const [view, setView] = useState<ViewKey>(viewFromHash);

  useEffect(() => {
    const onHashChange = () => setView(viewFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleSelect = (next: ViewKey) => {
    window.location.hash = next;
    setView(next);
  };

  return (
    <Layout activeView={view} onSelect={handleSelect}>
      {view === 'health' && <HealthView />}
      {view === 'gaps' && <GapsView />}
      {view === 'performance' && <PerformanceView />}
      {view === 'vocabulary' && <VocabularyView />}
    </Layout>
  );
}
