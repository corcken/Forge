import { AlertCircle, CheckCircle2, Cpu, FileDown, FileText, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const STATUS_MAP: Record<string, { icon: LucideIcon; className: string; hint: string }> = {
  PENDING_INGEST: { icon: FileDown, className: 'text-slate-400', hint: 'Rohdaten fehlen' },
  INGESTED: { icon: FileText, className: 'text-slate-500', hint: 'Rohdaten gecacht' },
  AI_EXTRACTED: { icon: Sparkles, className: 'text-indigo-500', hint: 'KI-extrahiert' },
  COMPILED: { icon: Cpu, className: 'text-amber-500', hint: 'Kompiliert' },
  VALIDATED: { icon: CheckCircle2, className: 'text-emerald-500', hint: 'Validiert' },
  ERROR: { icon: AlertCircle, className: 'text-rose-500', hint: 'Fehler' },
};

/** Spalte 0 (w-[28px]): zentriertes Pipeline-Status-Icon ohne Header-Titel. */
export function StatusIconCell({ status }: { status: string }) {
  const entry = STATUS_MAP[status] ?? STATUS_MAP.PENDING_INGEST!;
  const Icon = entry.icon;
  return (
    <div
      data-testid="status-cell"
      title={entry.hint}
      className="flex w-[28px] min-w-[28px] max-w-[28px] items-center justify-center border-r border-b border-slate-200 p-0 dark:border-slate-800"
    >
      <Icon className={`h-3.5 w-3.5 ${entry.className}`} />
    </div>
  );
}
