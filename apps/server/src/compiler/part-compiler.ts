import {
  CatalogPartVersionSchema,
  type CatalogFunctionGroup,
  type CatalogPartVersion,
  type ConnectionType,
  type FieldOrigin,
  type FieldOriginsMap,
  type MountingType,
  type PartAccessoryRelation,
  type QualityTier,
  type VoltageType,
} from '@descriptio-forge/shared';
import { expandArchetype } from './archetype-expander.js';
import { manualHas, manualValue, resolveField, setOrigin } from './field-merger.js';
import { applyGeometryHeuristics } from './geometry-heuristics.js';
import { runErcChecks, scoreQuality } from './quality-scorer.js';
import {
  extractSeriesAccessories,
  extractSeriesPartFields,
  fillPinFromSeries,
} from './series-merger.js';
import type { CompilePartInput, CompileResult } from './compiler-types.js';

/**
 * Deterministischer Regel-Compiler (Stufe 3 + 4): verheiratet KI-Fakten,
 * Baureihen-Defaults und IEC-Archetyp unter strikter Beachtung manueller
 * Overrides (MAN hat immer Vorrang), berechnet die Geometrie-Heuristik und
 * validiert das Ergebnis gegen `CatalogPartVersionSchema`.
 */
export function compilePart(input: CompilePartInput): CompileResult {
  const { facts, archetype, series, manualOverrides, partId, manufacturer, articleNr } = input;
  const has = (field: string): boolean => manualHas(manualOverrides, field);
  const mv = <T>(field: string): T | null => manualValue<T>(manualOverrides, field);
  const seriesFields = extractSeriesPartFields(series);

  const nameRes = resolveField<string>({
    manualPresent: has('name'),
    manual: mv<string>('name'),
    ai: facts.name,
    series: null,
    arc: null,
    heu: null,
  });
  const widthRes = num(has, mv, 'width', facts.width);
  const heightRes = num(has, mv, 'height', facts.height);
  const depthRes = num(has, mv, 'depth', facts.depth);
  const weightRes = num(has, mv, 'weight', facts.weight);
  const powerLossRes = num(has, mv, 'powerLoss', facts.powerLoss);
  const coilVoltageRes = num(has, mv, 'coilNominalVoltage', facts.coilNominalVoltage);
  const mainCurrentRes = num(has, mv, 'mainCurrentAmps', facts.mainCurrentAmps);
  const minCrossRes = num(has, mv, 'minCrossSec', facts.minCrossSec);
  const maxCrossRes = num(has, mv, 'maxCrossSec', facts.maxCrossSec);
  const torqueRes = resolveField<number>({
    manualPresent: has('torqueNm'),
    manual: mv<number>('torqueNm'),
    ai: facts.torqueNm,
    series: seriesFields.torqueNm,
    arc: null,
    heu: null,
  });
  const strippingRes = resolveField<number>({
    manualPresent: has('strippingLengthMm'),
    manual: mv<number>('strippingLengthMm'),
    ai: facts.strippingLengthMm,
    series: seriesFields.strippingLengthMm,
    arc: null,
    heu: null,
  });
  const coilTypeRes = resolveField<VoltageType>({
    manualPresent: has('coilVoltageType'),
    manual: mv<VoltageType>('coilVoltageType'),
    ai: facts.coilVoltageType,
    series: seriesFields.voltageType,
    arc: null,
    heu: null,
  });
  const terminalLevelsRes = resolveField<number>({
    manualPresent: has('terminalLevels'),
    manual: mv<number>('terminalLevels'),
    ai: facts.terminalLevels,
    series: seriesFields.terminalLevels,
    arc: null,
    heu: null,
  });
  const connectionTypeRes = resolveField<ConnectionType>({
    manualPresent: has('connectionType'),
    manual: mv<ConnectionType>('connectionType'),
    ai: null,
    series: seriesFields.connectionType,
    arc: null,
    heu: null,
  });
  const dinRailRes = resolveField<number>({
    manualPresent: has('dinRailMountOffsetY'),
    manual: mv<number>('dinRailMountOffsetY'),
    ai: null,
    series: seriesFields.dinRailMountOffsetY,
    arc: null,
    heu: null,
  });
  const mountingRes = resolveField<MountingType>({
    manualPresent: has('mountingType'),
    manual: mv<MountingType>('mountingType'),
    ai: null,
    series: null,
    arc: archetype.mountingTypeDefault,
    heu: null,
  });
  const seriesNameRes = resolveField<string>({
    manualPresent: has('seriesName'),
    manual: mv<string>('seriesName'),
    ai: facts.seriesName,
    series: series?.seriesName ?? null,
    arc: null,
    heu: null,
  });

  const expansion = expandArchetype(partId, archetype, facts);
  let groups: CatalogFunctionGroup[] = expansion.functionGroups.map((group) => ({
    ...group,
    pins: group.pins.map((pin) => fillPinFromSeries(pin, series)),
  }));
  groups = applyGeometryHeuristics(groups, {
    width: widthRes.value,
    height: heightRes.value,
    depth: depthRes.value,
  });

  let fieldOrigins: FieldOriginsMap = { ...expansion.fieldOrigins };
  const origins: [string, FieldOrigin][] = [
    ['name', nameRes.origin],
    ['width', widthRes.origin],
    ['height', heightRes.origin],
    ['depth', depthRes.origin],
    ['weight', weightRes.origin],
    ['powerLoss', powerLossRes.origin],
    ['coilNominalVoltage', coilVoltageRes.origin],
    ['coilVoltageType', coilTypeRes.origin],
    ['mainCurrentAmps', mainCurrentRes.origin],
    ['minCrossSec', minCrossRes.origin],
    ['maxCrossSec', maxCrossRes.origin],
    ['torqueNm', torqueRes.origin],
    ['strippingLengthMm', strippingRes.origin],
    ['terminalLevels', terminalLevelsRes.origin],
    ['connectionType', connectionTypeRes.origin],
    ['dinRailMountOffsetY', dinRailRes.origin],
    ['mountingType', mountingRes.origin],
    ['seriesName', seriesNameRes.origin],
  ];
  for (const [key, origin] of origins) fieldOrigins = setOrigin(fieldOrigins, key, origin);

  const accessoryRelations: PartAccessoryRelation[] = extractSeriesAccessories(series);
  const draft = {
    id: partId,
    version: '1.0',
    name: nameRes.value ?? `${manufacturer} ${articleNr}`,
    archetypeId: archetype.id,
    category: archetype.category,
    mountingType: mountingRes.value,
    seriesName: seriesNameRes.value,
    width: widthRes.value,
    height: heightRes.value,
    depth: depthRes.value,
    weight: weightRes.value,
    dinRailMountOffsetY: dinRailRes.value,
    powerLoss: powerLossRes.value,
    mainCurrentAmps: mainCurrentRes.value,
    coilNominalVoltage: coilVoltageRes.value,
    coilVoltageType: coilTypeRes.value,
    minCrossSec: minCrossRes.value,
    maxCrossSec: maxCrossRes.value,
    torqueNm: torqueRes.value,
    strippingLengthMm: strippingRes.value,
    connectionType: connectionTypeRes.value,
    terminalLevels: terminalLevelsRes.value,
    functionGroups: groups,
    accessoryRelations,
    fieldOrigins,
    isManuallyCurated: Object.keys(manualOverrides).length > 0,
  };

  try {
    const parsed = CatalogPartVersionSchema.parse(draft);
    const validationErrors = runErcChecks(parsed);
    const { completenessPct, qualityTier } = scoreQuality(parsed, validationErrors);
    const part: CatalogPartVersion = CatalogPartVersionSchema.parse({
      ...parsed,
      completenessPct,
      qualityTier,
    });
    const status = validationErrors.length === 0 ? 'VALIDATED' : 'ERROR';
    return { part, fieldOrigins, validationErrors, qualityTier, completenessPct, status };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      part: null,
      fieldOrigins,
      validationErrors: [message],
      qualityTier: 'BRONZE' as QualityTier,
      completenessPct: 0,
      status: 'ERROR',
    };
  }
}

function num(
  has: (field: string) => boolean,
  mv: <T>(field: string) => T | null,
  field: string,
  ai: number | null,
): { value: number | null; origin: FieldOrigin } {
  return resolveField<number>({
    manualPresent: has(field),
    manual: mv<number>(field),
    ai,
    series: null,
    arc: null,
    heu: null,
  });
}
