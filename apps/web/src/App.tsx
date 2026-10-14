import { useState } from 'react';
import { AppShell } from './components/shell/AppShell';
import { APP_VIEWS } from './views/registry';

/** Wurzelkomponente: haelt die aktive Ansicht und rendert die AppShell. */
export function App() {
  const [activeViewId, setActiveViewId] = useState(APP_VIEWS[0]?.id ?? 'harvest');
  const active = APP_VIEWS.find((view) => view.id === activeViewId) ?? APP_VIEWS[0]!;

  return (
    <AppShell views={APP_VIEWS} activeViewId={active.id} onSelectView={setActiveViewId}>
      {active.element}
    </AppShell>
  );
}
