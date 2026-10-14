import { useState } from 'react';
import type { CatalogPin, FieldOrigin, FieldOriginsMap } from '@descriptio-forge/shared';
import { OriginBadge } from '../../components/badges/OriginBadge';
import { trpc } from '../../lib/trpc';
import { BTN, BTN_ACTIVE } from '../../lib/ui';
import { PropertyRow } from './PropertyRow';

interface FieldDef {
  key: string;
  label: string;
  numeric?: boolean;
}

const GROUPS: { title: string; fields: FieldDef[] }[] = [
  {
    title: 'Identifikation',
    fields: [
      { key: 'name', label: 'Name' },
      { key: 'archetypeId', label: 'Archetyp' },
      { key: 'seriesName', label: 'Baureihe' },
      { key: 'category', label: 'Kategorie' },
      { key: 'mountingType', label: 'Montage' },
    ],
  },
  {
    title: 'Mechanik & 3D',
    fields: [
      { key: 'width', label: 'Breite (mm)', numeric: true },
      { key: 'height', label: 'Hoehe (mm)', numeric: true },
      { key: 'depth', label: 'Tiefe (mm)', numeric: true },
      { key: 'weight', label: 'Gewicht (g)', numeric: true },
      { key: 'dinRailMountOffsetY', label: 'DIN-Offset Y', numeric: true },
    ],
  },
  {
    title: 'Thermik & Elektrik',
    fields: [
      { key: 'powerLoss', label: 'Verlust (W)', numeric: true },
      { key: 'mainCurrentAmps', label: 'Nennstrom (A)', numeric: true },
      { key: 'coilNominalVoltage', label: 'Spule (V)', numeric: true },
      { key: 'coilVoltageType', label: 'Spannungsart' },
      { key: 'minCrossSec', label: 'Querschnitt min', numeric: true },
      { key: 'maxCrossSec', label: 'Querschnitt max', numeric: true },
      { key: 'torqueNm', label: 'Drehmoment (Nm)', numeric: true },
      { key: 'strippingLengthMm', label: 'Abisolier (mm)', numeric: true },
      { key: 'connectionType', label: 'Anschluss' },
      { key: 'terminalLevels', label: 'Ebenen', numeric: true },
    ],
  },
];

function pinOrigin(pin: CatalogPin): FieldOrigin {
  const order: (keyof FieldOriginsMap)[] = ['torqueNm', 'nominalVoltage', 'maxCurrent'];
  for (const field of order) {
    const origin = pin.fieldOrigins[field];
    if (origin && origin !== 'NULL') return origin;
  }
  return 'ARC';
}

