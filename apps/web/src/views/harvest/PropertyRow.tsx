import { Lock, Unlock } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FieldOrigin } from '@descriptio-forge/shared';
import { OriginBadge } from '../../components/badges/OriginBadge';

export interface PropertyRowProps {
  label: string;
  value: string | number | null;
  origin: FieldOrigin | undefined;
  numeric?: boolean;
  onCommit: (raw: string) => void;
  onUnlock: () => void;
}

/** Eine 24px-Eigenschaftszeile: Label | Herkunft | Wert/Input | Sperre. */
export function PropertyRow({ label, value, origin, numeric, onCommit, onUnlock }: PropertyRowProps) {
  const [local, setLocal] = useState(value === null || value === undefined ? '' : String(value));
  useEffect(() => {
    setLocal(value === null || value === undefined ? '' : String(value));
  }, [value]);

  const locked = origin === 'MAN';

  return (
    <div className="flex h-[24px] items-stretch border-b border-slate-200 last:border-b-0 dark:border-slate-800">
      <div className="flex w-32 shrink-0 items-center justify-between truncate border-r border-slate-200 bg-slate-50/60 px-2 text-[11px] font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
        <span className="truncate">{label}</span>
      </div>
      <div className="flex w-[36px] shrink-0 items-center justify-center border-r border-slate-200 dark:border-slate-800">
        {origin ? <OriginBadge origin={origin} /> : null}
      </div>
      <div className="flex flex-1 items-center px-1">
        <input
          value={local}
          inputMode={numeric ? 'decimal' : 'text'}
          onChange={(event) => setLocal(event.target.value)}
          onBlur={() => onCommit(local)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') (event.target as HTMLInputElement).blur();
          }}
          className={`w-full rounded-none bg-transparent px-1 text-[11px] outline-none focus:bg-sky-50 focus:ring-1 focus:ring-sky-500 dark:text-slate-100 dark:focus:bg-sky-950/40 ${
            numeric ? 'text-right font-mono tabular-nums' : ''
          }`}
        />
      </div>
      <button
        type="button"
        title={locked ? 'Schreibschutz aufheben' : 'Wert fixieren (MAN)'}
        onClick={() => (locked ? onUnlock() : onCommit(local))}
        className="flex w-[24px] shrink-0 items-center justify-center border-l border-slate-200 text-slate-400 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800"
      >
        {locked ? (
          <Lock className="h-3.5 w-3.5 text-amber-500" />
        ) : (
          <Unlock className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}
