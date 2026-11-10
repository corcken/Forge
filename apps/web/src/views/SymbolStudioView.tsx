import { useState } from 'react';
import { Layers, Sparkles, Search, RefreshCw } from 'lucide-react';
import type { SymbolDefinition } from '@descriptio-forge/shared';
import { trpc } from '../lib/trpc';
import { ADMIN_TD, ADMIN_TH, ADMIN_TOOLBAR, BTN, INPUT } from '../lib/ui';
import { HarvestModal } from './symbols/HarvestModal';
import { SymbolInspectorPanel } from './symbols/SymbolInspectorPanel';

const BMK_OPTIONS = ['ALL', 'K', 'Q', 'F', 'S', 'X', 'T', 'G', 'B', 'P', 'M', 'H'];
const PART_OPTIONS = [
  { value: 'ALL', label: 'Alle Teile' },
  { value: 'Teil 03', label: 'Teil 03 (Klemmen/Leiter)' },
  { value: 'Teil 06', label: 'Teil 06 (Motoren/Trafos)' },
  { value: 'Teil 07', label: 'Teil 07 (Schaltgeräte/Spulen)' },
  { value: 'Teil 08', label: 'Teil 08 (Melder/Messung)' },
  { value: 'Teil 10', label: 'Teil 10 (SPS/Automation)' },
];

/** Symbol Studio: 24px High-Density E-CAD Symbolbibliothek nach IEC 60617. */
export function SymbolStudioView() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [bmkFilter, setBmkFilter] = useState('ALL');
  const [partFilter, setPartFilter] = useState('ALL');
  const [isHarvestOpen, setIsHarvestOpen] = useState(false);

  const utils = trpc.useUtils();
  const stats = trpc.symbols.stats.useQuery();
  const list = trpc.symbols.list.useQuery({
    search: search || undefined,
    bmkPrefix: bmkFilter !== 'ALL' ? bmkFilter : undefined,
    iecPart: partFilter !== 'ALL' ? partFilter : undefined,
  });

  const symbols: SymbolDefinition[] = list.data ?? [];
  const selectedSymbol = symbols.find((s) => s.id === selectedId) ?? symbols[0] ?? null;

  const refreshAll = () => {
    void utils.symbols.list.invalidate();
    void utils.symbols.stats.invalidate();
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* 32px Toolbar mit Filtern & Harvester-Button */}
      <div className={ADMIN_TOOLBAR}>
        <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-100">
          <Layers className="h-4 w-4 text-sky-500" />
          <span className="text-[12px]">IEC 60617 Symbol Studio</span>
        </div>

        <div className="relative ml-2 flex items-center">
          <Search className="absolute left-1.5 h-3 w-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ID, Name, Norm..."
            className={`${INPUT} pl-5 w-[140px] text-[11px]`}
          />
        </div>

        <select
          value={partFilter}
          onChange={(e) => setPartFilter(e.target.value)}
          className={`${INPUT} text-[11px]`}
        >
          {PART_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>

        <select
          value={bmkFilter}
          onChange={(e) => setBmkFilter(e.target.value)}
          className={`${INPUT} text-[11px] font-mono`}
        >
          {BMK_OPTIONS.map((b) => (
            <option key={b} value={b}>{b === 'ALL' ? 'Alle BMK' : `BMK: ${b}`}</option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-2">
          {stats.data && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono">
              <span className="rounded bg-slate-200/70 px-1.5 py-0.5 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {stats.data.total} Symbole
              </span>
              <span className="rounded bg-sky-100 px-1.5 py-0.5 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                {stats.data.standardCount} Standard
              </span>
              {stats.data.aiGeneratedCount > 0 && (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                  {stats.data.aiGeneratedCount} KI
                </span>
              )}
            </div>
          )}

          <button onClick={refreshAll} className={BTN} title="Aktualisieren">
            <RefreshCw className="h-3 w-3" />
          </button>

          <button
            onClick={() => setIsHarvestOpen(true)}
            className={`${BTN} flex items-center gap-1 border-amber-500 bg-amber-50 font-semibold text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300`}
          >
            <Sparkles className="h-3 w-3" />
            <span>IEC 60617 per KI sammeln</span>
          </button>
        </div>
      </div>

      {/* Hauptbereich: 24px Tabelle links, Inspector rechts */}
      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className={`${ADMIN_TH} grid grid-cols-[32px_180px_1fr_200px_60px_60px_90px]`}>
            <span></span>
            <span>Symbol-ID</span>
            <span>Normbezeichnung</span>
            <span>IEC 60617 Referenz</span>
            <span>BMK</span>
            <span>Pins</span>
            <span>Herkunft</span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {symbols.map((sym) => {
              const isSelected = (selectedSymbol?.id === sym.id);
              return (
                <div
                  key={sym.id}
                  onClick={() => setSelectedId(sym.id)}
                  className={`${ADMIN_TD} grid grid-cols-[32px_180px_1fr_200px_60px_60px_90px] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 ${
                    isSelected ? 'bg-sky-50/80 font-medium text-sky-900 dark:bg-sky-950/40 dark:text-sky-200' : ''
                  }`}
                >
                  <div
                    className="flex h-[20px] w-[20px] items-center justify-center rounded border border-slate-200 bg-white p-0.5 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 [&>svg]:h-full [&>svg]:w-full"
                    dangerouslySetInnerHTML={{ __html: sym.svgContent }}
                  />
                  <span className="truncate font-mono text-[11px] text-sky-700 dark:text-sky-400">{sym.id}</span>
                  <span className="truncate text-slate-700 dark:text-slate-300">{sym.name}</span>
                  <span className="truncate font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    {sym.iec60617Ref ?? '—'}
                  </span>
                  <span className="font-mono text-center font-semibold text-slate-600 dark:text-slate-300">{sym.bmkPrefix}</span>
                  <span className="font-mono text-center text-slate-500">{sym.pins.length}P</span>
                  <span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                      sym.originType === 'STANDARD'
                        ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        : sym.originType === 'AI_GENERATED'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}>
                      {sym.originType}
                    </span>
                  </span>
                </div>
              );
            })}
            {symbols.length === 0 && (
              <div className="p-4 text-center text-[12px] text-slate-400">
                Keine Symbole mit den gewaehlten Filtern gefunden.
              </div>
            )}
          </div>
        </div>

        {/* Rechter Inspektor */}
        <div className="w-[380px] min-w-[380px]">
          <SymbolInspectorPanel
            symbol={selectedSymbol}
            onSaved={refreshAll}
            onDeleted={refreshAll}
          />
        </div>
      </div>

      <HarvestModal
        isOpen={isHarvestOpen}
        onClose={() => setIsHarvestOpen(false)}
        onComplete={() => {
          setIsHarvestOpen(false);
          refreshAll();
        }}
      />
    </div>
  );
}
