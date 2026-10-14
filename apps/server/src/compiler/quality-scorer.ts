import type { CatalogPartVersion, QualityTier } from '@descriptio-forge/shared';

const TRACKED_FIELDS = [
  'width',
  'height',
  'depth',
  'weight',
  'powerLoss',
  'coilNominalVoltage',
  'coilVoltageType',
  'mainCurrentAmps',
  'minCrossSec',
  'maxCrossSec',
  'torqueNm',
  'strippingLengthMm',
] as const;

/**
 * ERC-Plausibilitaetspruefung (Stufe 4), z. B. jede Spule A1/A2 braucht eine
 * Nennspannung. Liefert eine Liste harter Fehler (leer = bestanden).
 */
export function runErcChecks(part: CatalogPartVersion): string[] {
  const errors: string[] = [];
  if (part.functionGroups.length === 0) {
    errors.push('Keine Funktionsgruppen vorhanden.');
    return errors;
  }
  for (const group of part.functionGroups) {
    if (group.pins.length === 0) {
      errors.push(`Funktionsgruppe ${group.groupKey} hat keine Pins.`);
      continue;
    }
    if (group.functionType === 'COIL') {
      for (const pin of group.pins) {
        if (pin.nominalVoltage === null) {
          errors.push(`Spule ${group.groupKey}/${pin.pinName}: Nennspannung fehlt.`);
        }
        if (pin.voltageType === null) {
          errors.push(`Spule ${group.groupKey}/${pin.pinName}: Spannungsart fehlt.`);
        }
      }
    }
  }
  return errors;
}

/** Vollstaendigkeitsgrad in Prozent (12 Partfelder + Gruppen + Pins). */
export function computeCompleteness(part: CatalogPartVersion): number {
  let filled = 0;
  const total = TRACKED_FIELDS.length + 2;
  for (const field of TRACKED_FIELDS) {
    if (part[field] !== null && part[field] !== undefined) filled += 1;
  }
  if (part.functionGroups.length > 0) filled += 1;
  if (part.functionGroups.some((group) => group.pins.length > 0)) filled += 1;
  return Math.round((filled / total) * 100);
}

/** Leitet aus Vollstaendigkeit und ERC-Ergebnissen das Qualitaets-Badge ab. */
export function scoreQuality(
  part: CatalogPartVersion,
  ercErrors: readonly string[],
): { completenessPct: number; qualityTier: QualityTier } {
  const completenessPct = computeCompleteness(part);
  let qualityTier: QualityTier =
    completenessPct >= 90 ? 'GOLD' : completenessPct >= 70 ? 'SILVER' : 'BRONZE';
  if (ercErrors.length > 0 && qualityTier === 'GOLD') qualityTier = 'SILVER';
  return { completenessPct, qualityTier };
}
