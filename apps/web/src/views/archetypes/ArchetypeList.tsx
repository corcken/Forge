import { Zap } from 'lucide-react';
import { trpc } from '../../lib/trpc';

export interface ArchetypeListProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/** Linke 24px-Liste aller IEC-Archetypen. */
export function ArchetypeList({ selectedId, onSelect }: ArchetypeListProps) {
  const archetypes = trpc.archetypes.list.useQuery();
  const rows = archetypes.data ?? [];
  return (
    <div className="flex h-full min-h-0 flex-col border-r border-slate-200 dark:border-slate-800">
      <div className="flex h-[24px] min-h-[24px] items-center border-b-2 border-slate-300 bg-slate-100 px-2 text-[12px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
        IEC-Archetypen ({rows.length})
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {rows.map((archetype) => (
          <button
            key={archetype.id}
            type="button"
            onClick={() => onSelect(archetype.id)}
            className={`flex h-[24px] w-full items-center gap-2 border-b border-slate-200 px-2 text-left text-[12px] dark:border-slate-800 ${
              archetype.id === selectedId
                ? 'bg-blue-50/80 font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                : 'text-slate-700 hover:bg-slate-100/70 dark:text-slate-200 dark:hover:bg-slate-800/50'
            }`}
          >
            <Zap className="h-3.5 w-3.5 shrink-0 text-slate-500" />
            <span className="truncate">{archetype.id}</span>
            <span className="ml-auto font-mono text-[10px] text-slate-400">
              {archetype.defaultBmkPrefix}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
