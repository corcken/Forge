import { Table2, Zap } from 'lucide-react';
import { OriginBadge } from '../components/badges/OriginBadge';
import { HighDensityTreeGrid } from '../components/tree/HighDensityTreeGrid';
import type { TreeGridColumn } from '../components/tree/types';
import { DEMO_HARVEST_TREE, type HarvestNode } from './harvest/demo-data';

const KIND_LABEL: Record<HarvestNode['kind'], string> = {
  series: 'Serie',
  part: 'Artikel',
  group: 'Gruppe',
  pin: 'Pin',
};

const columns: TreeGridColumn<HarvestNode>[] = [
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
  {
    id: 'origin',
    header: 'Herkunft',
    width: 80,
    align: 'center',
    render: (node) => (node.origin ? <OriginBadge origin={node.origin} /> : null),
  },
  { id: 'voltage', header: 'Spannung (V)', width: 100, numeric: true, render: (n) => n.voltage ?? '–' },
  { id: 'current', header: 'Strom (A)', width: 90, numeric: true, render: (n) => n.current ?? '–' },
  { id: 'torque', header: 'Drehmoment (Nm)', width: 120, numeric: true, render: (n) => n.torque ?? '–' },
];

function HoverContent({ node }: { node: HarvestNode }) {
  return (
    <div className="space-y-1">
      <div className="select-all font-mono text-[12px] text-slate-100">{node.name}</div>
      <div className="text-[11px] text-slate-300">
        {KIND_LABEL[node.kind]} · Status {node.status}
      </div>
      <div className="text-[11px] text-slate-300">{node.note}</div>
      {node.origin ? (
        <div className="pt-1">
          <OriginBadge origin={node.origin} />
        </div>
      ) : null}
    </div>
  );
}

/** Harvest- & Compiler-Grid (Meilenstein 5: 24px-Demo-Baum, M6: Live-Daten). */
export function HarvestGridView() {
  return (
    <HighDensityTreeGrid<HarvestNode>
      data={DEMO_HARVEST_TREE}
      columns={columns}
      getSubRows={(node) => node.subItems}
      getRowName={(node) => node.name}
      getRowStatus={(node) => node.status}
      getRowIcon={(node) =>
        node.kind === 'pin' ? (
          <Zap className="h-3.5 w-3.5" />
        ) : node.kind === 'group' ? (
          <Table2 className="h-3.5 w-3.5" />
        ) : null
      }
      storageKey="harvest"
      title="Harvest & Compiler Grid"
      selectable
      renderHoverCard={(node) => <HoverContent node={node} />}
      toolbarRight={
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          Demo-Daten · Live-Anbindung in M6
        </span>
      }
      footerRight={<span>Run: run_001 · Status: VALIDATED</span>}
    />
  );
}
