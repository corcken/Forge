import { OriginBadge } from '../../components/badges/OriginBadge';
import type { TreeGridColumn } from '../../components/tree/types';
import { KIND_LABEL, type HarvestNode } from './harvest-nodes';

/** Datenspalten des Harvest-Grids (ohne Status-/Checkbox-/Hierarchiespalte). */
export const HARVEST_COLUMNS: TreeGridColumn<HarvestNode>[] = [
  {
    id: 'kind',
    header: 'Typ',
    width: 80,
    align: 'center',
    render: (node) => (
      <span className="rounded bg-slate-100 px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        {KIND_LABEL[node.kind]}
      </span>
    ),
  },
  { id: 'archetype', header: 'Archetyp', width: 190, render: (node) => node.archetypeId ?? '' },
  {
    id: 'quality',
    header: 'Qualität',
    width: 90,
    align: 'center',
    render: (node) => node.qualityTier ?? '',
  },
  {
    id: 'completeness',
    header: 'Vollständig %',
    width: 120,
    numeric: true,
    render: (node) => (node.completeness === undefined ? '' : node.completeness),
  },
  {
    id: 'origin',
    header: 'Herkunft',
    width: 90,
    align: 'center',
    render: (node) => (node.origin ? <OriginBadge origin={node.origin} /> : null),
  },
];

/** Inhalt der 600ms-Hoverkarte einer Harvest-Zeile. */
export function HarvestHoverContent({ node }: { node: HarvestNode }) {
  return (
    <div className="space-y-1">
      <div className="select-all font-mono text-[12px] text-slate-100">{node.name}</div>
      <div className="text-[11px] text-slate-300">
        {KIND_LABEL[node.kind]} · Status {node.status}
        {node.archetypeId ? ` · ${node.archetypeId}` : ''}
      </div>
      {node.origin ? (
        <div className="pt-1">
          <OriginBadge origin={node.origin} />
        </div>
      ) : null}
    </div>
  );
}
