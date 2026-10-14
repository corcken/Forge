import { trpc } from '../lib/trpc';

/** Liefert den aktuell aktiven Run (geteilt ueber den react-query-Cache). */
export function useActiveRun() {
  return trpc.runs.active.useQuery();
}

/** ID des aktiven Runs oder null. */
export function useActiveRunId(): string | null {
  return useActiveRun().data?.id ?? null;
}
