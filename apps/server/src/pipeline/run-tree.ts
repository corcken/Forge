import type { CatalogPin, FieldOrigin, FieldOriginsMap } from '@descriptio-forge/shared';
import type { RunPartRepository } from '../vault/run-part-repository.js';
import type { RunSeriesRepository } from '../vault/run-series-repository.js';

export interface RunTreePin {
  id: string;
  name: string;
  role: string;
  voltageType: string;
  nominalVoltage: number | null;
  maxCurrent: number | null;
  torqueNm: number | null;
  origin: FieldOrigin;
}

export interface RunTreeGroup {
  id: string;
  name: string;
  functionType: string;
  potentialPropagation: string;
  pins: RunTreePin[];
}

export interface RunTreePart {
  id: string;
  name: string;
  articleNr: string;
  status: string;
  qualityTier: string;
  completenessPct: number;
  archetypeId: string | null;
  functionGroups: RunTreeGroup[];
}

export interface RunTreeSeries {
  id: string;
  name: string;
  manufacturer: string;
  parts: RunTreePart[];
}

const DOMINANT_ORDER: (keyof FieldOriginsMap)[] = [
  'torqueNm',
  'maxCurrent',
  'nominalVoltage',
  'minCrossSec',
  'maxCrossSec',
];

function dominantOrigin(pin: CatalogPin): FieldOrigin {
  for (const field of DOMINANT_ORDER) {
    const origin = pin.fieldOrigins[field];
    if (origin && origin !== 'NULL') return origin;
  }
  return 'ARC';
}

/** Baut den Serie -> Artikel -> Funktionsgruppe -> Pin-Baum eines Runs. */
export function buildRunTree(
  runId: string,
  partsRepo: RunPartRepository,
  seriesRepo: RunSeriesRepository,
): RunTreeSeries[] {
  const parts = partsRepo.listParts(runId);
  const seriesById = new Map(seriesRepo.listSeries(runId).map((series) => [series.id, series]));
  const groups = new Map<string, RunTreeSeries>();

  for (const part of parts) {
    const compiled = part.compiledPart;
    const seriesName =
      compiled?.seriesName ??
      (part.seriesId ? (seriesById.get(part.seriesId)?.seriesName ?? part.seriesId) : 'Ohne Baureihe');
    const key = part.seriesId ?? `${part.manufacturer}::${seriesName}`;
    let node = groups.get(key);
    if (!node) {
      node = {
        id: key,
        name: `${part.manufacturer} ${seriesName}`,
        manufacturer: part.manufacturer,
        parts: [],
      };
      groups.set(key, node);
    }
    node.parts.push({
      id: part.id,
      name: compiled?.name ?? part.articleNr,
      articleNr: part.articleNr,
      status: part.pipelineStatus,
      qualityTier: part.qualityTier,
      completenessPct: part.completenessPct,
      archetypeId: part.archetypeId,
      functionGroups: (compiled?.functionGroups ?? []).map((group) => ({
        id: group.id,
        name: group.groupKey,
        functionType: group.functionType,
        potentialPropagation: group.potentialPropagation,
        pins: group.pins.map((pin) => ({
          id: pin.id,
          name: pin.pinName,
          role: pin.electricalRole,
          voltageType: pin.voltageType,
          nominalVoltage: pin.nominalVoltage,
          maxCurrent: pin.maxCurrent,
          torqueNm: pin.torqueNm,
          origin: dominantOrigin(pin),
        })),
      })),
    });
  }

  return [...groups.values()];
}
