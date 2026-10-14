import { useEffect, useState } from 'react';
import type { ConnectionType, SeriesOverride } from '@descriptio-forge/shared';
import { useActiveRunId } from '../../hooks/useActiveRun';
import { trpc } from '../../lib/trpc';
import { ADMIN_TD, ADMIN_TH, ADMIN_TOOLBAR, BTN, INPUT, NUMERIC } from '../../lib/ui';
import { createEmptySeries } from './series-defaults';

const CONNECTIONS: ConnectionType[] = ['SCREW', 'PUSH_IN', 'SPRING', 'BOLT'];

/** Baureihen-Editor: Defaults (Drehmoment, Zubehoer) fuer eine ganze Serie. */
export function SeriesEditor() {
  const runId = useActiveRunId();
  const utils = trpc.useUtils();
  const series = trpc.series.list.useQuery({ runId: runId ?? '' }, { enabled: runId !== null });
  const upsert = trpc.series.upsert.useMutation({
    onSuccess: () => void utils.series.list.invalidate(),
  });
  const remove = trpc.series.remove.useMutation({
    onSuccess: () => void utils.series.list.invalidate(),
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<SeriesOverride | null>(null);
  const [accJson, setAccJson] = useState('[]');
  const [error, setError] = useState('');

  const rows = series.data ?? [];

  useEffect(() => {
    if (!selectedId) {
      setDraft(null);
      return;
    }
    const found = rows.find((entry) => entry.id === selectedId);
    if (found) {
      setDraft(found);
      setAccJson(JSON.stringify(found.accessories, null, 2));
      setError('');
    }
  }, [selectedId, series.data]);

  if (!runId) {
    return (
      <div className="flex h-full items-center justify-center text-[12px] text-slate-400">
        Kein aktiver Run fuer Baureihen.
      </div>
    );
  }

  const save = (): void => {
    if (!draft) return;
    try {
      const accessories = JSON.parse(accJson) as SeriesOverride['accessories'];
      upsert.mutate({ runId, series: { ...draft, accessories } });
      setError('');
    } catch {
      setError('Ungueltiges Zubehoer-JSON.');
    }
  };

  const setShared = (field: keyof SeriesOverride['sharedFields'], value: unknown): void => {
    setDraft((prev) =>
      prev ? { ...prev, sharedFields: { ...prev.sharedFields, [field]: value } } : prev,
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col border-t border-slate-200 dark:border-slate-800">
      <div className={ADMIN_TOOLBAR}>
        <span className="font-semibold text-slate-700 dark:text-slate-200">Baureihen (CatalogSeries)</span>
        <button
          type="button"
          className={BTN}
          onClick={() => {
            const created = createEmptySeries();
            upsert.mutate({ runId, series: created });
            setSelectedId(created.id);
          }}
        >
          Neue Serie
        </button>
        {error ? <span className="text-[11px] text-rose-500">{error}</span> : null}
      </div>
      <div className="flex">
        <div className={`${ADMIN_TH} flex-1`}>Hersteller / Serie</div>
        <div className={ADMIN_TH} style={{ width: 160 }}>
          Archetyp
        </div>
        <div className={ADMIN_TH} style={{ width: 90, justifyContent: 'flex-end' }}>
          Torque
        </div>
        <div className={ADMIN_TH} style={{ width: 90, justifyContent: 'flex-end' }}>
          Abisolier
        </div>
        <div className={ADMIN_TH} style={{ width: 90, justifyContent: 'flex-end' }}>
          Twin
        </div>
      </div>
      <div className="max-h-[120px] min-h-0 flex-1 overflow-auto">
        {rows.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setSelectedId(entry.id)}
            className={`flex w-full border-b border-slate-200 text-left dark:border-slate-800 ${
              entry.id === selectedId
                ? 'bg-blue-50/80 dark:bg-blue-950/50'
                : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
            }`}
          >
            <div className={`${ADMIN_TD} flex-1`}>
              <span className="truncate">
                {entry.manufacturer} · {entry.seriesName}
              </span>
            </div>
            <div className={`${ADMIN_TD} font-mono text-[11px]`} style={{ width: 160 }}>
              {entry.defaultArchetypeId ?? '–'}
            </div>
            <div className={`${ADMIN_TD} ${NUMERIC}`} style={{ width: 90, justifyContent: 'flex-end' }}>
              {entry.sharedFields.torqueNm ?? '–'}
            </div>
            <div className={`${ADMIN_TD} ${NUMERIC}`} style={{ width: 90, justifyContent: 'flex-end' }}>
              {entry.sharedFields.strippingLengthMm ?? '–'}
            </div>
            <div className={`${ADMIN_TD} ${NUMERIC}`} style={{ width: 90, justifyContent: 'flex-end' }}>
              {entry.sharedFields.maxCrossSecTwin ?? '–'}
            </div>
          </button>
        ))}
        {rows.length === 0 ? <div className={ADMIN_TD}>Keine Baureihen definiert.</div> : null}
      </div>
      {draft ? (
        <div className="border-t border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40">
          <div className={`${ADMIN_TH} gap-2`}>
            <input
              className={`${INPUT} w-[140px]`}
              value={draft.manufacturer}
              onChange={(event) =>
                setDraft((prev) => (prev ? { ...prev, manufacturer: event.target.value } : prev))
              }
            />
            <input
              className={`${INPUT} w-[160px]`}
              value={draft.seriesName}
              onChange={(event) =>
                setDraft((prev) => (prev ? { ...prev, seriesName: event.target.value } : prev))
              }
            />
            <input
              className={`${INPUT} w-[180px] font-mono`}
              placeholder="Archetyp-ID"
              value={draft.defaultArchetypeId ?? ''}
              onChange={(event) =>
                setDraft((prev) =>
                  prev ? { ...prev, defaultArchetypeId: event.target.value || null } : prev,
                )
              }
            />
            <input
              className={`${INPUT} w-[80px] text-right font-mono`}
              placeholder="Nm"
              value={draft.sharedFields.torqueNm ?? ''}
              onChange={(event) =>
                setShared('torqueNm', event.target.value === '' ? null : Number(event.target.value))
              }
            />
            <input
              className={`${INPUT} w-[80px] text-right font-mono`}
              placeholder="mm"
              value={draft.sharedFields.strippingLengthMm ?? ''}
              onChange={(event) =>
                setShared(
                  'strippingLengthMm',
                  event.target.value === '' ? null : Number(event.target.value),
                )
              }
            />
            <input
              className={`${INPUT} w-[80px] text-right font-mono`}
              placeholder="mm2"
              value={draft.sharedFields.maxCrossSecTwin ?? ''}
              onChange={(event) =>
                setShared(
                  'maxCrossSecTwin',
                  event.target.value === '' ? null : Number(event.target.value),
                )
              }
            />
            <select
              className={INPUT}
              value={draft.sharedFields.connectionType ?? ''}
              onChange={(event) =>
                setShared(
                  'connectionType',
                  event.target.value === '' ? null : (event.target.value as ConnectionType),
                )
              }
            >
              <option value="">Anschluss: –</option>
              {CONNECTIONS.map((connection) => (
                <option key={connection} value={connection}>
                  {connection}
                </option>
              ))}
            </select>
            <button type="button" className={BTN} onClick={save}>
              Speichern
            </button>
            <button
              type="button"
              className={BTN}
              onClick={() => {
                remove.mutate({ runId, seriesId: draft.id });
                setSelectedId(null);
              }}
            >
              Löschen
            </button>
          </div>
          <textarea
            value={accJson}
            onChange={(event) => setAccJson(event.target.value)}
            placeholder="Zubehoer-Relationen (JSON)"
            className="h-[72px] w-full resize-none whitespace-pre border-t border-slate-200 bg-white p-2 font-mono text-[11px] text-slate-800 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>
      ) : null}
    </div>
  );
}
