import { Sparkles, X, Loader2, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { trpc } from '../../lib/trpc';
import { BTN, INPUT } from '../../lib/ui';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const IEC_PART_OPTIONS = [
  { value: '', label: 'Alle Abschnitte (Teil 02 bis Teil 11)' },
  { value: 'Teil 02', label: 'Teil 02: Symbolelemente, Antriebe & Kennzeichen' },
  { value: 'Teil 03', label: 'Teil 03: Leiter, Klemmen & Stecker' },
  { value: 'Teil 04', label: 'Teil 04: Passive Bauelemente (R, L, C)' },
  { value: 'Teil 05', label: 'Teil 05: Halbleiter & Optoelektronik' },
  { value: 'Teil 06', label: 'Teil 06: Motoren, Trafos & Netzteile' },
  { value: 'Teil 07', label: 'Teil 07: Kontakte, Schalter, Spulen & Sicherungen' },
  { value: 'Teil 08', label: 'Teil 08: Messinstrumente & Meldeleuchten' },
  { value: 'Teil 09', label: 'Teil 09: Filter, Messumformer & Übertragung' },
  { value: 'Teil 10', label: 'Teil 10: SPS / PLC & Ein-/Ausgaenge' },
  { value: 'Teil 11', label: 'Teil 11: Gebäudeinstallation & Verbraucher' },
];

/** Modal-Dialog zum Starten des kapitelweisen KI-Symbolsammlers. */
export function HarvestModal({ isOpen, onClose, onComplete }: Props) {
  const [providerId, setProviderId] = useState('openai');
  const [modelId, setModelId] = useState('gpt-4o-mini');
  const [partFilter, setPartFilter] = useState('');
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const providers = trpc.ai.providers.list.useQuery(undefined, { enabled: isOpen });
  const models = trpc.ai.models.list.useQuery(
    { providerId: providerId || undefined },
    { enabled: isOpen && Boolean(providerId) },
  );

  const harvest = trpc.symbols.harvestCatalog.useMutation({
    onSuccess: (data) => {
      setResultMsg(`Erfolg: ${data.symbolsAdded} neue Symbole in ${data.scannedSections} Abschnitten gefunden (Gesamtbestand: ${data.totalNow}).`);
      onComplete();
    },
    onError: (err) => {
      setResultMsg(`Fehler: ${err.message}`);
    },
  });

  if (!isOpen) return null;

  const handleStart = () => {
    setResultMsg(null);
    harvest.mutate({
      providerId,
      modelId: modelId || 'gpt-4o-mini',
      partFilter: partFilter || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-[480px] rounded-lg border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex h-[36px] items-center justify-between border-b border-slate-200 bg-slate-50 px-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-800 dark:text-slate-100">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>IEC 60617 Symbol-Katalog per KI erweitern</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-3 text-[12px]">
          <p className="text-slate-600 dark:text-slate-300">
            Der KI-Harvester fragt die gewaehlte KI strukturiert Kapitel fuer Kapitel nach offiziellen DIN EN / IEC 60617 Symbolnummern ab und pflegt diese automatisch in die Symbol-Bibliothek ein.
          </p>

          <div>
            <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">KI-Provider</label>
            <select
              value={providerId}
              onChange={(e) => {
                setProviderId(e.target.value);
                setModelId('');
              }}
              className={`${INPUT} w-full`}
            >
              {(providers.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.displayName || p.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">KI-Modell</label>
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className={`${INPUT} w-full`}
            >
              {(models.data ?? []).length > 0 ? (
                models.data!.map((m) => (
                  <option key={m.modelId} value={m.modelId}>
                    {m.displayName || m.modelId}
                  </option>
                ))
              ) : (
                <option value="gpt-4o-mini">gpt-4o-mini (Standard)</option>
              )}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Norm-Abschnitt / Filter</label>
            <select
              value={partFilter}
              onChange={(e) => setPartFilter(e.target.value)}
              className={`${INPUT} w-full`}
            >
              {IEC_PART_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {resultMsg && (
            <div className={`flex items-start gap-1.5 rounded p-2 text-[11px] ${
              resultMsg.startsWith('Erfolg')
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
            }`}>
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{resultMsg}</span>
            </div>
          )}
        </div>

        <div className="flex h-[40px] items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-3 dark:border-slate-800 dark:bg-slate-900">
          <button onClick={onClose} className={BTN}>
            Schliessen
          </button>
          <button
            onClick={handleStart}
            disabled={harvest.isPending}
            className={`${BTN} flex items-center gap-1.5 border-amber-500 bg-amber-50 font-semibold text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300`}
          >
            {harvest.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            <span>{harvest.isPending ? 'Sammle Symbole...' : 'Jetzt per KI sammeln'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
