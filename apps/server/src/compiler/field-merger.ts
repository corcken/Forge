import type { FieldOrigin, FieldOriginsMap } from '@descriptio-forge/shared';

/** Eingabe der Prioritaets-Kaskade fuer ein einzelnes Feld. */
export interface FieldCascadeInput<T> {
  /** Manueller Override vorhanden? (auch bei explizitem null schreibgeschuetzt) */
  manualPresent: boolean;
  manual: T | null;
  ai: T | null;
  series: T | null;
  arc: T | null;
  heu: T | null;
}

/** Aufgeloester Feldwert inkl. Herkunft. */
export interface FieldResolution<T> {
  value: T | null;
  origin: FieldOrigin;
}

/**
 * Prioritaets-Kaskade gemaess Ablauf 3 (Stufe 3):
 * MAN (unantastbar) > AI > SER > ARC > HEU > NULL.
 */
export function resolveField<T>(input: FieldCascadeInput<T>): FieldResolution<T> {
  if (input.manualPresent) return { value: input.manual, origin: 'MAN' };
  if (input.ai !== null && input.ai !== undefined) return { value: input.ai, origin: 'AI' };
  if (input.series !== null && input.series !== undefined) return { value: input.series, origin: 'SER' };
  if (input.arc !== null && input.arc !== undefined) return { value: input.arc, origin: 'ARC' };
  if (input.heu !== null && input.heu !== undefined) return { value: input.heu, origin: 'HEU' };
  return { value: null, origin: 'NULL' };
}

/** Setzt die Herkunft eines Feldes unveraenderlich (immutable). */
export function setOrigin(
  map: FieldOriginsMap,
  field: string,
  origin: FieldOrigin,
): FieldOriginsMap {
  return { ...map, [field]: origin };
}

/** Erzeugt eine Helper-Funktion, die prueft ob ein Manual-Key gesetzt ist. */
export function manualHas(overrides: Record<string, unknown>, field: string): boolean {
  return Object.prototype.hasOwnProperty.call(overrides, field) && overrides[field] !== undefined;
}

/** Liest einen Manual-Override-Wert typisiert aus. */
export function manualValue<T>(overrides: Record<string, unknown>, field: string): T | null {
  if (!manualHas(overrides, field)) return null;
  return (overrides[field] as T) ?? null;
}
