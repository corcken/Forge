import { Search } from 'lucide-react';
import { useState } from 'react';
import { formatNumber } from '../../lib/format';
import { trpc } from '../../lib/trpc';
import { ADMIN_TD, ADMIN_TH, ADMIN_TOOLBAR, INPUT, NUMERIC } from '../../lib/ui';
import type { AiTaskType } from '@descriptio-forge/shared';

const TASKS: { key: AiTaskType; label: string }[] = [
  { key: 'TASK_HTML_EXTRACT', label: 'HTML-Extrakt' },
  { key: 'TASK_PDF_VISION', label: 'PDF-Vision' },
  { key: 'TASK_SYMBOL_SVG', label: 'Symbol-SVG' },
];

const BADGE = 'h-[18px] rounded border px-1.5 text-[10px] font-semibold uppercase tracking-wider';
const BADGE_ON = `${BADGE} border-sky-200 bg-sky-100 text-sky-800 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-300`;
const BADGE_OFF = `${BADGE} border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500`;

/** Untere 24px-Tabelle: abgerufene Modelle mit Preisen und Task-Routing. */
export function ModelTable() {
  const utils = trpc.useUtils();
  const models = trpc.ai.models.list.useQuery({});
  const setActive = trpc.ai.models.setActive.useMutation({
    onSuccess: () => void utils.ai.models.list.invalidate(),
  });
  const setPricing = trpc.ai.models.setPricing.useMutation({
    onSuccess: () => void utils.ai.models.list.invalidate(),
  });
  const assign = trpc.ai.models.assignTasks.useMutation({
    onSuccess: () => void utils.ai.models.list.invalidate(),
  });
  const [filter, setFilter] = useState('');
  const [priceDraft, setPriceDraft] = useState<Record<string, { in?: string; out?: string }>>({});

  const rows = (models.data ?? []).filter((model) =>
    `${model.providerId} ${model.modelId}`.toLowerCase().includes(filter.toLowerCase()),
  );

  const commitPrice = (id: string, field: 'in' | 'out', other: number | null): void => {
    const raw = priceDraft[id]?.[field];
    if (raw === undefined) return;
    const parsed = raw.trim() === '' ? null : Number(raw);
    if (Number.isNaN(parsed)) return;
    const inPrice = field === 'in' ? parsed : other;
    const outPrice = field === 'out' ? parsed : other;
    setPricing.mutate({ modelId: id, inputPricePer1m: inPrice, outputPricePer1m: outPrice });
    setPriceDraft((prev) => ({ ...prev, [id]: {} }));
  };

  const toggleTask = (modelId: string, current: AiTaskType[], task: AiTaskType): void => {
    const tasks = current.includes(task)
      ? current.filter((entry) => entry !== task)
      : [...current, task];
    assign.mutate({ modelId, tasks });
  };

  return (
    <div className="flex min-h-0 flex-col">
      <div className={ADMIN_TOOLBAR}>
        <span className="font-semibold text-slate-700 dark:text-slate-200">Modelle</span>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            className={`${INPUT} w-[220px] pl-7`}
            placeholder="Filter..."
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
        </div>
        <span className="text-[11px] text-slate-500">{rows.length} Modelle</span>
      </div>
      <div className="flex">
        <div className={ADMIN_TH} style={{ width: 44 }}>
          Aktiv
        </div>
        <div className={`${ADMIN_TH} flex-1`}>Modell</div>
        <div className={ADMIN_TH} style={{ width: 110 }}>
          Provider
        </div>
        <div className={ADMIN_TH} style={{ width: 110, justifyContent: 'flex-end' }}>
          Context
        </div>
        <div className={ADMIN_TH} style={{ width: 110, justifyContent: 'flex-end' }}>
          In $/1M
        </div>
        <div className={ADMIN_TH} style={{ width: 110, justifyContent: 'flex-end' }}>
          Out $/1M
        </div>
        <div className={ADMIN_TH} style={{ width: 260 }}>
          Task-Routing
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {rows.map((model) => {
          const draft = priceDraft[model.id] ?? {};
          return (
            <div key={model.id} data-testid="model-row" className="flex">
              <div className={`${ADMIN_TD} justify-center`} style={{ width: 44 }}>
                <input
                  type="checkbox"
                  checked={model.isActive}
                  onChange={() => setActive.mutate({ modelId: model.id, active: !model.isActive })}
                  className="h-[14px] w-[14px] cursor-pointer accent-sky-600"
                />
              </div>
              <div className={`${ADMIN_TD} flex-1`}>
                <span className="truncate font-mono text-[11px]">{model.modelId}</span>
              </div>
              <div className={ADMIN_TD} style={{ width: 110 }}>
                {model.providerId}
              </div>
              <div className={ADMIN_TD} style={{ width: 110, justifyContent: 'flex-end' }}>
                <span className={NUMERIC}>{formatNumber(model.contextWindow, 0)}</span>
              </div>
              <div className={`${ADMIN_TD} ${NUMERIC}`} style={{ width: 110 }}>
                <input
                  className={`${INPUT} w-full text-right font-mono`}
                  value={draft.in ?? (model.inputPricePer1m ?? '')}
                  onChange={(event) =>
                    setPriceDraft((prev) => ({
                      ...prev,
                      [model.id]: { ...prev[model.id], in: event.target.value },
                    }))
                  }
                  onBlur={() => commitPrice(model.id, 'in', model.outputPricePer1m)}
                />
              </div>
              <div className={`${ADMIN_TD} ${NUMERIC}`} style={{ width: 110 }}>
                <input
                  className={`${INPUT} w-full text-right font-mono`}
                  value={draft.out ?? (model.outputPricePer1m ?? '')}
                  onChange={(event) =>
                    setPriceDraft((prev) => ({
                      ...prev,
                      [model.id]: { ...prev[model.id], out: event.target.value },
                    }))
                  }
                  onBlur={() => commitPrice(model.id, 'out', model.inputPricePer1m)}
                />
              </div>
              <div className={`${ADMIN_TD} gap-1`} style={{ width: 260 }}>
                {TASKS.map((task) => (
                  <button
                    key={task.key}
                    type="button"
                    onClick={() => toggleTask(model.id, model.assignedTasks, task.key)}
                    className={model.assignedTasks.includes(task.key) ? BADGE_ON : BADGE_OFF}
                  >
                    {task.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {rows.length === 0 ? (
          <div className={ADMIN_TD}>
            Keine Modelle. API-Key speichern und &bdquo;Modelle&ldquo; abrufen.
          </div>
        ) : null}
      </div>
    </div>
  );
}
