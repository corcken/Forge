import { z } from 'zod';
import { VoltageTypeSchema } from './origins.schema.js';

/**
 * Schlankes Schema fuer die KI-Faktenextraktion aus Datenblaettern (Stufe 2).
 *
 * Grundsatz: Die KI liefert ausschliesslich Fakten, die explizit im Datenblatt
 * belegbar sind. Jedes nicht auffindbare Feld bleibt strikt `null` - es wird
 * NIE geraten. Komplexe E-CAD-Strukturen entstehen spaeter im deterministischen
 * Regel-Compiler (Stufe 3) aus Archetyp + Baureihe.
 */
export const AiExtractionOutputSchema = z.object({
  /** Produktname / Typbezeichnung aus dem Datenblatt. */
  name: z.string().nullable(),
  /** Kurzer Typ-/Bauteilbegriff, z. B. "Schuetz", "Leitungsschutzschalter". */
  type: z.string().nullable(),
  /** Vom Datenblatt genannter Baureihen-/Familienname, z. B. "DILM7..15". */
  seriesName: z.string().nullable(),
  /** ID des zugeordneten IEC-Archetyps aus der erlaubten Liste. */
  archetypeId: z.string().nullable(),

  /** Gehaeusebreite in mm. */
  width: z.number().nullable(),
  /** Gehaeusehoehe in mm. */
  height: z.number().nullable(),
  /** Gehaeusetiefe in mm. */
  depth: z.number().nullable(),
  /** Gewicht in g. */
  weight: z.number().nullable(),
  /** Verlustleistung in W. */
  powerLoss: z.number().nullable(),

  /** Nennspannung der Spule / des Steuerkreises in V. */
  coilNominalVoltage: z.number().nullable(),
  /** Spannungsart des Steuerkreises. */
  coilVoltageType: VoltageTypeSchema.nullable(),

  /** Nennstrom des Hauptstromkreises in A. */
  mainCurrentAmps: z.number().nullable(),
  /** Minimaler Anschlussquerschnitt in mm^2. */
  minCrossSec: z.number().nullable(),
  /** Maximaler Anschlussquerschnitt in mm^2. */
  maxCrossSec: z.number().nullable(),
  /** Anzugsdrehmoment in Nm (sofern im Datenblatt genannt). */
  torqueNm: z.number().nullable(),
  /** Abisolierlaenge in mm (sofern im Datenblatt genannt). */
  strippingLengthMm: z.number().nullable(),
  /** Anzahl der Klemm-/Anschlussebenen. */
  terminalLevels: z.number().int().nullable(),
});

export type AiExtractionOutput = z.infer<typeof AiExtractionOutputSchema>;

/**
 * Umschlag mit Modell- und Token-Metadaten, wie ihn die KI-Adapter nach einem
 * Extraktions-Request zurueckgeben.
 */
export const AiExtractionEnvelopeSchema = z.object({
  data: AiExtractionOutputSchema,
  modelUsed: z.string(),
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  costUsd: z.number().nonnegative(),
});

export type AiExtractionEnvelope = z.infer<typeof AiExtractionEnvelopeSchema>;

/** Liste der vom Prompt erlaubten Archetyp-IDs zur Entitaetssteuerung. */
export const AiExtractionArchetypeListSchema = z.array(z.string()).min(1);
export type AiExtractionArchetypeList = z.infer<typeof AiExtractionArchetypeListSchema>;

/** Praktische leere Vorlage fuer neue, noch nicht extrahierte Artikel. */
export const emptyAiExtraction = (): AiExtractionOutput =>
  AiExtractionOutputSchema.parse({
    name: null,
    type: null,
    seriesName: null,
    archetypeId: null,
    width: null,
    height: null,
    depth: null,
    weight: null,
    powerLoss: null,
    coilNominalVoltage: null,
    coilVoltageType: null,
    mainCurrentAmps: null,
    minCrossSec: null,
    maxCrossSec: null,
    torqueNm: null,
    strippingLengthMm: null,
    terminalLevels: null,
  });

const STRING_FIELDS = ['name', 'type', 'seriesName', 'archetypeId'] as const;
const NUMBER_FIELDS = [
  'width',
  'height',
  'depth',
  'weight',
  'powerLoss',
  'coilNominalVoltage',
  'mainCurrentAmps',
  'minCrossSec',
  'maxCrossSec',
  'torqueNm',
  'strippingLengthMm',
] as const;

/**
 * Wandelt einen (moeglicherweise unvollstaendigen oder unsauber typisierten)
 * KI-Rohtext bzw. ein Rohobjekt robust in ein validiertes AiExtractionOutput um.
 * Numerische Strings werden konvertiert, unbekannte Felder verworfen und
 * fehlende Felder strikt auf `null` gesetzt (Grundsatz: niemals raten).
 */
export function coerceAiExtractionOutput(raw: unknown): AiExtractionOutput {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const key of STRING_FIELDS) result[key] = asString(source[key]);
  for (const key of NUMBER_FIELDS) result[key] = asNumber(source[key]);
  const voltage = VoltageTypeSchema.safeParse(source.coilVoltageType);
  result.coilVoltageType = voltage.success ? voltage.data : null;
  const levels = asNumber(source.terminalLevels);
  result.terminalLevels = levels === null ? null : Math.round(levels);
  return AiExtractionOutputSchema.parse(result);
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
