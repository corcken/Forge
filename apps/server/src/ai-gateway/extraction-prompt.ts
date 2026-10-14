/**
 * Baut den JSON-Schema-Contract, den System-Prompt und die robuste
 * JSON-Extraktion fuer die KI-Faktorenextraktion. Die eigentliche Koerzierung
 * in ein validiertes `AiExtractionOutput` liegt als Helper in `@descriptio-forge/shared`.
 */
export { coerceAiExtractionOutput as coerceExtractionOutput } from '@descriptio-forge/shared';

/** JSON-Schema (Draft) fuer OpenAI `response_format: { type: 'json_schema' }`. */
export const AI_EXTRACTION_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: { type: ['string', 'null'] },
    type: { type: ['string', 'null'] },
    seriesName: { type: ['string', 'null'] },
    archetypeId: { type: ['string', 'null'] },
    width: { type: ['number', 'null'] },
    height: { type: ['number', 'null'] },
    depth: { type: ['number', 'null'] },
    weight: { type: ['number', 'null'] },
    powerLoss: { type: ['number', 'null'] },
    coilNominalVoltage: { type: ['number', 'null'] },
    coilVoltageType: {
      type: ['string', 'null'],
      enum: ['AC', 'DC', 'AC_DC', 'ANY', null],
    },
    mainCurrentAmps: { type: ['number', 'null'] },
    minCrossSec: { type: ['number', 'null'] },
    maxCrossSec: { type: ['number', 'null'] },
    torqueNm: { type: ['number', 'null'] },
    strippingLengthMm: { type: ['number', 'null'] },
    terminalLevels: { type: ['integer', 'null'] },
  },
  required: [
    'name',
    'type',
    'seriesName',
    'archetypeId',
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
    'terminalLevels',
  ],
} as const;

/** Baut den System-Prompt inkl. der erlaubten Archetyp-IDs. */
export function buildExtractionSystemPrompt(allowedArchetypeIds: string[]): string {
  return [
    'Du bist ein praeziser Extraktor fuer technische Produktdatenblaetter.',
    'Lies ausschliesslich Fakten, die im Dokument EXPLIZIT belegt sind.',
    'Erfinde niemals Werte: Ist ein Wert nicht auffindbar, setze ihn auf null.',
    'Gib Masse in mm, Gewicht in g, Verlustleistung in W, Spannungen in V und',
    'Stroeme in A an. Antworte AUSSCHLIESSLICH mit einem einzelnen JSON-Objekt',
    'nach dem vorgegebenen Schema, ohne Markdown und ohne Kommentare.',
    'Weise dem Artikel genau eine archetypeId aus dieser Liste zu:',
    allowedArchetypeIds.length > 0 ? allowedArchetypeIds.join(', ') : '(keine)',
  ].join('\n');
}

/** Baut den User-Text fuer textbasierte (nicht-PDF) Extraktion. */
export function buildExtractionUserText(sourceText: string): string {
  return `Datenblatt-Inhalt:\n${sourceText}`;
}

/** Extrahiert das erste JSON-Objekt aus einer (evtl. mit Code-Fence) Antwort. */
export function parseLooseJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = /```(?:json)?\s*([\s\S]*?)```/iu.exec(trimmed);
  const candidate = (fenced?.[1] ?? trimmed).trim();
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  const json = start >= 0 && end > start ? candidate.slice(start, end + 1) : candidate;
  return JSON.parse(json);
}
