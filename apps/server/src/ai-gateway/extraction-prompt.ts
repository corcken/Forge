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
    'Du bist ein praeziser Extraktor fuer technische Produktdatenblaetter (E-CAD).',
    'Lies ausschliesslich Fakten, die im Dokument EXPLIZIT belegt sind.',
    'Erfinde niemals Werte: Ist ein Wert nicht auffindbar, setze ihn strikt auf null.',
    'Antworte AUSSCHLIESSLICH mit einem einzelnen validen JSON-Objekt mit GENAU diesen 17 Schluesseln:',
    '{',
    '  "name": string | null,              // Modellcode / Typbezeichnung (z.B. "PKZM0-25", "T0-3-15159/EA/SVB")',
    '  "type": string | null,              // Bauteilbegriff (z.B. "Motorschutzschalter", "Hauptschalter", "Schuetz")',
    '  "seriesName": string | null,        // Baureihenname (z.B. "PKZM0", "T0", "DILM")',
    '  "archetypeId": string | null,       // Exakt eine ID aus der Liste erlaubter Archetypen unten',
    '  "width": number | null,             // Produktbreite / Gehaeusebreite in mm',
    '  "height": number | null,            // Produkthoehe / Gehaeusehoehe in mm',
    '  "depth": number | null,             // Produkttiefe / Produktlaenge in mm',
    '  "weight": number | null,            // Gewicht in Gramm (g)! Falls kg angegeben: mal 1000 (z.B. 0.294 kg -> 294)',
    '  "powerLoss": number | null,         // Verlustleistung in W (z.B. Wärmeabgabe / Verlustleistung pro Pol oder gesamt)',
    '  "coilNominalVoltage": number | null,// Steuerspannung US in V (nur bei Spulen/Schuetzen/Relais, sonst null)',
    '  "coilVoltageType": "AC" | "DC" | "AC_DC" | "ANY" | null,',
    '  "mainCurrentAmps": number | null,   // Bemessungsdauerstrom Iu / Nennstrom Ie des Hauptstromkreises in A',
    '  "minCrossSec": number | null,       // Minimaler Anschlussquerschnitt Hauptstromkreis in mm2 (z.B. 1)',
    '  "maxCrossSec": number | null,       // Maximaler Anschlussquerschnitt Hauptstromkreis in mm2 (z.B. 6)',
    '  "torqueNm": number | null,          // Anzugsdrehmoment der Klemmen in Nm (falls lb-in: 1 Nm = 8.85 lb-in)',
    '  "strippingLengthMm": number | null, // Abisolierlaenge in mm',
    '  "terminalLevels": number | null     // Anzahl Klemmebenen als Ganzzahl (nur bei Reihenklemmen, sonst null)',
    '}',
    'WICHTIG zur Auswahl von "archetypeId":',
    '- Waehle fuer Hauptschalter / Lasttrennschalter / Nockenschalter (z.B. Eaton T0, P1, P3) immer einen MAIN_SWITCH_* Archetyp (passend zu Polzahl und Hilfskontakten S=NO, OE=NC).',
    '- Waehle fuer Motorschutzschalter (z.B. Eaton PKZM0) einen MSS_* Archetyp (ohne Hilfskontakte -> MSS_3P; mit 1S+1OE -> MSS_3P_1NO_1NC).',
    '- Erlaubte Werte fuer "archetypeId":',
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
