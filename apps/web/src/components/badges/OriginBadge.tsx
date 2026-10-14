import type { FieldOrigin } from '@descriptio-forge/shared';

const ORIGIN_STYLES: Record<FieldOrigin, string> = {
  AI: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300',
  SER: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  ARC: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  HEU: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
  MAN: 'bg-slate-200 text-slate-900 font-bold dark:bg-slate-700 dark:text-white',
  NULL: 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500',
};

export interface OriginBadgeProps {
  origin: FieldOrigin;
  title?: string;
}

/** Kompaktes 10px-Badge fuer die Datenherkunft (AI/SER/ARC/HEU/MAN). */
export function OriginBadge({ origin, title }: OriginBadgeProps) {
  const label = origin === 'NULL' ? '–' : origin;
  return (
    <span
      title={title ?? origin}
      className={`px-1.5 py-0 text-[10px] font-semibold rounded uppercase tracking-wider ${ORIGIN_STYLES[origin]}`}
    >
      {label}
    </span>
  );
}
