import { useEffect, useState, type ReactNode } from 'react';
import type { ArchetypeCategory, MountingType } from '@descriptio-forge/shared';
import { trpc } from '../../lib/trpc';
import { ADMIN_TH, BTN, INPUT } from '../../lib/ui';

const CATEGORIES: ArchetypeCategory[] = [
  'SWITCHGEAR',
  'PROTECTION',
  'TERMINAL',
  'POWER_SUPPLY',
  'PLC',
  'CABLE',
];
const MOUNTS: MountingType[] = ['DIN_RAIL', 'MOUNTING_PLATE', 'DOOR'];

function row(label: string, control: ReactNode) {
  return (
    <div className="flex h-[24px] items-stretch border-b border-slate-200 dark:border-slate-800">
      <div className="flex w-40 shrink-0 items-center border-r border-slate-200 bg-slate-50/60 px-2 text-[11px] font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
        {label}
      </div>
      <div className="flex flex-1 items-center px-1">{control}</div>
    </div>
  );
}

/** Editor fuer einen IEC-Archetyp (Kopf + Funktionsgruppen-Template). */
export function ArchetypeEditor({ id }: { id: string | null }) {
  const utils = trpc.useUtils();
  const query = trpc.archetypes.get.useQuery({ id: id ?? '' }, { enabled: id !== null });
  const upsert = trpc.archetypes.upsert.useMutation({
    onSuccess: () => void utils.archetypes.list.invalidate(),
    onError: (error) => setError(error.message),
  });
  const [form, setForm] = useState({
    name: '',
    category: 'SWITCHGEAR' as ArchetypeCategory,
    bmk: '',
    mounting: '' as '' | MountingType,
    json: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!query.data) return;
    setForm({
      name: query.data.name,
      category: query.data.category,
      bmk: query.data.defaultBmkPrefix,
      mounting: query.data.mountingTypeDefault ?? '',
      json: JSON.stringify(query.data.functionGroupsTemplate, null, 2),
    });
    setError('');
  }, [query.data]);

  if (!id) {
    return (
      <div className="flex h-full items-center justify-center text-[12px] text-slate-400">
        Archetyp links auswaehlen.
      </div>
    );
  }

  const save = (): void => {
    try {
      const functionGroupsTemplate = JSON.parse(form.json) as unknown;
      upsert.mutate({
        archetype: {
          id,
          name: form.name,
          category: form.category,
          defaultBmkPrefix: form.bmk,
          mountingTypeDefault: form.mounting === '' ? null : form.mounting,
          functionGroupsTemplate: functionGroupsTemplate as never,
          updatedAt: null,
        },
      });
      setError('');
    } catch {
      setError('Ungueltiges JSON im Funktionsgruppen-Template.');
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={`${ADMIN_TH} gap-2`}>
        <span>Archetyp bearbeiten:</span>
        <span className="font-mono">{id}</span>
        <button type="button" className={`${BTN} ml-auto`} onClick={save}>
          Speichern
        </button>
      </div>
      {row(
        'Name',
        <input
          className={`${INPUT} w-full`}
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
        />,
      )}
      {row(
        'Kategorie',
        <select
          className={`${INPUT} w-full`}
          value={form.category}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, category: event.target.value as ArchetypeCategory }))
          }
        >
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>,
      )}
      {row(
        'BMK-Praefix',
        <input
          className={`${INPUT} w-[80px] font-mono`}
          value={form.bmk}
          onChange={(event) => setForm((prev) => ({ ...prev, bmk: event.target.value }))}
        />,
      )}
      {row(
        'Montage',
        <select
          className={`${INPUT} w-full`}
          value={form.mounting}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, mounting: event.target.value as '' | MountingType }))
          }
        >
          <option value="">(kein Default)</option>
          {MOUNTS.map((mount) => (
            <option key={mount} value={mount}>
              {mount}
            </option>
          ))}
        </select>,
      )}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className={`${ADMIN_TH} justify-between`}>
          <span>Funktionsgruppen-Template (JSON)</span>
          {error ? <span className="text-rose-500">{error}</span> : null}
        </div>
        <textarea
          value={form.json}
          onChange={(event) => setForm((prev) => ({ ...prev, json: event.target.value }))}
          className="min-h-0 flex-1 resize-none whitespace-pre bg-white p-2 font-mono text-[11px] text-slate-800 outline-none dark:bg-slate-950 dark:text-slate-100"
        />
      </div>
    </div>
  );
}
