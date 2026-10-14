import { trpc } from '../../lib/trpc';
import { BTN, NUMERIC } from '../../lib/ui';

/** Kompakter Queue-Fortschritt (h-[24px]-Stil) fuer die Kopfzeile. */
export function QueueIndicator() {
  const utils = trpc.useUtils();
  const status = trpc.queue.status.useQuery(undefined, { refetchInterval: 1000 });
  const pause = trpc.queue.pause.useMutation({ onSuccess: () => void utils.queue.status.invalidate() });
  const resume = trpc.queue.resume.useMutation({ onSuccess: () => void utils.queue.status.invalidate() });
  const stop = trpc.queue.stop.useMutation({ onSuccess: () => void utils.queue.status.invalidate() });
  const state = status.data;

  if (!state || state.status === 'IDLE') {
    return <span className="text-[11px] text-slate-400">Queue: idle</span>;
  }

  const percent = state.total > 0 ? Math.round((state.completed / state.total) * 100) : 0;

  return (
    <span className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
      <span className={`${NUMERIC} text-[11px]`}>
        Batch: {state.completed}/{state.total} ({percent}%) · ${state.costUsd.toFixed(4)}
        {state.budgetUsd !== null ? ` / $${state.budgetUsd.toFixed(2)}` : ''}
      </span>
      {state.status === 'RUNNING' ? (
        <button type="button" className={BTN} onClick={() => pause.mutate()}>
          Pause
        </button>
      ) : state.status === 'PAUSED' ? (
        <button type="button" className={BTN} onClick={() => resume.mutate()}>
          Weiter
        </button>
      ) : null}
      {(state.status === 'RUNNING' || state.status === 'PAUSED') ? (
        <button type="button" className={BTN} onClick={() => stop.mutate()}>
          Stop
        </button>
      ) : null}
    </span>
  );
}
