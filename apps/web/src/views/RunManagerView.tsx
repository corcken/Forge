import { useState } from 'react';
import { BTN, BTN_ACTIVE } from '../lib/ui';
import { DiffPanel } from './runs/DiffPanel';
import { ExportPanel } from './runs/ExportPanel';
import { ImportPanel } from './runs/ImportPanel';
import { IngestPanel } from './runs/IngestPanel';
import { RunTable } from './runs/RunTable';

const TABS = ['Runs', 'Import', 'Ingestion', 'Diff & Export'] as const;
type Tab = (typeof TABS)[number];

/** Run-Manager: Runs, Import, Rohdaten-Ingestion sowie Diff & Export. */
export function RunManagerView() {
  const [tab, setTab] = useState<Tab>('Runs');
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-[32px] min-h-[32px] items-center border-b border-slate-200 bg-slate-50 px-2 font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
        Run-Manager & Diffing
      </div>
      <div className="flex h-[30px] min-h-[30px] items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 dark:border-slate-800 dark:bg-slate-900">
        {TABS.map((entry) => (
          <button
            key={entry}
            type="button"
            className={tab === entry ? BTN_ACTIVE : BTN}
            onClick={() => setTab(entry)}
          >
            {entry}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        {tab === 'Runs' ? <RunTable /> : null}
        {tab === 'Import' ? <ImportPanel /> : null}
        {tab === 'Ingestion' ? <IngestPanel /> : null}
        {tab === 'Diff & Export' ? (
          <div className="flex h-full min-h-0 flex-col">
            <div className="min-h-0 flex-1 overflow-hidden">
              <DiffPanel />
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <ExportPanel />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
