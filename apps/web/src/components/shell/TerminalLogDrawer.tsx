import { ChevronDown, ChevronUp, Terminal, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { trpc } from '../../lib/trpc';

type ScopeFilter = 'ALL' | 'ERROR' | 'INGEST' | 'AI' | 'COMPILE' | 'QUEUE';

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('de-DE', { hour12: false });
  } catch {
    return iso;
  }
}

/**
 * Ausklappbares Live-Terminal-Protokoll am unteren Fensterrand.
 * Zeigt in Echtzeit alle Schritte aus Ingestion, Queue, KI-Extraktion und Compiler.
 */
export function TerminalLogDrawer() {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(true);
  const [filter, setFilter] = useState<ScopeFilter>('ALL');
  const logsQuery = trpc.system.logs.useQuery({ limit: 300 }, { refetchInterval: 1000 });
  const clearMutation = trpc.system.clearLogs.useMutation({
    onSuccess: () => void utils.system.logs.invalidate(),
  });
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const entries = logsQuery.data ?? [];
  const filtered = entries.filter((entry) => {
    if (filter === 'ALL') return true;
    if (filter === 'ERROR') return entry.level === 'ERROR' || entry.level === 'WARN';
    return entry.scope === filter;
  });

  const errorCount = entries.filter((e) => e.level === 'ERROR').length;
  const okCount = entries.filter((e) => e.level === 'OK').length;
  const lastEntry = entries[entries.length - 1];

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [open, filtered.length, lastEntry?.seq]);

  const filterBtn = (id: ScopeFilter, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => setFilter(id)}
      className={`h-[18px] rounded px-1.5 font-mono text-[10px] ${
        filter === id
          ? 'bg-sky-600 text-white'
          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div
      className={`flex flex-col border-t border-slate-700 bg-slate-950 text-slate-200 ${
        open ? 'h-[190px] min-h-[190px]' : 'h-[24px] min-h-[24px]'
      }`}
    >
      <div className="flex h-[24px] min-h-[24px] items-center gap-2 border-b border-slate-800 bg-slate-900 px-2 text-[11px]">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center gap-1.5 font-mono font-semibold text-sky-400 hover:text-sky-300"
        >
          <Terminal className="h-3.5 w-3.5" />
          <span>Protokoll / Terminal</span>
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        </button>

        <span className="font-mono text-[10px] text-slate-400">
          ✓{okCount} · <span className={errorCount > 0 ? 'text-rose-400' : ''}>✗{errorCount}</span>
        </span>

        {open ? (
          <div className="ml-2 flex items-center gap-1">
            {filterBtn('ALL', 'Alle')}
            {filterBtn('ERROR', `Fehler (${errorCount})`)}
            {filterBtn('INGEST', 'Ingest')}
            {filterBtn('AI', 'KI')}
            {filterBtn('COMPILE', 'Compiler')}
            {filterBtn('QUEUE', 'Queue')}
          </div>
        ) : lastEntry ? (
          <span className="truncate font-mono text-[11px] text-slate-400">
            [{formatTime(lastEntry.timestamp)}] [{lastEntry.scope}] {lastEntry.message}
          </span>
        ) : null}

        <div className="flex-1" />

        {open ? (
          <button
            type="button"
            onClick={() => clearMutation.mutate()}
            className="flex h-[18px] items-center gap-1 rounded bg-slate-800 px-1.5 text-[10px] text-slate-300 hover:bg-slate-700"
            title="Protokoll leeren"
          >
            <Trash2 className="h-3 w-3 text-rose-400" /> Leeren
          </button>
        ) : null}
      </div>

      {open ? (
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto px-2 py-1 font-mono text-[11px] leading-[18px]"
        >
          {filtered.length === 0 ? (
            <div className="text-slate-500">Keine Protokolleinträge für diesen Filter.</div>
          ) : (
            filtered.map((entry) => {
              const color =
                entry.level === 'ERROR'
                  ? 'text-rose-400'
                  : entry.level === 'WARN'
                    ? 'text-amber-300'
                    : entry.level === 'OK'
                      ? 'text-emerald-400'
                      : 'text-sky-300';
              return (
                <div key={entry.seq} className="flex items-baseline gap-2 whitespace-pre-wrap">
                  <span className="shrink-0 text-slate-500">[{formatTime(entry.timestamp)}]</span>
                  <span className={`w-16 shrink-0 font-semibold ${color}`}>[{entry.scope}]</span>
                  <span className={entry.level === 'ERROR' ? 'text-rose-300' : 'text-slate-200'}>
                    {entry.message}
                  </span>
                </div>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
