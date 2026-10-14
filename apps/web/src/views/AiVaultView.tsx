import { ModelTable } from './ai/ModelTable';
import { ProviderTable } from './ai/ProviderTable';

/** KI-Provider & Modell-Tresor: Provider-Test oben, Modell-Sync unten. */
export function AiVaultView() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-[32px] min-h-[32px] items-center border-b border-slate-200 bg-slate-50 px-2 font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
        KI-Provider & Modell-Tresor
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <ProviderTable />
      </div>
      <div className="h-px bg-slate-200 dark:bg-slate-800" />
      <div className="min-h-0 flex-[1.4] overflow-hidden">
        <ModelTable />
      </div>
    </div>
  );
}
