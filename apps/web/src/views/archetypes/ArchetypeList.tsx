import { Plus, Zap } from 'lucide-react';
import { useState } from 'react';
import { trpc } from '../../lib/trpc';
import { BTN, INPUT } from '../../lib/ui';

export interface ArchetypeListProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/** Linke 24px-Liste aller IEC-Archetypen inkl. Schnell-Anlage. */
export function ArchetypeList({ selectedId, onSelect }: ArchetypeListProps) {
  const utils = trpc.useUtils();
  const archetypes = trpc.archetypes.list.useQuery();
  const [newId, setNewId] = useState('');
  const [search, setSearch] = useState('');
  const upsert = trpc.archetypes.upsert.useMutation({
    onSuccess: (_data, vars) => {
      void utils.archetypes.list.invalidate();
      onSelect(vars.archetype.id);
      setNewId('');
    },
  });

  const allRows = archetypes.data ?? [];
  const query = search.trim().toLowerCase();
  const rows = query
    ? allRows.filter(
        (item) =>
          item.id.toLowerCase().includes(query) ||
          item.name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query),
      )
    : allRows;
  const cleanId = newId.trim().toUpperCase().replace(/[^A-Z0-9_]/gu, '_');

  const createArchetype = (): void => {
    if (!cleanId) return;
    upsert.mutate({
      archetype: {
        id: cleanId,
        name: cleanId,
        category: 'SWITCHGEAR',
        defaultBmkPrefix: 'Q',
        mountingTypeDefault: 'DIN_RAIL',
        functionGroupsTemplate: [],
        updatedAt: null,
      },
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col border-r border-slate-200 dark:border-slate-800">
      <div className="flex h-[24px] min-h-[24px] items-center border-b-2 border-slate-300 bg-slate-100 px-2 text-[12px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
        IEC-Archetypen ({rows.length} / {allRows.length})
      </div>
      <div className="flex h-[28px] min-h-[28px] items-center gap-1 border-b border-slate-200 bg-slate-50 px-1.5 dark:border-slate-800 dark:bg-slate-900">
        <input
          className={`${INPUT} flex-1 text-[11px]`}
          placeholder="Archetypen filtern (z.B. MAIN_SWITCH, MSS, TERMINAL)..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      <div className="flex h-[28px] min-h-[28px] items-center gap-1 border-b border-slate-200 bg-slate-50 px-1.5 dark:border-slate-800 dark:bg-slate-900">
        <input
          className={`${INPUT} flex-1 font-mono text-[11px]`}
          placeholder="NEUE_ARCHETYP_ID"
          value={newId}
          onChange={(event) => setNewId(event.target.value)}
        />
        <button
          type="button"
          className={BTN}
          disabled={!cleanId}
          onClick={createArchetype}
          title="Neuen Archetyp anlegen"
        >
          <Plus className="mr-0.5 inline h-3 w-3" />
          Neu
        </button>
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
            <span className="truncate font-mono text-[11px]">{archetype.id}</span>
            <span className="ml-auto font-mono text-[10px] text-slate-400">
              {archetype.defaultBmkPrefix}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
