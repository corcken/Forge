import { Bot, GitBranch, Lock, Unlock } from 'lucide-react';
import { trpc } from '../../lib/trpc';
import { QueueIndicator } from './QueueIndicator';

/** Permanente h-[32px] Kopfzeile: Run-Switcher, Fork/Lock, KI-Status. */
export function TopRunBar() {
  const utils = trpc.useUtils();
  const runsQuery = trpc.runs.list.useQuery();
  const activeQuery = trpc.runs.active.useQuery();
  const providersQuery = trpc.ai.providers.list.useQuery();

  const switchMutation = trpc.runs.switchActive.useMutation({
    onSuccess: () => {
      void utils.runs.active.invalidate();
      void utils.runs.list.invalidate();
    },
  });
  const lockMutation = trpc.runs.toggleLock.useMutation({
    onSuccess: () => {
      void utils.runs.list.invalidate();
      void utils.runs.active.invalidate();
    },
  });
  const forkMutation = trpc.runs.fork.useMutation({
    onSuccess: () => void utils.runs.list.invalidate(),
  });

  const runs = runsQuery.data ?? [];
  const active = activeQuery.data ?? null;
  const okProviders = (providersQuery.data ?? []).filter(
    (provider) => provider.lastTestStatus === 'OK',
  ).length;

  const handleFork = (): void => {
    if (!active) return;
    const name = window.prompt('Name fuer den geklonten Run:', `${active.name} (Fork)`);
    if (name && name.trim().length > 0) {
      forkMutation.mutate({ sourceRunId: active.id, newName: name.trim() });
    }
  };

  const buttonClass =
    'flex h-[22px] items-center gap-1 rounded border border-slate-200 px-2 text-[11px] text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800';

  return (
    <header className="flex h-[32px] min-h-[32px] items-center gap-2 border-b border-slate-200 bg-slate-50 px-2 dark:border-slate-800 dark:bg-slate-900">
      <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
        <GitBranch className="h-3.5 w-3.5 text-sky-600" /> Descriptio Forge
      </span>
      <div className="mx-1 h-[18px] w-px bg-slate-200 dark:bg-slate-700" />
      <select
        value={active?.id ?? ''}
        onChange={(event) => {
          if (event.target.value) switchMutation.mutate({ runId: event.target.value });
        }}
        className="h-[22px] max-w-[240px] rounded border border-slate-200 bg-white px-1 text-[12px] font-medium text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      >
        <option value="" disabled>
          {runs.length > 0 ? 'Run waehlen...' : 'Kein Run vorhanden'}
        </option>
        {runs.map((run) => (
          <option key={run.id} value={run.id}>
            {run.name}
            {run.isLocked ? ' [locked]' : ''}
          </option>
        ))}
      </select>
      <button type="button" onClick={handleFork} disabled={!active} className={buttonClass}>
        <GitBranch className="h-3.5 w-3.5" /> Run klonen
      </button>
      <button
        type="button"
        onClick={() => active && lockMutation.mutate({ runId: active.id })}
        disabled={!active}
        className={buttonClass}
      >
        {active?.isLocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
        {active?.isLocked ? 'Entsperren' : 'Sperren'}
      </button>
      <button type="button" disabled title="Diff-Ansicht folgt in Meilenstein 6" className={buttonClass}>
        Diff
      </button>
      <div className="flex-1" />
      <QueueIndicator />
      <div className="mx-1 h-[18px] w-px bg-slate-200 dark:bg-slate-700" />
      <span className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
        <Bot className="h-3.5 w-3.5" />
        KI: {okProviders > 0 ? `${okProviders} Provider OK` : 'kein Test'}
      </span>
    </header>
  );
}
