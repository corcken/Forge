import { Cpu, FolderTree, Sparkles, Table2, Trash2, Zap } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { HighDensityTreeGrid } from '../components/tree/HighDensityTreeGrid';
import { useActiveRunId } from '../hooks/useActiveRun';
import { trpc } from '../lib/trpc';
import { BTN, INPUT, NUMERIC } from '../lib/ui';
import { DualInspectorPanel } from './harvest/DualInspectorPanel';
import { HARVEST_COLUMNS, HarvestHoverContent } from './harvest/harvest-columns';
import { buildHarvestNodes, type HarvestNode } from './harvest/harvest-nodes';

/** Harvest- & Compiler-Grid mit Batch-Aktionen und Dual-Inspector. */
export function HarvestGridView() {
  const runId = useActiveRunId();
  const utils = trpc.useUtils();
  const tree = trpc.compiler.tree.useQuery({ runId: runId ?? '' }, { enabled: runId !== null });
  const models = trpc.ai.models.list.useQuery({});
  const [modelKey, setModelKey] = useState('');
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  const invalidate = (): void => {
    void utils.compiler.tree.invalidate();
    void utils.compiler.getCompiled.invalidate();
    void utils.compiler.listParts.invalidate();
    void utils.queue.status.invalidate();
  };
  const extract = trpc.queue.startExtraction.useMutation({
    onMutate: () => void utils.queue.status.invalidate(),
    onSuccess: invalidate,
    onSettled: () => void utils.queue.status.invalidate(),
  });
  const compileBatch = trpc.compiler.compileParts.useMutation({ onSuccess: invalidate });
  const reclassify = trpc.categories.reclassify.useMutation({ onSuccess: invalidate });
  const removeBatch = trpc.parts.removeMany.useMutation({
    onSuccess: () => {
      setSelected([]);
      setActiveNodeId(null);
      invalidate();
      void utils.runs.list.invalidate();
    },
  });

  const { nodes, lookup } = useMemo(
    () => buildHarvestNodes(tree.data ?? []),
    [tree.data],
  );

  const activePartId = activeNodeId ? (lookup.get(activeNodeId)?.partId ?? null) : null;
  const selectedPartIds = useMemo(() => {
    const ids = new Set<string>();
    for (const id of selected) {
      const entry = lookup.get(id);
      if (entry?.kind === 'part' && entry.partId) ids.add(entry.partId);
      else if (entry?.kind === 'series' && entry.partIds) {
        for (const pId of entry.partIds) ids.add(pId);
      }
    }
    return Array.from(ids);
  }, [selected, lookup]);

  const activeModels = (models.data ?? []).filter((model) => model.isActive);
  const providerId = modelKey.includes(':') ? modelKey.slice(0, modelKey.indexOf(':')) : '';
  const modelId = modelKey.includes(':') ? modelKey.slice(modelKey.indexOf(':') + 1) : '';

  const batchBar: ReactNode = (
    <div className="flex items-center gap-1">
      <select className={INPUT} value={modelKey} onChange={(event) => setModelKey(event.target.value)}>
        <option value="">KI-Modell wählen...</option>
        {activeModels.map((model) => (
          <option key={model.id} value={model.id}>
            {model.id}
          </option>
        ))}
      </select>
      <button
        type="button"
        className={BTN}
        disabled={!runId || selectedPartIds.length === 0 || !modelKey || extract.isPending}
        onClick={() => runId && extract.mutate({ runId, partIds: selectedPartIds, providerId, modelId })}
      >
        <Sparkles className="mr-1 inline h-3 w-3 text-indigo-500" />
        {extract.isPending ? `Extrahiere (${selectedPartIds.length})...` : 'Ausgewählte mit KI extrahieren'}
      </button>
      <button
        type="button"
        className={BTN}
        disabled={!runId || compileBatch.isPending}
        onClick={() => runId && compileBatch.mutate({ runId, partIds: selectedPartIds })}
      >
        <Cpu className="mr-1 inline h-3 w-3 text-amber-500" />
        {compileBatch.isPending ? 'Kompiliere...' : 'Ausgewählte kompilieren'}
      </button>
      <button
        type="button"
        className={BTN}
        disabled={!runId || reclassify.isPending}
        onClick={() => runId && reclassify.mutate({ runId })}
        title="Alle validierten Artikel dieses Runs deterministisch in den 4-stufigen Kategoriebaum einordnen"
      >
        <FolderTree className="mr-1 inline h-3 w-3 text-cyan-500" />
        {reclassify.isPending ? 'Klassifiziere...' : 'Kategorien zuordnen'}
      </button>
      <button
        type="button"
        className={BTN}
        disabled={!runId || selectedPartIds.length === 0 || removeBatch.isPending}
        onClick={() => {
          if (
            runId &&
            window.confirm(`${selectedPartIds.length} ausgewählte Artikel aus dem Run löschen?`)
          ) {
            removeBatch.mutate({ runId, partIds: selectedPartIds });
          }
        }}
        title="Ausgewählte Artikel aus dem Run löschen"
      >
        <Trash2 className="mr-1 inline h-3 w-3 text-rose-500" />
        Löschen ({selectedPartIds.length})
      </button>
    </div>
  );

  if (!runId) {
    return (
      <div className="flex h-full items-center justify-center text-[12px] text-slate-400">
        Kein aktiver Run. Bitte im Run-Manager einen Run anlegen und aktivieren.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <HighDensityTreeGrid<HarvestNode>
          data={nodes}
          columns={HARVEST_COLUMNS}
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
          renderHoverCard={(node) => <HarvestHoverContent node={node} />}
          toolbarRight={batchBar}
          footerRight={
            <span className={`${NUMERIC} text-[11px]`}>Ausgewählt: {selectedPartIds.length} Artikel</span>
          }
          onActiveChange={setActiveNodeId}
          onSelectionChange={setSelected}
        />
      </div>
      {activePartId ? (
        <div className="w-[380px] min-w-[380px]">
          <DualInspectorPanel runId={runId} partId={activePartId} />
        </div>
      ) : null}
    </div>
  );
}
