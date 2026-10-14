import type { FieldOrigin } from '@descriptio-forge/shared';
import type { StagedPart } from '../vault/run-types.js';

const DIFF_FIELDS = [
  'width',
  'height',
  'depth',
  'weight',
  'torqueNm',
  'coilNominalVoltage',
  'mainCurrentAmps',
  'minCrossSec',
  'maxCrossSec',
] as const;

export interface DiffRow {
  partId: string;
  articleNr: string;
  field: string;
  a: string | null;
  b: string | null;
  aOrigin: FieldOrigin;
  bOrigin: FieldOrigin;
}

export interface RunDiffResult {
  runA: string;
  runB: string;
  added: string[];
  removed: string[];
  rows: DiffRow[];
}

function format(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

/**
 * Vergleicht zwei Runs Feld fuer Feld (Stufe 3/4). Zeigt hinzugefuegte,
 * entfernte und geaenderte Artikel inkl. Feldherkunft fuer das 24px-Diff-Grid.
 */
export function diffRuns(
  runA: string,
  runB: string,
  partsA: StagedPart[],
  partsB: StagedPart[],
): RunDiffResult {
  const mapA = new Map(partsA.map((part) => [part.articleNr, part]));
  const mapB = new Map(partsB.map((part) => [part.articleNr, part]));
  const added: string[] = [];
  const removed: string[] = [];
  const rows: DiffRow[] = [];

  for (const part of partsB) if (!mapA.has(part.articleNr)) added.push(part.articleNr);
  for (const part of partsA) if (!mapB.has(part.articleNr)) removed.push(part.articleNr);

  for (const a of partsA) {
    const b = mapB.get(a.articleNr);
    if (!b) continue;
    if (a.pipelineStatus !== b.pipelineStatus) {
      rows.push({
        partId: a.id,
        articleNr: a.articleNr,
        field: 'status',
        a: a.pipelineStatus,
        b: b.pipelineStatus,
        aOrigin: 'NULL',
        bOrigin: 'NULL',
      });
    }
    const ca = a.compiledPart as unknown as Record<string, unknown> | null;
    const cb = b.compiledPart as unknown as Record<string, unknown> | null;
    for (const field of DIFF_FIELDS) {
      const av = ca?.[field] ?? null;
      const bv = cb?.[field] ?? null;
      if (av === bv) continue;
      rows.push({
        partId: a.id,
        articleNr: a.articleNr,
        field,
        a: format(av),
        b: format(bv),
        aOrigin: a.compiledPart?.fieldOrigins[field] ?? 'NULL',
        bOrigin: b.compiledPart?.fieldOrigins[field] ?? 'NULL',
      });
    }
  }

  return { runA, runB, added, removed, rows };
}
