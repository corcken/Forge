import type { LucideIcon } from 'lucide-react';
import { ROW_HEIGHT_PX, SIDEBAR_INDENT_PX, SIDEBAR_WIDTH_PX } from '../../lib/constants';

export interface NavView {
  id: string;
  label: string;
  icon: LucideIcon;
}

export interface SideNavProps {
  views: NavView[];
  activeViewId: string;
  onSelectView: (id: string) => void;
}

/** Linke Navigations-Sidebar (w-[220px], 24px Zeilen, 12px Einrueckung). */
export function SideNav({ views, activeViewId, onSelectView }: SideNavProps) {
  return (
    <nav
      style={{ width: `${SIDEBAR_WIDTH_PX}px` }}
      className="flex h-full flex-col border-r border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex h-[32px] min-h-[32px] items-center border-b border-slate-200 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800">
        Navigation
      </div>
      <div className="py-1">
        {views.map((view) => {
          const Icon = view.icon;
          const active = view.id === activeViewId;
          return (
            <button
              key={view.id}
              type="button"
              onClick={() => onSelectView(view.id)}
              style={{ height: ROW_HEIGHT_PX, paddingLeft: SIDEBAR_INDENT_PX + 8 }}
              className={`flex w-full items-center gap-2 pr-2 text-left text-[13px] ${
                active
                  ? 'bg-blue-50/80 font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                  : 'text-slate-700 hover:bg-slate-100/70 dark:text-slate-200 dark:hover:bg-slate-800/50'
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate tracking-tight">{view.label}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-auto border-t border-slate-200 px-2 py-1 text-[10px] text-slate-400 dark:border-slate-800">
        Descriptio Forge v0.1.0
      </div>
    </nav>
  );
}
