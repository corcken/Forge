import type { ReactNode } from 'react';
import { SideNav, type NavView } from './SideNav';
import { TopRunBar } from './TopRunBar';

export interface AppShellProps {
  views: NavView[];
  activeViewId: string;
  onSelectView: (id: string) => void;
  children: ReactNode;
}

/** Grundgeruest der App: 32px Kopfzeile + 220px Sidebar + Inhaltsbereich. */
export function AppShell({ views, activeViewId, onSelectView, children }: AppShellProps) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <TopRunBar />
      <div className="flex min-h-0 flex-1">
        <SideNav views={views} activeViewId={activeViewId} onSelectView={onSelectView} />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white dark:bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
