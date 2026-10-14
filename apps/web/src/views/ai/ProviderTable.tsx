import { AlertCircle, CheckCircle2, HelpCircle, Plug, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { formatLatency } from '../../lib/format';
import { trpc } from '../../lib/trpc';
import { ADMIN_TD, ADMIN_TH, BTN, INPUT, NUMERIC } from '../../lib/ui';

function StatusCell({
  status,
  latencyMs,
  error,
}: {
  status: string;
  latencyMs: number | null;
  error: string | null;
}) {
  if (status === 'OK') {
    return (
      <span className="flex items-center gap-1 text-emerald-500" title="Verbindung OK">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span className={`${NUMERIC} text-[11px]`}>{formatLatency(latencyMs)}</span>
      </span>
    );
  }
  if (status === 'ERROR') {
    return (
      <span className="flex items-center gap-1 text-rose-500" title={error ?? 'Fehler'}>
        <AlertCircle className="h-3.5 w-3.5" />
        <span className="text-[11px]">Fehler</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-slate-400" title="Noch nicht getestet">
      <HelpCircle className="h-3.5 w-3.5" />
    </span>
  );
}

/** Obere 24px-Tabelle: Provider, Key-Eingabe, Verbindungstest und Model-Sync. */
export function ProviderTable() {
  const utils = trpc.useUtils();
  const providers = trpc.ai.providers.list.useQuery();
  const credentials = trpc.credentials.list.useQuery();
  const setCredential = trpc.credentials.set.useMutation({
    onSuccess: () => void utils.credentials.list.invalidate(),
  });
  const test = trpc.ai.providers.test.useMutation({
    onSuccess: () => void utils.ai.providers.list.invalidate(),
  });
  const sync = trpc.ai.providers.syncModels.useMutation({
    onSuccess: () => {
      void utils.ai.providers.list.invalidate();
      void utils.ai.models.list.invalidate();
    },
  });
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const credById = new Map((credentials.data ?? []).map((cred) => [cred.providerId, cred]));
  const rows = providers.data ?? [];

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex">
        <div className={ADMIN_TH} style={{ width: 96 }}>
          Status
        </div>
        <div className={ADMIN_TH} style={{ width: 170 }}>
          Provider
        </div>
        <div className={ADMIN_TH} style={{ width: 240 }}>
          Base-URL
        </div>
        <div className={ADMIN_TH} style={{ width: 150 }}>
          API-Key
        </div>
        <div className={`${ADMIN_TH} flex-1`}>Neuer Key</div>
        <div className={ADMIN_TH} style={{ width: 240 }}>
          Aktionen
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {rows.map((provider) => {
          const cred = credById.get(provider.id);
          const draft = drafts[provider.id] ?? '';
          return (
            <div key={provider.id} data-testid="provider-row" className="flex">
              <div className={ADMIN_TD} style={{ width: 96 }}>
                <StatusCell
                  status={provider.lastTestStatus}
                  latencyMs={provider.lastLatencyMs}
                  error={provider.lastErrorMsg}
                />
              </div>
              <div className={`${ADMIN_TD} gap-1`} style={{ width: 170 }}>
                <span className="truncate">{provider.displayName}</span>
                <span className="text-[10px] text-slate-400">{provider.id}</span>
              </div>
              <div className={`${ADMIN_TD} font-mono text-[11px]`} style={{ width: 240 }}>
                <span className="truncate">{cred?.baseUrl ?? provider.baseUrl}</span>
              </div>
              <div className={`${ADMIN_TD} font-mono text-[11px]`} style={{ width: 150 }}>
                {cred?.maskedPreview ?? '–'}
              </div>
              <div className={ADMIN_TD} style={{ flex: 1 }}>
                <input
                  type="password"
                  placeholder="Key eingeben..."
                  value={draft}
                  onChange={(event) =>
                    setDrafts((prev) => ({ ...prev, [provider.id]: event.target.value }))
                  }
                  className={`${INPUT} w-full`}
                />
              </div>
              <div className={`${ADMIN_TD} gap-1`} style={{ width: 240 }}>
                <button
                  type="button"
                  className={BTN}
                  disabled={draft.trim().length === 0}
                  onClick={() => {
                    setCredential.mutate({ providerId: provider.id, apiKey: draft });
                    setDrafts((prev) => ({ ...prev, [provider.id]: '' }));
                  }}
                >
                  Speichern
                </button>
                <button
                  type="button"
                  className={BTN}
                  onClick={() => test.mutate({ providerId: provider.id })}
                >
                  <Plug className="mr-1 inline h-3 w-3" />
                  Test
                </button>
                <button
                  type="button"
                  className={BTN}
                  onClick={() => sync.mutate({ providerId: provider.id })}
                >
                  <RefreshCw className="mr-1 inline h-3 w-3" />
                  Modelle
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
