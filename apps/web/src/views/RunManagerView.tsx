import { ImportPanel } from './runs/ImportPanel';
import { RunTable } from './runs/RunTable';

/** Run-Manager & Diffing: Run-Verwaltung oben, Artikel-Import unten. */
export function RunManagerView() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-[32px] min-h-[32px] items-center border-b border-slate-200 bg-slate-50 px-2 font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
        Run-Manager & Diffing
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <RunTable />
      </div>
      <div className="min-h-0 flex-[0.8] overflow-hidden">
        <ImportPanel />
      </div>
    </div>
  );
}