/** Rechter Dual-Inspector: 24px-Property-Grid (Tab 1) + Rohdaten-Beweis (Tab 2). */
export function DualInspectorPanel({ runId, partId }: { runId: string; partId: string }) {
  const utils = trpc.useUtils();
  const [tab, setTab] = useState<'props' | 'raw'>('props');
  const compiled = trpc.compiler.getCompiled.useQuery({ runId, partId });
  const raw = trpc.parts.rawEvidence.useQuery({ runId, partId }, { enabled: tab === 'raw' });
  const setOverride = trpc.parts.setOverride.useMutation();
  const clearOverride = trpc.parts.clearOverride.useMutation();
  const compile = trpc.compiler.compilePart.useMutation();

  const part = compiled.data?.compiledPart ?? null;
  const origins = (compiled.data?.fieldOrigins ?? {}) as FieldOriginsMap;

  const refresh = (): void => {
    void utils.compiler.getCompiled.invalidate();
    void utils.compiler.tree.invalidate();
  };
  const recompile = (): void => {
    compile.mutate({ runId, partId }, { onSuccess: refresh });
  };
  const commit = (field: string, numeric: boolean | undefined, rawValue: string): void => {
    const value = numeric
      ? rawValue.trim() === ''
        ? null
        : Number(rawValue)
      : rawValue.trim() === ''
        ? null
        : rawValue;
    if (numeric && value !== null && Number.isNaN(value)) return;
    setOverride.mutate({ runId, partId, field, value }, { onSuccess: recompile });
  };
  const unlock = (field: string): void => {
    clearOverride.mutate({ runId, partId, field }, { onSuccess: recompile });
  };

  return (
    <div className="flex h-full min-h-0 flex-col border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-3 dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex items-center gap-2">
          <button type="button" className={tab === 'props' ? BTN_ACTIVE : BTN} onClick={() => setTab('props')}>
            Eigenschaften
          </button>
          <button type="button" className={tab === 'raw' ? BTN_ACTIVE : BTN} onClick={() => setTab('raw')}>
            Rohdaten-Beweis
          </button>
        </div>
        {compiled.data ? (
          <span className="font-mono text-[10px] text-slate-500">
            {compiled.data.status} · {compiled.data.qualityTier} · {compiled.data.completenessPct}%
          </span>
        ) : null}
      </div>

      {tab === 'props' ? (
        <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-2">
          {!part ? (
            <div className="text-[12px] text-slate-400">
              Artikel nicht kompiliert.
              {compiled.data?.validationErrors?.length
                ? ` ${compiled.data.validationErrors.join(' ')}`
                : ''}
            </div>
          ) : (
            <>
              {GROUPS.map((group) => (
                <section
                  key={group.title}
                  className="select-none border border-slate-200 bg-white text-[12px] dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="flex h-[24px] items-center justify-between border-b border-slate-200 bg-slate-100 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:border-slate-800 dark:bg-slate-800/90 dark:text-slate-300">
                    <span>{group.title}</span>
                  </div>
                  {group.fields.map((field) => (
                    <PropertyRow
                      key={field.key}
                      label={field.label}
                      value={(part as unknown as Record<string, string | number | null>)[field.key] ?? null}
                      origin={origins[field.key]}
                      numeric={field.numeric}
                      onCommit={(rawValue) => commit(field.key, field.numeric, rawValue)}
                      onUnlock={() => unlock(field.key)}
                    />
                  ))}
                </section>
              ))}
              <section className="border border-slate-200 bg-white text-[12px] dark:border-slate-800 dark:bg-slate-950">
                <div className="flex h-[24px] items-center border-b border-slate-200 bg-slate-100 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:border-slate-800 dark:bg-slate-800/90 dark:text-slate-300">
                  Funktionsgruppen & Pins ({part.functionGroups.length})
                </div>
                {part.functionGroups.map((group) => (
                  <div key={group.id}>
                    <div className="flex h-[24px] items-center gap-2 border-b border-slate-200 bg-slate-50/60 px-2 text-[11px] font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
                      <span className="font-mono">{group.groupKey}</span>
                      <span className="text-slate-400">{group.functionType}</span>
                      <span className="ml-auto font-mono text-[10px] text-slate-400">
                        {group.potentialPropagation}
                      </span>
                    </div>
                    {group.pins.map((pin) => (
                      <div
                        key={pin.id}
                        className="flex h-[24px] items-center gap-2 border-b border-slate-200 px-2 text-[11px] dark:border-slate-800"
                      >
                        <span className="w-14 font-mono">{pin.pinName}</span>
                        <span className="w-24 truncate text-slate-500">{pin.electricalRole}</span>
                        <span className="w-14 text-slate-500">{pin.voltageType}</span>
                        <span className="ml-auto flex items-center gap-2 font-mono tabular-nums">
                          {pin.nominalVoltage !== null ? <span>{pin.nominalVoltage}V</span> : null}
                          {pin.maxCurrent !== null ? <span>{pin.maxCurrent}A</span> : null}
                          <OriginBadge origin={pinOrigin(pin)} />
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </section>
            </>
          )}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto p-2 text-[12px]">
          {raw.isLoading ? (
            <span className="text-slate-400">Lade Rohdaten...</span>
          ) : raw.data?.extractedMarkdown ? (
            <pre className="whitespace-pre-wrap font-mono text-[11px] text-slate-700 dark:text-slate-200">
              {raw.data.extractedMarkdown}
            </pre>
          ) : (
            <div className="text-slate-400">
              Keine Rohdaten gecacht. Quelle: {raw.data?.sourceUrl ?? '—'} (Ingestion folgt in
              Meilenstein 7).
            </div>
          )}
        </div>
      )}
    </div>
  );
}
