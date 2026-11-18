import { Save, Trash2, Crosshair, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import type {
  SymbolDefinition,
  SymbolPinDirection,
  SymbolPinPoint,
} from '@descriptio-forge/shared';
import { trpc } from '../../lib/trpc';
import { BTN, INPUT, ADMIN_TH } from '../../lib/ui';

interface Props {
  symbol: SymbolDefinition | null;
  onSaved?: () => void;
  onDeleted?: () => void;
}

const DIRECTION_OPTIONS: SymbolPinDirection[] = ['TOP', 'BOTTOM', 'LEFT', 'RIGHT'];

/** Detail- und Editor-Panel fuer das ausgewaehlte IEC 60617 Symbol. */
export function SymbolInspectorPanel({ symbol, onSaved, onDeleted }: Props) {
  const [name, setName] = useState('');
  const [iecRef, setIecRef] = useState('');
  const [bmk, setBmk] = useState('');
  const [svg, setSvg] = useState('');
  const [pins, setPins] = useState<SymbolPinPoint[]>([]);

  useEffect(() => {
    if (symbol) {
      setName(symbol.name);
      setIecRef(symbol.iec60617Ref ?? '');
      setBmk(symbol.bmkPrefix);
      setSvg(symbol.svgContent);
      setPins(symbol.pins.map((p) => ({ ...p })));
    }
  }, [symbol]);

  const upsert = trpc.symbols.upsert.useMutation({
    onSuccess: () => onSaved?.(),
  });
  const del = trpc.symbols.delete.useMutation({
    onSuccess: () => onDeleted?.(),
  });

  if (!symbol) {
    return (
      <div className="flex h-full items-center justify-center text-[12px] text-slate-400">
        Kein Symbol ausgewaehlt. Waehle links ein Symbol aus der Tabelle.
      </div>
    );
  }

  const updatePin = (index: number, patch: Partial<SymbolPinPoint>) => {
    setPins((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  };

  const removePin = (index: number) => {
    setPins((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((p, i) => ({ ...p, pinIndex: i + 1 })),
    );
  };

  const addPin = () => {
    setPins((prev) => [
      ...prev,
      {
        pinIndex: prev.length + 1,
        defaultLabel: String(prev.length + 1),
        xMm: 8,
        yMm: prev.length % 2 === 0 ? 0 : 16,
        direction: prev.length % 2 === 0 ? 'TOP' : 'BOTTOM',
      },
    ]);
  };

  const handleSave = () => {
    const cleanBmk = bmk.trim().replace(/^[-+]+/, '').toUpperCase() || 'K';
    const normalizedPins = pins.map((p, idx) => ({
      ...p,
      pinIndex: idx + 1,
      defaultLabel: p.defaultLabel.trim() || String(idx + 1),
    }));

    upsert.mutate({
      ...symbol,
      name,
      iec60617Ref: iecRef || null,
      bmkPrefix: cleanBmk,
      svgContent: svg,
      pins: normalizedPins,
      originType: symbol.originType === 'STANDARD' ? 'STANDARD' : 'MANUAL',
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="flex h-full flex-col border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="flex h-[32px] items-center justify-between border-b border-slate-200 bg-slate-50 px-3 text-[12px] font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
        <div className="flex items-center gap-1.5 truncate">
          <Crosshair className="h-4 w-4 text-sky-500" />
          <span className="font-mono text-sky-600 dark:text-sky-400">{symbol.id}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => del.mutate({ id: symbol.id })}
            disabled={del.isPending}
            className={`${BTN} text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30`}
            title="Symbol loeschen"
          >
            <Trash2 className="h-3 w-3" />
          </button>
          <button
            onClick={handleSave}
            disabled={upsert.isPending}
            className={`${BTN} flex items-center gap-1 border-sky-500 bg-sky-50 font-semibold text-sky-700 hover:bg-sky-100 dark:bg-sky-950/50 dark:text-sky-300`}
          >
            <Save className="h-3 w-3" />
            <span>{upsert.isPending ? 'Speichert...' : 'Speichern'}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 text-[12px]">
        {/* CAD Grid & Live SVG Vorschau */}
        <div className="flex flex-col items-center justify-center rounded border border-slate-200 bg-slate-100/70 p-4 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-2 font-mono">
            4.0 mm CAD-Raster · 16 x 16 mm
          </div>
          <div className="relative flex h-[160px] w-[160px] items-center justify-center rounded bg-white shadow-inner dark:bg-slate-900 border border-slate-300 dark:border-slate-700">
            <svg className="absolute inset-0 h-full w-full opacity-15" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="cad-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#cad-grid)" />
            </svg>
            <div
              className="relative z-10 flex h-[140px] w-[140px] items-center justify-center text-slate-900 dark:text-slate-100 [&>svg]:h-full [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>
        </div>

        {/* Stammdaten Felder */}
        <div className="space-y-2">
          <div>
            <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Bezeichnung / Normname</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`${INPUT} w-full`}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">IEC 60617 Referenz</label>
              <input
                type="text"
                value={iecRef}
                onChange={(e) => setIecRef(e.target.value)}
                placeholder="S00xxx | 07-xx-xx"
                className={`${INPUT} w-full font-mono`}
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">BMK-Kennbuchstabe</label>
              <input
                type="text"
                value={bmk}
                maxLength={3}
                onChange={(e) => setBmk(e.target.value)}
                className={`${INPUT} w-full font-mono`}
              />
            </div>
          </div>
        </div>

        {/* Anschlusspunkte (Pins) – direkt editierbar */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              Anschlusspunkte ({pins.length} Pins)
            </span>
            <button
              type="button"
              onClick={addPin}
              className={`${BTN} flex items-center gap-1 text-[10px]`}
            >
              <Plus className="h-3 w-3" />
              <span>Pin</span>
            </button>
          </div>
          <div className="overflow-hidden rounded border border-slate-200 dark:border-slate-800">
            <div className={`${ADMIN_TH} grid grid-cols-[1fr_54px_54px_76px_26px] gap-1`}>
              <span>Label</span>
              <span>X mm</span>
              <span>Y mm</span>
              <span>Richtung</span>
              <span></span>
            </div>
            {pins.map((p, idx) => (
              <div
                key={`${p.pinIndex}-${idx}`}
                className="grid grid-cols-[1fr_54px_54px_76px_26px] items-center gap-1 border-t border-slate-100 px-1.5 py-1 font-mono text-[11px] dark:border-slate-800"
              >
                <input
                  type="text"
                  value={p.defaultLabel}
                  onChange={(e) => updatePin(idx, { defaultLabel: e.target.value })}
                  className={`${INPUT} h-[22px] w-full px-1 font-semibold text-sky-600 dark:text-sky-400`}
                />
                <input
                  type="number"
                  step="0.5"
                  value={p.xMm}
                  onChange={(e) => updatePin(idx, { xMm: Number(e.target.value) || 0 })}
                  className={`${INPUT} h-[22px] w-full px-1 text-right`}
                />
                <input
                  type="number"
                  step="0.5"
                  value={p.yMm}
                  onChange={(e) => updatePin(idx, { yMm: Number(e.target.value) || 0 })}
                  className={`${INPUT} h-[22px] w-full px-1 text-right`}
                />
                <select
                  value={p.direction}
                  onChange={(e) => updatePin(idx, { direction: e.target.value as SymbolPinDirection })}
                  className={`${INPUT} h-[22px] w-full px-0.5 text-[10px]`}
                >
                  {DIRECTION_OPTIONS.map((dir) => (
                    <option key={dir} value={dir}>
                      {dir}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removePin(idx)}
                  className="flex h-[22px] w-[22px] items-center justify-center rounded text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
                  title="Pin entfernen"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            {pins.length === 0 && (
              <div className="p-2 text-center text-[11px] text-slate-400">
                Keine Pins definiert.
              </div>
            )}
          </div>
        </div>

        {/* SVG Quellcode */}
        <div>
          <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">SVG Quelltext</label>
          <textarea
            rows={5}
            value={svg}
            onChange={(e) => setSvg(e.target.value)}
            className="w-full rounded border border-slate-200 bg-slate-50 p-1.5 font-mono text-[11px] text-slate-800 outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>
      </div>
    </div>
  );
}
